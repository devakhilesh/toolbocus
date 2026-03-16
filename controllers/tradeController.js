const connection = require('../config/db');
require('dotenv').config();
exports.viewTrade = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = 10;   // same as subscription page
        const offset = (page - 1) * limit;

        // total trades count
        const [[{ total }]] = await connection.query(`
            SELECT COUNT(*) as total
            FROM trade_responses
        `);

        const [rows] = await connection.query(`
        SELECT
        tr.id,
        g.item_name,
        u1.full_name AS poster_name,
        u2.full_name AS responder_name,
        tr.status,
        tr.created_at

        FROM trade_responses tr

        LEFT JOIN giveaways g
        ON g.id = tr.giveaway_id

        LEFT JOIN users u1
        ON u1.id = tr.poster_user_id

        LEFT JOIN users u2
        ON u2.id = tr.responder_user_id

        ORDER BY tr.id DESC
        LIMIT ? OFFSET ?
        `,[limit, offset]);

        const totalPages = Math.ceil(total / limit);

        res.render("Trade/view_trade", {
            trades: rows,
            currentPage: page,
            totalPages
        });

    } catch (error) {
        console.error("Error fetching trades:", error);
        res.status(500).send("Server Error");
    }
};