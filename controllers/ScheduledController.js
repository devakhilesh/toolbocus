const connection = require('../config/db');
require('dotenv').config();

const view_scheduledpage = async (req, res) => {
    const userId = req.session.user?.id;
    const role = req.session.user?.role; // Make sure to define how the role is set

    if (!userId) {
        return res.status(200).send('User not authenticated.');
    }

    try {
        let scheduled;
        if (role == "0") {
            [scheduled] = await connection.query(`
                SELECT s.*, u.name, p.site_name 
                FROM tbl_scheduled s 
                JOIN leads u ON s.user_id = u.id 
                JOIN tbl_properties p ON s.property_id = p.id
            `);
            console.log('Scheduled entries fetched for admin:', scheduled);
        } else if (role == "1" || role == "3" ) {
            [scheduled] = await connection.query(`
                SELECT s.*, u.name, p.site_name 
                FROM tbl_scheduled s 
                JOIN leads u ON s.user_id = u.id 
                JOIN tbl_properties p ON s.property_id = p.id
                WHERE s.user_id = ?
            `, [userId]);
            console.log('Scheduled entries fetched for builder:', scheduled);
        }
        
        return res.render("scheduled/view_scheduled", { userId, scheduled });
    } catch (error) {
        console.error('Error fetching scheduled entries:', error);
        return res.status(200).send('An error occurred while fetching scheduled entries.');
    }
};


    const updatestatus_scheduled = async (req, res) => {

    const { id, status } = req.body;
    // Your logic to update the status in the database
    // For example:
    await connection.query('UPDATE tbl_scheduled SET status = ? WHERE id = ?', [status, id], (err, results) => {
        if (err) {
        return res.status(500).json({ success: false, message: 'Failed to update status.' });
        }
        return res.json({ success: true });
    });
};



module.exports = {
    view_scheduledpage,
    updatestatus_scheduled
};