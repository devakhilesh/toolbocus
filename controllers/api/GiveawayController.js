const connection = require('../../config/db');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'my-shared-secret-key';

async function handleFileUploads(files) {
    const paths = [];
    const uploadDir = path.join(__dirname, '../../public/uploads/giveaway');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    for (const file of files) {
        const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, file.buffer);
        paths.push(`/uploads/giveaway/${fileName}`);
    }
    return paths;
}

function getUserId(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) return null;
    try {
        return jwt.verify(authHeader.substring(7), JWT_SECRET).userId;
    } catch {
        return null;
    }
}

function parseRow(r) {
    return {
        ...r,
        item_images:        JSON.parse(r.item_images        || '[]'),
        return_item_images: JSON.parse(r.return_item_images || '[]'),
    };
}

class GiveawayController {

    // ─── GET CATEGORIES ───────────────────────────────────────────
    static async getCategories(req, res) {
        try {
            const [rows] = await connection.query('SELECT * FROM categories ORDER BY id DESC');
            res.json({ success: true, message: 'Categories fetched successfully', data: rows });
        } catch (error) {
            console.error('Get categories error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch categories' });
        }
    }

    // ─── CREATE POST ──────────────────────────────────────────────
  /*  static async createPost(req, res) {
        try {
            const userId = getUserId(req);
            if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const body = req.body;

            const post_type = body.post_type?.toLowerCase();
            if (!['give', 'take'].includes(post_type)) {
                return res.status(400).json({ success: false, error: 'post_type must be "give" or "take"' });
            }

            if (!body.item_name) {
                return res.status(400).json({ success: false, error: 'item_name is required' });
            }

            const itemImagePaths   = req.files?.item_images        ? await handleFileUploads(req.files.item_images)        : [];
            const returnImagePaths = req.files?.return_item_images ? await handleFileUploads(req.files.return_item_images) : [];

            const data = {
                user_id:                 userId,
                post_type,
                flow_id:   1, 
                pickup_area:             body.pickup_area             || null,
                latitude:                body.latitude                ? parseFloat(body.latitude)        : null,
                longitude:               body.longitude               ? parseFloat(body.longitude)       : null,
                area_diameter:           parseInt(body.area_diameter  || '5'),
                trade_type:              body.trade_type              || null,
                item_name:               body.item_name,
                item_category:           body.item_category           || null,
                item_category_id:        body.item_category_id        ? parseInt(body.item_category_id)  : null,
                item_condition:          body.item_condition          || null,
                item_note:               body.item_note               || null,
                item_source:             body.item_source             || null,
                item_images:             JSON.stringify(itemImagePaths),
                return_type:             body.return_type             || null,
                price_min:               parseFloat(body.price_min   || '0'),
                price_max:               parseFloat(body.price_max   || '0'),
                is_negotiable:           body.is_negotiable === 'true' ? 1 : 0,
                return_item_name:        body.return_item_name        || null,
                return_item_category:    body.return_item_category    || null,
                return_item_condition:   body.return_item_condition   || null,
                return_item_description: body.return_item_description || null,
                return_item_source:      body.return_item_source      || null,
                return_item_images:      JSON.stringify(returnImagePaths),
                wallet_credits:          parseInt(body.wallet_credits || '0'),
                notify_partners_only:    body.notify_partners_only === 'true' ? 1 : 0,
            };

            const [result] = await connection.query('INSERT INTO giveaways SET ?', [data]);

            res.status(201).json({
                success: true,
                message: `${post_type === 'give' ? 'Give' : 'Take'} post created successfully`,
                data: {
                    id: result.insertId,
                    ...data,
                    item_images:        itemImagePaths,
                    return_item_images: returnImagePaths,
                }
            });

        } catch (error) {
            console.error('Create post error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
*/
/*static async createPost(req, res) {
    try {

        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized"
            });
        }

        const body = req.body;

        const post_type = body.post_type?.toLowerCase();
        if (!['give', 'take'].includes(post_type)) {
            return res.status(400).json({
                success: false,
                error: 'post_type must be "give" or "take"'
            });
        }

        if (!body.item_name) {
            return res.status(400).json({
                success: false,
                error: "item_name is required"
            });
        }

        

        const [sub] = await connection.query(
            `SELECT * FROM user_subscriptions
             WHERE user_id=? AND status='active'
             ORDER BY id DESC LIMIT 1`,
            [userId]
        );

        if (sub.length === 0) {
            return res.json({
                success: false,
                message: "Please purchase subscription first"
            });
        }

  
const subscription = sub[0];

// convert to numbers
const postPrice = parseFloat(subscription.post_price);
const balance = parseFloat(subscription.remaining_balance);

// check balance
if (balance < postPrice) {
    return res.json({
        success: false,
        message: "Insufficient subscription balance"
    });
}


const newBalance = balance - postPrice;

await connection.query(
`UPDATE user_subscriptions
SET remaining_balance = ?
WHERE id = ?`,
[newBalance, subscription.id]
);

       

        const itemImagePaths = req.files?.item_images
            ? await handleFileUploads(req.files.item_images)
            : [];

        const returnImagePaths = req.files?.return_item_images
            ? await handleFileUploads(req.files.return_item_images)
            : [];

       
        const data = {
            user_id: userId,
            post_type,
            flow_id: 1,
            pickup_area: body.pickup_area || null,
            latitude: body.latitude ? parseFloat(body.latitude) : null,
            longitude: body.longitude ? parseFloat(body.longitude) : null,
            area_diameter: parseInt(body.area_diameter || "5"),
            trade_type: body.trade_type || null,
            item_name: body.item_name,
            item_category: body.item_category || null,
            item_category_id: body.item_category_id
                ? parseInt(body.item_category_id)
                : null,
            item_condition: body.item_condition || null,
            item_note: body.item_note || null,
            item_source: body.item_source || null,
            item_images: JSON.stringify(itemImagePaths),
            return_type: body.return_type || null,
            price_min: parseFloat(body.price_min || "0"),
            price_max: parseFloat(body.price_max || "0"),
            is_negotiable: body.is_negotiable === "true" ? 1 : 0,
            return_item_name: body.return_item_name || null,
            return_item_category: body.return_item_category || null,
            return_item_condition: body.return_item_condition || null,
            return_item_description: body.return_item_description || null,
            return_item_source: body.return_item_source || null,
            return_item_images: JSON.stringify(returnImagePaths),
            wallet_credits: parseInt(body.wallet_credits || "0"),
            notify_partners_only: body.notify_partners_only === "true" ? 1 : 0
        };

       

        const [result] = await connection.query(
            "INSERT INTO giveaways SET ?",
            [data]
        );

      
        res.status(201).json({
            success: true,
            message: `${post_type === 'give' ? 'Give' : 'Take'} post created successfully`,
            remaining_balance: newBalance,
            data: {
                id: result.insertId,
                ...data,
                item_images: itemImagePaths,
                return_item_images: returnImagePaths
            }
        });

    } catch (error) {

        console.error("Create post error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
*/

