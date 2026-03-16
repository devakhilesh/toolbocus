const connection = require('../config/db');
require('dotenv').config();


const addNotificationPage = async (req, res) => {
    try {
        res.render("Notification/add_notification"); // Render the add lead view
    } catch (error) {
        console.error('Error rendering add Notification page:', error);
        res.status(500).send('Internal Server Error');
    }
};

const save_notification = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { notification_title, notification_message, recipient_type } = req.body;

        if (!notification_title || !notification_message || !recipient_type) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        // Example logic to save lead details (adjust as per your schema)
        await connection.query('INSERT INTO tbl_notifications (notification_title, notification_message, recipient_type,created_by) VALUES (?, ?, ?, ?)', 
            [notification_title, notification_message, recipient_type,userId]);

        res.status(200).json({ success: true, message: 'Notification added successfully.' });
    } catch (error) {
        console.error('Error saving lead details:', error);
        res.status(500).json({ success: false, message: 'Failed to add Notification. Please try again later.' });
    }
};

/*const view_notificationpage = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const role = req.session.user?.role; 

        if (!userId) {
            return res.status(401).send('User not authenticated.');
        }

        let notifications = []; 

        console.log('role:', res.locals.role);
        console.log('roles:', role);
        if (role == 0) { 
            console.log('admin', role);
            const [rows] = await connection.query(`SELECT * FROM tbl_notifications ORDER BY id DESC`);
            notifications = rows;
        } else if(role === 2) {
            console.log('User', role);
            const [rows] = await connection.query(`SELECT * FROM tbl_notifications WHERE recipient_type = '2' AND status  = '1' ORDER BY id DESC`);
            notifications = rows; 
        } else if(role === 3) {
            console.log('User', role);
            const [rows] = await connection.query(`SELECT * FROM tbl_notifications WHERE recipient_type = '3' AND status  = '1' ORDER BY id DESC`);
            notifications = rows; 
        }
         else if (role == 1) {
            console.log('builder', role);
            const [rows] = await connection.query(`SELECT * FROM tbl_notifications WHERE recipient_type = '1' AND status  = '1' ORDER BY id DESC`);
            notifications = rows; // Assign the fetched notifications to the variable
        }

        console.log('Admin notifications fetched:', notifications);
       // return res.render("Notification/view_notification", { notifications });
    return res.render("Notification/view_notification", {
    notifications,
    permissions: req.session.permissions || []
});
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).send('Internal Server Error');
    }
};*/

const view_notificationpage = async (req, res) => {
    try {

        const [rows] = await connection.query(
            "SELECT * FROM tbl_notifications ORDER BY id DESC"
        );

        res.render("Notification/view_notification", {
            notifications: rows,
            permissions: req.session.permissions || []
        });

    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).send("Internal Server Error");
    }
};


const delete_notification = async (req, res) => {
    const notificationId = req.params.id; 
    try {
        // Execute the DELETE query
        const [result] = await connection.query('DELETE FROM tbl_notifications WHERE id = ?', [notificationId]);

        if (result.affectedRows > 0) {
            res.json({ msg: 'Notification deleted successfully' });
        } else {
            res.status(404).json({ msg: 'Notification not found' });
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).send('Internal Server Error');
    }
};

const changestatus_notification = async (req, res) => {

    const notificationId = req.params.id;
    const { status } = req.body; // Get new status from request body

    try {
        const [result] = await connection.query(`UPDATE tbl_notifications SET status = ? WHERE id = ?`, [status, notificationId]);
        if (result.affectedRows > 0) {
            return res.status(200).json({ message: 'Status updated successfully' });
        } else {
            return res.status(404).json({ message: 'Notification not found' });
        }
    } catch (error) {
        console.error('Error updating notification status:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};



module.exports = {
    addNotificationPage,
    save_notification,
    view_notificationpage,
    delete_notification,
    changestatus_notification
};