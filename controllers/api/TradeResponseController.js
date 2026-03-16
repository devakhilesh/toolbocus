const connection = require('../../config/db');
const jwt        = require('jsonwebtoken');
const fs         = require('fs');
const path       = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'my-shared-secret-key';

// ─── Auth helper ──────────────────────────────────────────────────────────────
function getUserId(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) return null;
    try {
        return jwt.verify(authHeader.substring(7), JWT_SECRET).userId;
    } catch {
        return null;
    }
}

// ─── File upload helper ───────────────────────────────────────────────────────
async function handleFileUploads(files) {
    const paths     = [];
    const uploadDir = path.join(__dirname, '../../public/uploads/trade_responses');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    for (const file of files) {
        const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, file.buffer);
        paths.push(`/uploads/trade_responses/${fileName}`);
    }
    return paths;
}

class TradeResponseController {

    // ──────────────────────────────────────────────────────────────────────────
    // SCREEN: Respond 15 / 16
    // Radha sees Rutuja's Take post → Radha fills her giving item details
    // + what she wants in return (item / money / free)
    //
    // POST /api/trade/respond/:giveaway_id
    // Body (form-data):
    //   giving_item_name, giving_item_category, giving_item_category_id,
    //   giving_item_condition, giving_item_images (file[]),
    //   giving_item_note, giving_is_homemade, giving_is_store_bought,
    //   return_type (item | money | free),
    //   return_item_name, return_item_category, return_item_condition,
    //   offer_price, offer_is_negotiable, notify_poster
    // ──────────────────────────────────────────────────────────────────────────
    
static async respondToPost(req, res) {
    try {
        const responderId = getUserId(req);
        if (!responderId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const giveawayId = parseInt(req.params.giveaway_id);
        if (isNaN(giveawayId) || giveawayId <= 0)
            return res.status(400).json({ success: false, error: 'Invalid giveaway ID' });

        // 1. Check giveaway exists and is Active
        const [[giveaway]] = await connection.query(
            `SELECT id, user_id, item_name, item_images, item_category,
                    item_category_id, item_condition FROM giveaways WHERE id = ? AND status = 'Active'`,
            [giveawayId]
        );
        if (!giveaway)
            return res.status(404).json({ success: false, error: 'Post not found or not active' });

        // 2. Post owner cannot respond to their own post
        if (giveaway.user_id === responderId)
            return res.status(400).json({ success: false, error: 'You cannot respond to your own post' });

        // 3. Only ONE pending response per responder per giveaway
        const [[existing]] = await connection.query(
            `SELECT id FROM trade_responses
             WHERE giveaway_id = ? AND responder_user_id = ? AND status = 'pending'`,
            [giveawayId, responderId]
        );
        if (existing)
            return res.status(409).json({
                success: false,
                error: 'You already have a pending offer on this post. Cancel it first.',
                existing_response_id: existing.id
            });

        // 4. Validate return_type
       // 4. Validate return_type
const return_type = req.body.return_type;
if (!return_type || !['item', 'price', 'free', 'existing'].includes(return_type))
    return res.status(400).json({ success: false, error: 'return_type required: item | price | free | existing' });

// 5. Conditional validation
if (return_type === 'item' && !req.body.item_name)
    return res.status(400).json({ success: false, error: 'item_name is required when return_type is item' });

if (return_type === 'price' && !req.body.price_range_start)
    return res.status(400).json({ success: false, error: 'price_range_start is required when return_type is price' });

// free and existing → no extra fields needed ✅

        // 6. Handle return item images (responder's item photos)
        const returnImagePaths = req.files?.images
            ? await handleFileUploads(req.files.images)
            : [];

        const body = req.body;

        const data = {
            giveaway_id:             giveawayId,
            poster_user_id:          giveaway.user_id,
            responder_user_id:       responderId,

            // ✅ Auto-filled from giveaway (Ice Cream — poster's item)
            giving_item_name:        giveaway.item_name,
            giving_item_category:    giveaway.item_category    || null,
            giving_item_category_id: giveaway.item_category_id || null,
            giving_item_condition:   giveaway.item_condition    || null,
            giving_item_images:      giveaway.item_images       || '[]',

            // ✅ Responder sends these (Orange — return item)
            return_type,
            return_item_name:        body.item_name        || null,
            return_item_category:    body.category_id      || null,
            return_item_condition:   body.condition        || null,
            return_item_description: body.description      || null,
            return_is_homemade:      body.is_homemade     === 'true' ? 1 : 0,
            return_is_store_bought:  body.is_store_bought === 'true' ? 1 : 0,
            return_item_images:      JSON.stringify(returnImagePaths),

            // Price fields
            price_range_start:       parseFloat(body.price_range_start || '0'),
            price_range_end:         parseFloat(body.price_range_end   || '0'),
            offer_is_negotiable:     body.is_negotiable === 'true' ? 1 : 0,

            notify_poster:           body.notify_poster === 'true' ? 1 : 0,
            status:                  'pending',
            flow_id: 2,
        };

        const [result] = await connection.query('INSERT INTO trade_responses SET ?', [data]);

        res.status(201).json({
            success: true,
            message: 'Your offer has been sent! Waiting for the post owner to respond.',
            data: {
                id: result.insertId,
                ...data,
                giving_item_images: JSON.parse(giveaway.item_images || '[]'),
                return_item_images: returnImagePaths,
            }
        });

    } catch (error) {
        console.error('Respond to post error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
    // ──────────────────────────────────────────────────────────────────────────
    // SCREEN: Respond 7
    // Rutuja sees ALL responses on her post
    //
    // GET /api/trade/responses/:giveaway_id
    // ──────────────────────────────────────────────────────────────────────────
    static async getPostResponses(req, res) {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const giveawayId = parseInt(req.params.giveaway_id);
        if (isNaN(giveawayId) || giveawayId <= 0)
            return res.status(400).json({ success: false, error: 'Invalid giveaway ID' });

        // ✅ Removed AND status = 'Active'
        const [[giveaway]] = await connection.query(
            `SELECT id, user_id, item_name, item_images FROM giveaways WHERE id = ?`,
            [giveawayId]
        );
        if (!giveaway)
            return res.status(404).json({ success: false, error: 'Post not found' });

        if (giveaway.user_id !== userId)
            return res.status(403).json({ success: false, error: 'You can only view responses on your own posts' });

        const [responses] = await connection.query(
    `SELECT tr.*,
            u.full_name AS responder_name
     FROM trade_responses tr
     LEFT JOIN users u ON u.id = tr.responder_user_id
     WHERE tr.giveaway_id = ?
     ORDER BY tr.created_at DESC`,
    [giveawayId]
);

        // ✅ Safe JSON parse - won't crash on NULL
        const safeJson = (val) => {
            try { return JSON.parse(val || '[]'); } catch (e) { return []; }
        };

        res.json({
            success: true,
            message: 'Responses fetched successfully',
            giveaway: {
                id:          giveaway.id,
                item_name:   giveaway.item_name,
                item_images: safeJson(giveaway.item_images),
            },
            total: responses.length,
            data: responses.map(r => ({
                ...r,
                giving_item_images: safeJson(r.giving_item_images),
            }))
        });

    } catch (error) {
        console.error('Get post responses error:', error);
        res.status(500).json({ success: false, error: error.message }); // ✅ shows real error
    }
}


    // ──────────────────────────────────────────────────────────────────────────
    // SCREEN: Respond 8 / 17
    // Rutuja accepts Radha's response + chooses meeting preference
    //
    // POST /api/trade/accept/:response_id
    // Body:
    //   meeting_type: come_to_me | i_pick_up | centre_point
    //   meeting_location, meeting_latitude, meeting_longitude,
    //   meeting_scheduled_at
    // ──────────────────────────────────────────────────────────────────────────
    static async acceptResponse(req, res) {
        try {
            const userId = getUserId(req);
            if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const responseId = parseInt(req.params.response_id);
            if (isNaN(responseId) || responseId <= 0)
                return res.status(400).json({ success: false, error: 'Invalid response ID' });

            const [[tradeResponse]] = await connection.query(
                `SELECT tr.*, g.item_name AS post_item_name
                 FROM trade_responses tr
                 LEFT JOIN giveaways g ON g.id = tr.giveaway_id
                 WHERE tr.id = ?`,
                [responseId]
            );
            if (!tradeResponse)
                return res.status(404).json({ success: false, error: 'Response not found' });

            // Only Rutuja (poster) can accept
            if (tradeResponse.poster_user_id !== userId)
                return res.status(403).json({ success: false, error: 'Only the post owner can accept offers' });

            if (tradeResponse.status !== 'pending')
                return res.status(400).json({ success: false, error: `Cannot accept. Current status: ${tradeResponse.status}` });

            const meeting_type = req.body.meeting_type;
            if (!meeting_type || !['come_to_me', 'i_pick_up', 'centre_point'].includes(meeting_type))
                return res.status(400).json({ success: false, error: 'meeting_type required: come_to_me | i_pick_up | centre_point' });

            await connection.query(
                `UPDATE trade_responses SET
                    status               = 'accepted',
                    meeting_type         = ?,
                    meeting_location     = ?,
                    meeting_latitude     = ?,
                    meeting_longitude    = ?,
                    meeting_scheduled_at = ?,
                    updated_at           = NOW()
                 WHERE id = ?`,
                [
                    meeting_type,
                    req.body.meeting_location     || null,
                    req.body.meeting_latitude     ? parseFloat(req.body.meeting_latitude)  : null,
                    req.body.meeting_longitude    ? parseFloat(req.body.meeting_longitude) : null,
                    req.body.meeting_scheduled_at || null,
                    responseId
                ]
            );

            // Fetch updated full record
            const [[updated]] = await connection.query(
                `SELECT tr.*,
                        poster.full_name    AS poster_name,
                        responder.full_name AS responder_name
                 FROM trade_responses tr
                 LEFT JOIN users poster    ON poster.id    = tr.poster_user_id
                 LEFT JOIN users responder ON responder.id = tr.responder_user_id
                 WHERE tr.id = ?`,
                [responseId]
            );

            // show payment popup if money involved
            const show_payment_popup =
                tradeResponse.return_type === 'money' || tradeResponse.offer_price > 0;

            res.json({
                success: true,
                message: 'Offer accepted! Meeting preference saved.',
                show_payment_popup,
                payment_amount: tradeResponse.offer_price,
             data: {
    ...updated,
    giving_item_images: (() => { try { return JSON.parse(updated.giving_item_images || '[]'); } catch(e) { return []; } })(),
}
            });

        } catch (error) {
            console.error('Accept response error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // SCREEN: Respond 9 — Payment popup "Yes" button
    //
    // POST /api/trade/confirm-payment/:response_id
    // Body: payment_amount (optional)
    // ──────────────────────────────────────────────────────────────────────────
    static async confirmPayment(req, res) {
        try {
            const userId = getUserId(req);
            if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const responseId = parseInt(req.params.response_id);
            if (isNaN(responseId) || responseId <= 0)
                return res.status(400).json({ success: false, error: 'Invalid response ID' });

            const [[tradeResponse]] = await connection.query(
                `SELECT * FROM trade_responses WHERE id = ?`, [responseId]
            );
            if (!tradeResponse)
                return res.status(404).json({ success: false, error: 'Trade response not found' });

            if (tradeResponse.poster_user_id !== userId)
                return res.status(403).json({ success: false, error: 'Not authorized' });

            if (tradeResponse.status !== 'accepted')
                return res.status(400).json({ success: false, error: 'Trade must be accepted before confirming payment' });

            const payment_amount = parseFloat(req.body.payment_amount || tradeResponse.offer_price || '0');

            await connection.query(
                `UPDATE trade_responses SET
                    payment_confirmed = 1,
                    payment_amount    = ?,
                    status            = 'meeting_set',
                    updated_at        = NOW()
                 WHERE id = ?`,
                [payment_amount, responseId]
            );

            res.json({
                success: true,
                message: 'Payment confirmed! Trade is set for meetup. 🎉',
                data: {
                    response_id:       responseId,
                    payment_confirmed: true,
                    payment_amount,
                    status:            'meeting_set'
                }
            });

        } catch (error) {
            console.error('Confirm payment error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Rutuja OR Radha rejects
    //
    // POST /api/trade/reject/:response_id
    // Body: rejected_reason (optional)
    // ──────────────────────────────────────────────────────────────────────────
    static async rejectResponse(req, res) {
        try {
            const userId = getUserId(req);
            if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const responseId = parseInt(req.params.response_id);
            if (isNaN(responseId) || responseId <= 0)
                return res.status(400).json({ success: false, error: 'Invalid response ID' });

            const [[tradeResponse]] = await connection.query(
                `SELECT * FROM trade_responses WHERE id = ?`, [responseId]
            );
            if (!tradeResponse)
                return res.status(404).json({ success: false, error: 'Trade response not found' });

            if (tradeResponse.poster_user_id !== userId && tradeResponse.responder_user_id !== userId)
                return res.status(403).json({ success: false, error: 'Not authorized to reject this trade' });

            if (!['pending', 'accepted'].includes(tradeResponse.status))
                return res.status(400).json({ success: false, error: `Cannot reject. Status: ${tradeResponse.status}` });

            await connection.query(
                `UPDATE trade_responses SET
                    status          = 'rejected',
                    rejected_by     = ?,
                    rejected_reason = ?,
                    updated_at      = NOW()
                 WHERE id = ?`,
                [userId, req.body.rejected_reason || null, responseId]
            );

            res.json({
                success: true,
                message: 'Offer rejected.',
                data: { response_id: responseId, rejected_by: userId, status: 'rejected' }
            });

        } catch (error) {
            console.error('Reject response error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Radha cancels her own pending offer
    //
    // POST /api/trade/cancel/:response_id
    // ──────────────────────────────────────────────────────────────────────────
    static async cancelResponse(req, res) {
        try {
            const userId = getUserId(req);
            if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const responseId = parseInt(req.params.response_id);
            if (isNaN(responseId) || responseId <= 0)
                return res.status(400).json({ success: false, error: 'Invalid response ID' });

            const [[tradeResponse]] = await connection.query(
                `SELECT * FROM trade_responses WHERE id = ?`, [responseId]
            );
            if (!tradeResponse)
                return res.status(404).json({ success: false, error: 'Trade response not found' });

            if (tradeResponse.responder_user_id !== userId)
                return res.status(403).json({ success: false, error: 'Only the offer sender can cancel it' });

            if (tradeResponse.status !== 'pending')
                return res.status(400).json({ success: false, error: 'Only pending offers can be cancelled' });

            await connection.query(
                `UPDATE trade_responses SET status = 'cancelled', updated_at = NOW() WHERE id = ?`,
                [responseId]
            );

            res.json({
                success: true,
                message: 'Your offer has been cancelled.',
                data: { response_id: responseId, status: 'cancelled' }
            });

        } catch (error) {
            console.error('Cancel response error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Mark trade as completed after physical meetup
    //
    // POST /api/trade/complete/:response_id
    // ──────────────────────────────────────────────────────────────────────────
  static async completeTrade(req, res) {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
        const responseId = parseInt(req.params.response_id);
        if (isNaN(responseId) || responseId <= 0)
            return res.status(400).json({ success: false, error: 'Invalid response ID' });
        const [[tradeResponse]] = await connection.query(
            `SELECT * FROM trade_responses WHERE id = ?`, [responseId]
        );
        if (!tradeResponse)
            return res.status(404).json({ success: false, error: 'Trade response not found' });
        if (tradeResponse.poster_user_id !== userId && tradeResponse.responder_user_id !== userId)
            return res.status(403).json({ success: false, error: 'Not authorized' });
        const amount = parseFloat(req.body.amount || tradeResponse.payment_amount || tradeResponse.offer_price || tradeResponse.price_range_start || 0);
        await connection.query(
            `UPDATE trade_responses SET 
                status         = 'completed', 
                flow_id        = 4, 
                payment_amount = ?,
                updated_at     = NOW() 
             WHERE id = ?`,
            [amount, responseId]
        );
        await connection.query(
            `UPDATE giveaways SET status = 'Completed' WHERE id = ?`,
            [tradeResponse.giveaway_id]
        );
        res.json({
            success: true,
            message: 'Trade completed successfully!',
            data: {
                trade_id:          responseId,
                amount:            amount,
                is_trade_complete: true,
            }
        });
    } catch (error) {
        console.error('Complete trade error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

    // ──────────────────────────────────────────────────────────────────────────
    // Get all trades for logged-in user (as poster or responder)
    //
    // GET /api/trade/my-trades?role=poster|responder|all&status=pending
    // ──────────────────────────────────────────────────────────────────────────
    static async getMyTrades(req, res) {
        try {
            const userId = getUserId(req);
            if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const { status, role = 'all' } = req.query;
            let whereClause = '';
            const params    = [];

            if (role === 'poster') {
                whereClause = 'WHERE tr.poster_user_id = ?';
                params.push(userId);
            } else if (role === 'responder') {
                whereClause = 'WHERE tr.responder_user_id = ?';
                params.push(userId);
            } else {
                whereClause = 'WHERE (tr.poster_user_id = ? OR tr.responder_user_id = ?)';
                params.push(userId, userId);
            }

            if (status) {
                whereClause += ' AND tr.status = ?';
                params.push(status);
            }

            const [trades] = await connection.query(
                `SELECT tr.*,
                        g.item_name,
                        g.item_images,
                        g.post_type,
                        poster.full_name    AS poster_name,
                        responder.full_name AS responder_name
                 FROM trade_responses tr
                 LEFT JOIN giveaways g      ON g.id        = tr.giveaway_id
                 LEFT JOIN users poster     ON poster.id   = tr.poster_user_id
                 LEFT JOIN users responder  ON responder.id = tr.responder_user_id
                 ${whereClause}
                 ORDER BY tr.updated_at DESC`,
                params
            );

            res.json({
                success: true,
                message: 'My trades fetched successfully',
                total: trades.length,
                data: trades.map(t => ({
                    ...t,
                    giving_item_images: JSON.parse(t.giving_item_images || '[]'),
                    item_images:        JSON.parse(t.item_images         || '[]'),
                }))
            });

        } catch (error) {
            console.error('Get my trades error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch trades' });
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Get single trade response detail
    //
    // GET /api/trade/:response_id
    // ──────────────────────────────────────────────────────────────────────────
    static async getTradeById(req, res) {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const responseId = parseInt(req.params.response_id);
        if (isNaN(responseId) || responseId <= 0)
            return res.status(400).json({ success: false, error: 'Invalid response ID' });

        const [[trade]] = await connection.query(
            `SELECT tr.*,
                    g.item_name,
                    g.post_type,
                    g.return_type       AS post_return_type,
                    poster.full_name    AS poster_name,
                    responder.full_name AS responder_name
             FROM trade_responses tr
             LEFT JOIN giveaways g      ON g.id        = tr.giveaway_id
             LEFT JOIN users poster     ON poster.id   = tr.poster_user_id
             LEFT JOIN users responder  ON responder.id = tr.responder_user_id
             WHERE tr.id = ?
               AND (tr.poster_user_id = ? OR tr.responder_user_id = ?)`,
            [responseId, userId, userId]
        );

        if (!trade)
            return res.status(404).json({ success: false, error: 'Trade not found or access denied' });

        res.json({
            success: true,
            data: {
                ...trade,
                giving_item_images: (() => {
                    try { return JSON.parse(trade.giving_item_images || '[]'); }
                    catch(e) { return []; }
                })(),
                return_item_images: (() => {
                    try { return JSON.parse(trade.return_item_images || '[]'); }
                    catch(e) { return []; }
                })(),
            }
        });

    } catch (error) {
        console.error('Get trade by ID error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
    
    
static async updateResponseStatus(req, res) {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const { response_id, status, meeting_type} = req.body;

        if (!response_id || !status)
            return res.status(400).json({ success: false, error: 'response_id and status are required' });

        if (!['accepted', 'rejected'].includes(status))
            return res.status(400).json({ success: false, error: 'status must be: accepted or rejected' });

        const [[tradeResponse]] = await connection.query(
            `SELECT * FROM trade_responses WHERE id = ?`, [response_id]
        );
        if (!tradeResponse)
            return res.status(404).json({ success: false, error: 'Response not found' });

        if (tradeResponse.poster_user_id !== userId)
            return res.status(403).json({ success: false, error: 'Only the post owner can accept or reject' });

        if (tradeResponse.status !== 'pending')
            return res.status(400).json({ success: false, error: `Cannot update. Current status: ${tradeResponse.status}` });

        if (status === 'accepted') {
            // const validPreferences = ['Come to me', 'I Pick Up', 'Centre Point'];
            const validPreferences = ['come_to_me', 'i_pick_up', 'centre_point'];
            if (meeting_type && !validPreferences.includes(meeting_type))
                return res.status(400).json({ success: false, error: 'meeting_type must be: Come to me | I Pick Up | Centre Point' });

            await connection.query(
                `UPDATE trade_responses SET
                    status             = 'accepted',
                    meeting_type = ?,
                    flow_id    = 3,
                    updated_at         = NOW()
                 WHERE id = ?`,
                [meeting_type || null, response_id]
            );
        } else {
            await connection.query(
                `UPDATE trade_responses SET
                    status      = 'rejected',
                    rejected_by = ?,
                    flow_id     = 3,
                    updated_at  = NOW()
                 WHERE id = ?`,
                [userId, response_id]
            );
        }

        res.json({
            success: true,
            message: status === 'accepted' ? 'Offer accepted successfully!' : 'Offer rejected.',
            data: { response_id, status, meeting_type: meeting_type || null }
        });

    } catch (error) {
        console.error('Update response status error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}


// ──────────────────────────────────────────────────────────────────────────
// Get all responses across all my posts
// GET /api/my-post-responses
// ──────────────────────────────────────────────────────────────────────────
static async getMyPostResponses(req, res) {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const [responses] = await connection.query(
            `SELECT tr.*,
                    g.item_name   AS post_item_name,
                    g.item_images AS post_item_images,
                    g.post_type,
                    u.full_name   AS responder_name
                   
             FROM trade_responses tr
             LEFT JOIN giveaways g ON g.id = tr.giveaway_id
             LEFT JOIN users u     ON u.id = tr.responder_user_id
             WHERE tr.poster_user_id = ?
             AND tr.status != 'cancelled'
             ORDER BY tr.created_at DESC`,
            [userId]
        );

        const safeJson = (val) => {
            try { return JSON.parse(val || '[]'); } catch (e) { return []; }
        };

        res.json({
            success: true,
            message: 'All responses on your posts fetched successfully',
            total:   responses.length,
            data:    responses.map(r => ({
                ...r,
                giving_item_images: safeJson(r.giving_item_images),
                post_item_images:   safeJson(r.post_item_images),
            }))
        });

    } catch (error) {
        console.error('Get my post responses error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}


static async getTradeFlow(req, res) {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const responderId = parseInt(req.params.responder_id);

        const [responses] = await connection.query(
            `SELECT tr.*,
                    u.full_name   AS responder_name,
                    g.item_name   AS post_item_name,
                    g.item_images AS post_item_images
             FROM trade_responses tr
             LEFT JOIN users u     ON u.id  = tr.responder_user_id
             LEFT JOIN giveaways g ON g.id  = tr.giveaway_id
             WHERE tr.responder_user_id = ?
             ORDER BY tr.created_at DESC`,
            [responderId]
        );

        const safeJson = (val) => {
            try { return JSON.parse(val || '[]'); } catch (e) { return []; }
        };

        res.json({
            success:      true,
            responder_id: responderId,
            total:        responses.length,
            data: responses.map(r => ({
                response_id:       r.id,
                giveaway_id:       r.giveaway_id,
                responder_user_id: r.responder_user_id,
                responder_name:    r.responder_name,
                flow_id:           r.flow_id,
                flow_label:        r.flow_id === 1 ? 'Post Created'
                                 : r.flow_id === 2 ? 'User Responded'
                                 : r.flow_id === 3 ? 'Owner Responded Back'
                                 : r.flow_id === 4 ? 'Trade Closed'
                                 : 'Unknown',
                status:            r.status,
                is_accepted:       r.status === 'accepted' ? true
                                 : r.status === 'rejected' ? false
                                 : null,
                post_item_name:     r.post_item_name,
                post_item_images:   safeJson(r.post_item_images),
                giving_item_images: safeJson(r.giving_item_images),
                created_at:         r.created_at,
            }))
        });

    } catch (error) {
        console.error('Get trade flow error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}


// GET /api/trade/my-responses
// All posts that the logged-in user has responded to
static async getMyResponses(req, res) {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const [responses] = await connection.query(
            `SELECT tr.*,
                    g.item_name   AS post_item_name,
                    g.item_images AS post_item_images,
                    g.post_type,
                    u.full_name   AS poster_name
             FROM trade_responses tr
             LEFT JOIN giveaways g ON g.id = tr.giveaway_id
             LEFT JOIN users u     ON u.id = tr.poster_user_id
             WHERE tr.responder_user_id = ?
             AND tr.status != 'cancelled'
             ORDER BY tr.created_at DESC`,
            [userId]
        );

        const safeJson = (val) => {
            try { return JSON.parse(val || '[]'); } catch (e) { return []; }
        };

        res.json({
            success: true,
            message: 'All posts you have responded to fetched successfully',
            total:   responses.length,
            data:    responses.map(r => ({
                ...r,
                return_item_images: safeJson(r.return_item_images),
                post_item_images:   safeJson(r.post_item_images),
            }))
        });

    } catch (error) {
        console.error('Get my responses error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}



}

module.exports = TradeResponseController;