static async createPost(req, res) {
try {

const userId = getUserId(req);
if (!userId) {
return res.status(401).json({
success: false,
error: "Unauthorized"
});
}

const body = req.body;

const post_type = body.post_type?.toLowerCase();
if (!['give','take'].includes(post_type)) {
return res.status(400).json({
success:false,
error:'post_type must be "give" or "take"'
});
}

if (!body.item_name) {
return res.status(400).json({
success:false,
error:"item_name is required"
});
}

/* ------------------------------
1️⃣ CHECK USER SUBSCRIPTION
------------------------------ */

const [sub] = await connection.query(
`SELECT * FROM user_subscriptions
WHERE user_id=? 
AND status='active'
AND end_date >= NOW()
ORDER BY id DESC LIMIT 1`,
[userId]
);

if (sub.length === 0) {
return res.json({
success:false,
message:"Please purchase subscription first"
});
}

const subscription = sub[0];

const postPrice = parseFloat(subscription.post_price);
const balance = parseFloat(subscription.remaining_balance);

/* ------------------------------
2️⃣ CHECK BALANCE
------------------------------ */

if (balance < postPrice) {
return res.json({
success:false,
message:"Insufficient subscription balance"
});
}

/* ------------------------------
3️⃣ IMAGE UPLOAD
------------------------------ */

const itemImagePaths = req.files?.item_images
? await handleFileUploads(req.files.item_images)
: [];

const returnImagePaths = req.files?.return_item_images
? await handleFileUploads(req.files.return_item_images)
: [];

/* ------------------------------
4️⃣ PREPARE DATA
------------------------------ */

const data = {
user_id: userId,
post_type,
flow_id: 1,
pickup_area: body.pickup_area || null,
latitude: body.latitude ? parseFloat(body.latitude) : null,
longitude: body.longitude ? parseFloat(body.longitude) : null,
area_diameter: parseInt(body.area_diameter || "5"),
trade_type: body.trade_type || null,
item_name: body.item_name,
item_category: body.item_category || null,
item_category_id: body.item_category_id ? parseInt(body.item_category_id) : null,
item_condition: body.item_condition || null,
item_note: body.item_note || null,
item_source: body.item_source || null,
item_images: JSON.stringify(itemImagePaths),
return_type: body.return_type || null,
price_min: parseFloat(body.price_min || "0"),
price_max: parseFloat(body.price_max || "0"),
is_negotiable: body.is_negotiable === "true" ? 1 : 0,
return_item_name: body.return_item_name || null,
return_item_category: body.return_item_category || null,
return_item_condition: body.return_item_condition || null,
return_item_description: body.return_item_description || null,
return_item_source: body.return_item_source || null,
return_item_images: JSON.stringify(returnImagePaths),
wallet_credits: parseInt(body.wallet_credits || "0"),
notify_partners_only: body.notify_partners_only === "true" ? 1 : 0
};

/* ------------------------------
5️⃣ INSERT POST
------------------------------ */

const [result] = await connection.query(
"INSERT INTO giveaways SET ?",
[data]
);

/* ------------------------------
6️⃣ DEDUCT BALANCE
------------------------------ */

const newBalance = balance - postPrice;

await connection.query(
`UPDATE user_subscriptions
SET remaining_balance = ?, 
used_posts = used_posts + 1
WHERE id = ?`,
[newBalance, subscription.id]
);

/* ------------------------------
7️⃣ RESPONSE
------------------------------ */

res.status(201).json({
success:true,
message:`${post_type === 'give' ? 'Give' : 'Take'} post created successfully`,
remaining_balance:newBalance,
data:{
id: result.insertId,
...data,
item_images:itemImagePaths,
return_item_images:returnImagePaths
}
});

} catch (error) {

console.error("Create post error:", error);

res.status(500).json({
success:false,
error:error.message
});
}
}
static async getPosts(req, res) {
  try {
    const {
      type = 'all',
      page = 1,
      limit = 10,
      category_id,
      search,
      latitude,
      longitude,
      distance_km,
    } = req.body;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [`g.status IN ('Active', 'Completed')`];
    const params = [];

    if (type === 'give' || type === 'take') {
      conditions.push(`g.post_type = ?`);
      params.push(type);
    }

    if (category_id) {
      conditions.push(`g.item_category_id = ?`);
      params.push(parseInt(category_id));
    }

    if (search) {
      conditions.push(`(g.item_name LIKE ? OR g.return_item_name LIKE ? OR g.item_note LIKE ?)`);
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    // ── Distance ────────────────────────────────────────────────
    let distanceSQL = `NULL AS distance_km`;
    let selectParams = [];  // params for SELECT clause distance calc

    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      // Always calculate distance if lat/lng provided
      distanceSQL = `ROUND(6371 * ACOS(
        COS(RADIANS(?)) * COS(RADIANS(g.latitude)) *
        COS(RADIANS(g.longitude) - RADIANS(?)) +
        SIN(RADIANS(?)) * SIN(RADIANS(g.latitude))
      ), 2) AS distance_km`;

      selectParams = [lat, lng, lat]; // for SELECT clause

      // Only filter by radius if distance_km is also passed
      if (distance_km) {
        const km = parseFloat(distance_km);
        conditions.push(`
          g.latitude IS NOT NULL AND g.longitude IS NOT NULL AND
          (6371 * ACOS(
            COS(RADIANS(?)) * COS(RADIANS(g.latitude)) *
            COS(RADIANS(g.longitude) - RADIANS(?)) +
            SIN(RADIANS(?)) * SIN(RADIANS(g.latitude))
          )) <= ?
        `);
        params.push(lat, lng, lat, km); // for WHERE clause
      }
    }

    const whereSQL = `WHERE ${conditions.join(' AND ')}`;

    // COUNT — only needs WHERE params (no selectParams)
    const [[{ total }]] = await connection.query(
      `SELECT COUNT(*) as total FROM giveaways g ${whereSQL}`,
      params
    );

    // MAIN query — selectParams first (for SELECT distance), then WHERE params
    /*const [rows] = await connection.query(
      `SELECT g.*, u.full_name as user_name,
        ${distanceSQL},
        (SELECT COUNT(*) FROM trade_responses tr 
         WHERE tr.giveaway_id = g.id AND tr.status != 'cancelled') AS response_count
       FROM giveaways g
       LEFT JOIN users u ON u.id = g.user_id
       ${whereSQL}
       ${latitude && longitude ? 'ORDER BY distance_km ASC' : 'ORDER BY g.created_at DESC'}
       LIMIT ? OFFSET ?`,
      [...selectParams, ...params, limitNum, offset]
    );*/
const [rows] = await connection.query(`
SELECT
g.*,
u.full_name as user_name,
u.phone_number,
CASE
    WHEN us.user_id IS NULL THEN 'Inactive'
    WHEN us.end_date < NOW() THEN 'Expired'
    WHEN us.remaining_balance < us.post_price THEN 'Insufficient Balance'
    WHEN us.status = 'active' AND us.end_date >= NOW() THEN 'Active'
    ELSE 'Inactive'
END AS subscription_status,

(SELECT COUNT(*)
 FROM trade_responses tr
 WHERE tr.giveaway_id = g.id
 AND tr.status != 'cancelled') AS response_count

FROM giveaways g

LEFT JOIN users u
ON u.id = g.user_id

LEFT JOIN user_subscriptions us
ON us.user_id = g.user_id
AND us.status = 'active'
AND us.end_date >= NOW()

${whereSQL}

ORDER BY g.created_at DESC

LIMIT ? OFFSET ?
`, [...params, limitNum, offset]);
    res.json({
      success: true,
      message: 'Posts fetched successfully',
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        offset,
        totalPages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1,
      },
      data: rows.map(parseRow),
    });

  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// ─── GET POSTS ────────────────────────────────────────────────
static async getPosts_old(req, res) {
    try {
        const {
            type        = 'all',
            page        = 1,
            limit       = 10,
            category_id,
            search,
            latitude,
            longitude,
            distance_km,
        } = req.body;

        const pageNum  = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const offset   = (pageNum - 1) * limitNum;

        const conditions = [`g.status = 'Active'`];
        const params = [];

        if (type === 'give' || type === 'take') {
            conditions.push(`g.post_type = ?`);
            params.push(type);
        }

        if (category_id) {
            conditions.push(`g.item_category_id = ?`);
            params.push(parseInt(category_id));
        }

        if (search) {
            conditions.push(`(g.item_name LIKE ? OR g.return_item_name LIKE ? OR g.item_note LIKE ?)`);
            const like = `%${search}%`;
            params.push(like, like, like);
        }

        // ── Distance filter ───────────────────────────────────────
        let distanceSQL  = `NULL AS distance_km`;
        let selectParams = [];

        if (latitude && longitude && distance_km) {
            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);
            const km  = parseFloat(distance_km);

            distanceSQL = `ROUND(6371 * ACOS(COS(RADIANS(?)) * COS(RADIANS(g.latitude)) * COS(RADIANS(g.longitude) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(g.latitude))), 2) AS distance_km`;

            conditions.push(`
                g.latitude IS NOT NULL AND g.longitude IS NOT NULL
                AND (6371 * ACOS(COS(RADIANS(?)) * COS(RADIANS(g.latitude)) * COS(RADIANS(g.longitude) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(g.latitude)))) <= ?
            `);
            params.push(lat, lng, lat, km);
            selectParams = [lat, lng, lat, ...params, limitNum, offset];
        } else {
            selectParams = [...params, limitNum, offset];
        }

        const whereSQL = `WHERE ${conditions.join(' AND ')}`;

        const [[{ total }]] = await connection.query(
            `SELECT COUNT(*) as total FROM giveaways g ${whereSQL}`, params
        );

        const [rows] = await connection.query(
            `SELECT g.*, u.full_name as user_name,
                    ${distanceSQL},
                    (SELECT COUNT(*) FROM trade_responses tr
                     WHERE tr.giveaway_id = g.id
                     AND tr.status != 'cancelled') AS response_count
             FROM giveaways g
             LEFT JOIN users u ON u.id = g.user_id
             ${whereSQL}
             ${latitude && longitude ? 'ORDER BY distance_km ASC' : 'ORDER BY g.created_at DESC'}
             LIMIT ? OFFSET ?`,
            selectParams
        );

        res.json({
            success: true,
            message: 'Posts fetched successfully',
            pagination: {
                total,
                page:       pageNum,
                limit:      limitNum,
                offset,
                totalPages: Math.ceil(total / limitNum),
                hasNext:    pageNum < Math.ceil(total / limitNum),
                hasPrev:    pageNum > 1,
            },
            data: rows.map(parseRow),
        });

    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
    // ─── GET POSTS ────────────────────────────────────────────────
  

   
    // ─── GET POST BY ID ───────────────────────────────────────────
static async getPostById(req, res) {
    try {
        const userId = getUserId(req); // ← GET LOGGED IN USER

        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0) 
            return res.status(400).json({ success: false, error: 'Invalid ID' });

        const [rows] = await connection.query(
            `SELECT g.*, u.full_name as user_name
             FROM giveaways g
             LEFT JOIN users u ON u.id = g.user_id
            WHERE g.id = ? AND g.status IN ('Active', 'Completed')`,
            [id]
        );

        if (!rows.length) 
            return res.status(404).json({ success: false, error: 'Post not found' });

        // ── Check if logged in user already responded ──
        let has_responded = false;
        if (userId) {
            const [[existing]] = await connection.query(
                `SELECT id FROM trade_responses 
                 WHERE giveaway_id = ? 
                 AND responder_user_id = ? 
                 AND status != 'cancelled'`,
                [id, userId]
            );
            has_responded = !!existing; // true if found, false if not
        }

        res.json({ 
            success: true, 
            data: {
                ...parseRow(rows[0]),
                has_responded  // ← NEW KEY ADDED
            }
        });

    } catch (error) {
        console.error('Get post by ID error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch post' });
    }
}


    // ─── GET MY POSTS ─────────────────────────────────────────────
    static async getMyPosts(req, res) {
        try {
            const userId = getUserId(req);
            if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const {
                type  = 'all',
                page  = 1,
                limit = 10,
            } = req.body;

            const pageNum  = Math.max(1, parseInt(page));
            const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
            const offset   = (pageNum - 1) * limitNum;

            const conditions = [`g.status != 'Deleted'`, `g.user_id = ?`];
            const params = [userId];

            if (type === 'give' || type === 'take') {
                conditions.push(`g.post_type = ?`);
                params.push(type);
            }

            const whereSQL = `WHERE ${conditions.join(' AND ')}`;

            const [[{ total }]] = await connection.query(
                `SELECT COUNT(*) as total FROM giveaways g ${whereSQL}`, params
            );

            const [rows] = await connection.query(
                `SELECT g.*, u.full_name as user_name
                 FROM giveaways g
                 LEFT JOIN users u ON u.id = g.user_id
                 ${whereSQL}
                 ORDER BY g.created_at DESC
                 LIMIT ? OFFSET ?`,
                [...params, limitNum, offset]
            );

            res.json({
                success: true,
                message: 'My posts fetched successfully',
                pagination: {
                    total,
                    page:       pageNum,
                    limit:      limitNum,
                    offset,
                    totalPages: Math.ceil(total / limitNum),
                    hasNext:    pageNum < Math.ceil(total / limitNum),
                    hasPrev:    pageNum > 1,
                },
                data: rows.map(parseRow),
            });

        } catch (error) {
            console.error('Get my posts error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch your posts' });
        }
    }

    // ─── UPDATE POST ──────────────────────────────────────────────
    static async updatePost(req, res) {
        try {
            const userId = getUserId(req);
            if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const id = parseInt(req.params.id);
            if (isNaN(id) || id <= 0) return res.status(400).json({ success: false, error: 'Invalid ID' });

            const body = { ...req.body };
            delete body.post_type;
            delete body.user_id;

            if (req.files?.item_images) {
                body.item_images = JSON.stringify(await handleFileUploads(req.files.item_images));
            }
            if (req.files?.return_item_images) {
                body.return_item_images = JSON.stringify(await handleFileUploads(req.files.return_item_images));
            }

            body.updated_at = new Date();

            const [result] = await connection.query(
                'UPDATE giveaways SET ? WHERE id = ? AND user_id = ?',
                [body, id, userId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, error: 'Post not found or unauthorized' });
            }

            res.json({ success: true, message: 'Post updated successfully' });

        } catch (error) {
            console.error('Update post error:', error);
            res.status(500).json({ success: false, error: 'Failed to update post' });
        }
    }

    // ─── DELETE POST ──────────────────────────────────────────────
    static async deletePost(req, res) {
        try {
            const userId = getUserId(req);
            if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const id = parseInt(req.params.id);
            if (isNaN(id) || id <= 0) return res.status(400).json({ success: false, error: 'Invalid ID' });

            const [result] = await connection.query(
                `UPDATE giveaways SET status = 'Deleted' WHERE id = ? AND user_id = ?`,
                [id, userId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, error: 'Post not found or unauthorized' });
            }

            res.json({ success: true, message: 'Post deleted successfully' });

        } catch (error) {
            console.error('Delete post error:', error);
            res.status(500).json({ success: false, error: 'Failed to delete post' });
        }
    }
}

module.exports = GiveawayController;

