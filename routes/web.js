const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const BuilderController = require('../controllers/BuilderController');
const { isAuthenticated } = require('../controllers/middleware');
const connection = require('../config/db'); // ADD THIS LINE
const notificationController = require('../controllers/NotificationController');
const tradeController = require('../controllers/tradeController');

const storage = multer.diskStorage({
    destination: 'public/uploads/categories/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// --- Routes ---
router.get('/', BuilderController.loginpage);
// router.post('/verifylogin', upload.none(), BuilderController.login);
router.post('/verifylogin', BuilderController.login);
router.get('/logout', BuilderController.logout);
router.get('/admin/dashboard', isAuthenticated, BuilderController.dashboardpage);

// Category Management
router.get('/admin/add_category', isAuthenticated, BuilderController.add_category_page);
router.get('/admin/view_categories', isAuthenticated, BuilderController.view_categories);
router.post('/admin/save_category', isAuthenticated, upload.single('category_image'), BuilderController.save_category);

// Edit Category Routes
// EDIT ROUTES (Ensure these are exactly as written)
router.get('/admin/edit_category/:id', isAuthenticated, (req, res, next) => {
    console.log("Attempting to access Edit Page for ID:", req.params.id);
    next();
}, BuilderController.edit_category_page);

router.post('/admin/update_category/:id', isAuthenticated, upload.single('category_image'), BuilderController.update_category);

// Delete Category
router.delete('/admin/delete_category/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        await connection.query('DELETE FROM categories WHERE id = ?', [id]);
        res.json({ status: true, message: 'Deleted' });
    } catch (err) {
        console.log(err);
        res.json({ status: false });
    }
});

const onboardingStorage = multer.diskStorage({
    destination: 'public/uploads/onboarding/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const uploadOnboarding = multer({ storage: onboardingStorage });

// ── Onboarding Routes ──
router.get('/admin/view_onboarding',  isAuthenticated, BuilderController.view_onboarding);
router.get('/admin/get_onboarding',   isAuthenticated, BuilderController.get_onboarding);
router.post('/admin/save_onboarding', isAuthenticated, uploadOnboarding.single('onboarding_image'), BuilderController.save_onboarding);
router.post('/admin/update_onboarding/:id', isAuthenticated, uploadOnboarding.single('onboarding_image'), BuilderController.update_onboarding);
router.delete('/admin/delete_onboarding/:id', isAuthenticated, BuilderController.delete_onboarding);


router.get('/admin/view_users', isAuthenticated, BuilderController.view_users);

// Add user (admin creates manually)
router.post('/admin/add_user', isAuthenticated, BuilderController.add_user);

router.post('/admin/block_user/:id', isAuthenticated, BuilderController.block_user);
// Subscription Management
// Subscription Management
router.get('/admin/subscription', isAuthenticated, BuilderController.view_subscriptions);

router.post('/admin/add_subscription', isAuthenticated, BuilderController.add_subscription);

router.post('/admin/update_subscription/:id', isAuthenticated, BuilderController.update_subscription);

router.delete('/admin/delete_subscription/:id', isAuthenticated, BuilderController.delete_subscription);
router.get(
  '/admin/user_subscriptions',
  isAuthenticated,
  BuilderController.view_user_subscriptions
);
// Delete user
router.delete('/admin/delete_user/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        await connection.query('DELETE FROM otps WHERE phone_number = (SELECT phone_number FROM users WHERE id = ?)', [id]);
        await connection.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ status: true, message: 'User deleted' });
    } catch (err) {
        console.error(err);
        res.json({ status: false, message: 'Delete failed' });
    }
});


// Giveaway Management
router.get('/admin/view_giveaways', isAuthenticated, BuilderController.view_giveaways);
router.post('/admin/update_giveaway_status/:id', isAuthenticated, BuilderController.update_giveaway_status);
router.delete('/admin/delete_giveaway/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        await connection.query(`UPDATE giveaways SET status = 'Deleted' WHERE id = ?`, [id]);
        res.json({ status: true, message: 'Giveaway deleted' });
    } catch (err) {
        console.error(err);
        res.json({ status: false, message: err.message });
    }
});

router.get('/add_notification', notificationController.addNotificationPage);
router.post('/save_notification', notificationController.save_notification);
router.get('/view_notification', notificationController.view_notificationpage);
router.delete('/delete_notification/:id', notificationController.delete_notification);
router.post('/changestatus_notification/:id', notificationController.changestatus_notification);
router.get('/admin/view_trade', tradeController.viewTrade);
module.exports = router;