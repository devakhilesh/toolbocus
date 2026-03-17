const express        = require('express');
const router         = express.Router();
// const multer         = require('multer');
// const upload         = multer();
 
const AuthController     = require('../controllers/api/authController');
const GiveawayController = require('../controllers/api/GiveawayController');
const RatingController = require('../controllers/api/RatingController');
const TradeResponseController = require('../controllers/api/TradeResponseController');
const BuilderController       = require('../controllers/BuilderController');
const { authMiddleware } = require('../controllers/middleware');

// const postUpload = upload.fields([
//     { name: 'item_images',        maxCount: 10 },
//     { name: 'return_item_images', maxCount: 10 },
// ]); 

// // ADD THIS 👇
// const tradeUpload = upload.fields([
//     { name: 'images', maxCount: 5 },
// ]); 
 
// const profileUpload = upload.fields([{ name: 'profile_image', maxCount: 1 }]);

// ─── AUTH ─────────────────────────────────────────────────────────
router.post('/verify-otp',       AuthController.verifyOTP);
router.post('/login',            AuthController.login);

router.post('/complete-profile', AuthController.completeProfile);
router.post('/update_profile', authMiddleware, AuthController.updateProfile);


 
router.post('/submit_user_review', authMiddleware, AuthController.submitUserReview);
router.get('/get_user_profile/:user_id', AuthController.getUserProfile);
// ─── CATEGORIES ───────────────────────────────────────────────────
router.get('/get_categories', GiveawayController.getCategories);

// ─── POSTS ────────────────────────────────────────────────────────
router.post('/create_post', GiveawayController.createPost);
router.post('/get_posts',                 GiveawayController.getPosts);
router.post('/get_my_posts',             GiveawayController.getMyPosts);
router.get('/get_post_by_id/:id',              GiveawayController.getPostById);
router.post('/update_post/:id',  GiveawayController.updatePost);
router.post('/delete_post/:id',          GiveawayController.deletePost);


router.post('/add_rating',      RatingController.addRating);
router.post('/edit_rating/:id', RatingController.editRating);
router.post('/del_rating/:id',  RatingController.deleteRating);
router.post('/user_ratings',    RatingController.getUserRatings);
router.post('/my_ratings',      RatingController.getMyRatings);

router.get('/onboarding', BuilderController.api_onboarding);

// Radha responds to Rutuja's post with her item details
// POST /api/trade/respond/:giveaway_id
// router.post('/respond/:giveaway_id', tradeUpload, TradeResponseController.respondToPost);

router.post('/respond/:giveaway_id',  TradeResponseController.respondToPost);

// Rutuja sees all offers/responses on her post
// GET /api/trade/responses/:giveaway_id
router.get('/responses/:giveaway_id', TradeResponseController.getPostResponses);


router.get('/trade-flow/:responder_id', TradeResponseController.getTradeFlow);

// Rutuja confirms payment (Respond 9 popup - Yes button)
// POST /api/trade/confirm-payment/:response_id
router.post('/confirm-payment/:response_id', TradeResponseController.confirmPayment);

// POST /api/trade/update_response_status
router.post('/update_response_status', TradeResponseController.updateResponseStatus);

// Radha cancels her own pending offer
// POST /api/trade/cancel/:response_id
router.post('/cancel/:response_id', TradeResponseController.cancelResponse);

router.get('/my-responses',      TradeResponseController.getMyResponses);

///← trade_responses.id
router.get('/my-post-responses', TradeResponseController.getMyPostResponses);

// Mark trade as completed after physical meetup
// POST /api/trade/complete/:response_id
router.post('/complete/:response_id', TradeResponseController.completeTrade);

// Get all my trades (as poster or responder)
// GET /api/trade/my-trades?role=poster&status=pending
router.get('/my-trades', TradeResponseController.getMyTrades);

// Get single trade detail
// Subscription APIs
router.post('/subscribe', authMiddleware, BuilderController.subscribeUser);
router.get('/my_subscription', authMiddleware, BuilderController.getMySubscription);
// GET /api/trade/:response_id
router.get('/:response_id', TradeResponseController.getTradeById);

router.get('/my-post-responses-by-id/:response_id', TradeResponseController.getTradeById);

// Subscription APIs
/*router.get('/subscription/:user_id', BuilderController.getUserSubscription);

router.post('/subscribe', BuilderController.subscribeUser);
*/


module.exports = router;