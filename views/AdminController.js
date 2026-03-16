const connection = require('../config/db');

exports.dashboard = async (req, res) => {
    // Ensure session user exists
    const user = req.session.user || {};

    // Mock data required by the sidebar layout
    // In a real app, you might fetch these permissions from the database based on the admin role
    const permissions = [1, 2, 3, 4, 5, 6, 9, 12, 17, 20, 21, 22, 27, 31, 35, 39, 41, 46]; 

    res.render('admin/dashboard', {
       
    });
};

exports.addCategory = async (req, res) => {
    try {
        const { category_name, status } = req.body;
        
        // Example Insert Query (Uncomment and adjust table name when ready)
        // await connection.query('INSERT INTO tbl_categories (name, status) VALUES (?, ?)', [category_name, status]);
        
        console.log("Category Form Submitted:", { category_name, status });

        // Redirect back to dashboard with success message (or handle via AJAX)
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error("Error adding category:", error);
        res.status(500).send("Internal Server Error");
    }
};