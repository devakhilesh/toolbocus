const connection = require('../../config/db');
const jwt        = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'my-shared-secret-key';

function getUserId(req) {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) return null;
    try {
        return jwt.verify(authHeader.substring(7), JWT_SECRET).userId;
    } catch {
        return null;
    }
}

// auto update avg_stars and total_ratings in users table
async function updateUserAvg(owner_id) {
    try {
        console.log('updateUserAvg called for:', owner_id);

        // Step 1: get avg and total from ratings table
        const [rows] = await connection.query(
            `SELECT 
                COUNT(*)             as total,
                ROUND(AVG(stars), 1) as avg
             FROM ratings 
             WHERE owner_id = ?`,
            [owner_id]
        );

        const avg   = rows[0].avg   || 0;
        const total = rows[0].total || 0;

        console.log('avg:', avg, 'total:', total);

        // Step 2: update users table separately
        const [update] = await connection.query(
            `UPDATE users SET avg_stars = ?, total_ratings = ? WHERE id = ?`,
            [avg, total, owner_id]
        );

        console.log('affectedRows:', update.affectedRows);

    } catch (err) {
        console.error('updateUserAvg error:', err.message);
    }
}

class RatingController {

    // ADD RATING
    // POST /add_rating
    // Body: { owner_id, stars, review }
    static async addRating(req, res) {
        try {
            const rater_id = getUserId(req);
            if (!rater_id) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const { owner_id, stars, review } = req.body;

            if (!owner_id) return res.status(400).json({ success: false, error: 'owner_id is required' });
            if (!stars)    return res.status(400).json({ success: false, error: 'stars is required' });

            const starsVal   = parseInt(stars);
            const ownerIdVal = parseInt(owner_id);

            if (isNaN(starsVal) || starsVal < 1 || starsVal > 5) {
                return res.status(400).json({ success: false, error: 'stars must be 1, 2, 3, 4 or 5' });
            }

            // cant rate yourself
            if (ownerIdVal === rater_id) {
                return res.status(400).json({ success: false, error: 'Cannot rate yourself' });
            }

            // check user exists
            const [user] = await connection.query(
                `SELECT id FROM users WHERE id = ?`, [ownerIdVal]
            );
            if (!user.length) return res.status(404).json({ success: false, error: 'User not found' });

            // already rated
            // const [exists] = await connection.query(
            //     `SELECT id FROM ratings WHERE owner_id = ? AND rater_id = ?`,
            //     [ownerIdVal, rater_id]
            // );
            // if (exists.length) {
            //     return res.status(400).json({ success: false, error: 'You already rated this user' });
            // }

            const [result] = await connection.query('INSERT INTO ratings SET ?', [{
                owner_id: ownerIdVal,
                rater_id,
                stars:    starsVal,
                review:   review || null,
            }]);

            // update avg in users table
            await updateUserAvg(ownerIdVal);

            res.status(201).json({
                success: true,
                message: 'Rating added successfully',
                data: {
                    id:       result.insertId,
                    owner_id: ownerIdVal,
                    rater_id,
                    stars:    starsVal,
                    review:   review || null,
                }
            });

        } catch (error) {
            console.error('Add rating error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // EDIT RATING
    // POST /edit_rating/:id
    // Body: { stars, review }
    static async editRating(req, res) {
        try {
            const rater_id = getUserId(req);
            if (!rater_id) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const id = parseInt(req.params.id);
            if (isNaN(id) || id <= 0) return res.status(400).json({ success: false, error: 'Invalid ID' });

            const { stars, review } = req.body;
            if (!stars) return res.status(400).json({ success: false, error: 'stars is required' });

            const starsVal = parseInt(stars);
            if (isNaN(starsVal) || starsVal < 1 || starsVal > 5) {
                return res.status(400).json({ success: false, error: 'stars must be 1, 2, 3, 4 or 5' });
            }

            // get owner_id before update
            const [row] = await connection.query(
                `SELECT owner_id FROM ratings WHERE id = ? AND rater_id = ?`,
                [id, rater_id]
            );
            if (!row.length) return res.status(404).json({ success: false, error: 'Rating not found or unauthorized' });

            await connection.query(
                `UPDATE ratings SET stars = ?, review = ?, updated_at = NOW() WHERE id = ? AND rater_id = ?`,
                [starsVal, review || null, id, rater_id]
            );

            // update avg in users table
            await updateUserAvg(row[0].owner_id);

            res.json({ success: true, message: 'Rating updated successfully' });

        } catch (error) {
            console.error('Edit rating error:', error);
            res.status(500).json({ success: false, error: 'Failed to update rating' });
        }
    }

    // DELETE RATING
    // POST /del_rating/:id
    static async deleteRating(req, res) {
        try {
            const rater_id = getUserId(req);
            if (!rater_id) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const id = parseInt(req.params.id);
            if (isNaN(id) || id <= 0) return res.status(400).json({ success: false, error: 'Invalid ID' });

            // get owner_id before delete
            const [row] = await connection.query(
                `SELECT owner_id FROM ratings WHERE id = ? AND rater_id = ?`,
                [id, rater_id]
            );
            if (!row.length) return res.status(404).json({ success: false, error: 'Rating not found or unauthorized' });

            await connection.query(
                `DELETE FROM ratings WHERE id = ? AND rater_id = ?`,
                [id, rater_id]
            );

            // update avg in users table
            await updateUserAvg(row[0].owner_id);

            res.json({ success: true, message: 'Rating deleted successfully' });

        } catch (error) {
            console.error('Delete rating error:', error);
            res.status(500).json({ success: false, error: 'Failed to delete rating' });
        }
    }

    // GET USER RATINGS (received by a user)
    // POST /user_ratings
    // Body: { owner_id, page, limit }
    static async getUserRatings(req, res) {
        try {
            const { owner_id, page = 1, limit = 10 } = req.body;
            if (!owner_id) return res.status(400).json({ success: false, error: 'owner_id is required' });

            const pageNum  = Math.max(1, parseInt(page));
            const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
            const offset   = (pageNum - 1) * limitNum;

            const [[summary]] = await connection.query(
                `SELECT
                    COUNT(*)             as total,
                    ROUND(AVG(stars), 1) as avg_stars,
                    SUM(stars = 5)       as five_star,
                    SUM(stars = 4)       as four_star,
                    SUM(stars = 3)       as three_star,
                    SUM(stars = 2)       as two_star,
                    SUM(stars = 1)       as one_star
                 FROM ratings WHERE owner_id = ?`,
                [parseInt(owner_id)]
            );

            const [rows] = await connection.query(
                `SELECT r.id, r.owner_id, r.rater_id,
                        r.stars, r.review, r.created_at,
                        u.full_name as rater_name
                 FROM ratings r
                 LEFT JOIN users u ON u.id = r.rater_id
                 WHERE r.owner_id = ?
                 ORDER BY r.created_at DESC
                 LIMIT ? OFFSET ?`,
                [parseInt(owner_id), limitNum, offset]
            );

            res.json({
                success: true,
                message: 'User ratings fetched successfully',
                summary: {
                    total:      summary.total,
                    avg_stars:  summary.avg_stars  || 0,
                    five_star:  summary.five_star  || 0,
                    four_star:  summary.four_star  || 0,
                    three_star: summary.three_star || 0,
                    two_star:   summary.two_star   || 0,
                    one_star:   summary.one_star   || 0,
                },
                pagination: {
                    total:      summary.total,
                    page:       pageNum,
                    limit:      limitNum,
                    offset,
                    totalPages: Math.ceil(summary.total / limitNum),
                    hasNext:    pageNum < Math.ceil(summary.total / limitNum),
                    hasPrev:    pageNum > 1,
                },
                data: rows,
            });

        } catch (error) {
            console.error('User ratings error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch ratings' });
        }
    }

    // MY RATINGS (ratings i gave)
    // POST /my_ratings
    // Body: { page, limit }
    static async getMyRatings(req, res) {
        try {
            const rater_id = getUserId(req);
            if (!rater_id) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const { page = 1, limit = 10 } = req.body;

            const pageNum  = Math.max(1, parseInt(page));
            const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
            const offset   = (pageNum - 1) * limitNum;

            const [[{ total }]] = await connection.query(
                `SELECT COUNT(*) as total FROM ratings WHERE rater_id = ?`, [rater_id]
            );

            const [rows] = await connection.query(
                `SELECT r.id, r.owner_id, r.rater_id,
                        r.stars, r.review, r.created_at,
                        u.full_name as owner_name
                 FROM ratings r
                 LEFT JOIN users u ON u.id = r.owner_id
                 WHERE r.rater_id = ?
                 ORDER BY r.created_at DESC
                 LIMIT ? OFFSET ?`,
                [rater_id, limitNum, offset]
            );

            res.json({
                success: true,
                message: 'My ratings fetched successfully',
                pagination: {
                    total,
                    page:       pageNum,
                    limit:      limitNum,
                    offset,
                    totalPages: Math.ceil(total / limitNum),
                    hasNext:    pageNum < Math.ceil(total / limitNum),
                    hasPrev:    pageNum > 1,
                },
                data: rows,
            });

        } catch (error) {
            console.error('My ratings error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch ratings' });
        }
    }
}

module.exports = RatingController;