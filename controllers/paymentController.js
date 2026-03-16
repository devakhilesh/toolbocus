const connection = require("../config/db");
const razorpay = require("../config/razorpay");

exports.createOrder = async (req, res) => {

try {

const { subscription_id } = req.body;

const [rows] = await connection.query(
"SELECT * FROM subscriptions WHERE id=? AND status='active'",
[subscription_id]
);

if(rows.length === 0){
return res.json({
success:false,
message:"Subscription not found"
});
}

const subscription = rows[0];

const amount = subscription.price * 100; // Razorpay uses paise

const order = await razorpay.orders.create({
amount: amount,
currency: "INR",
receipt: "sub_" + Date.now()
});

res.json({
success:true,
order_id: order.id,
amount: order.amount,
currency: order.currency,
subscription: subscription
});

}catch(err){

console.log(err);

res.json({
success:false,
message:"Order creation failed"
});

}



};

const crypto = require("crypto");

exports.verifyPayment = async (req, res) => {

try{

const {
razorpay_order_id,
razorpay_payment_id,
razorpay_signature,
subscription_id
} = req.body;

const userId = req.user.userId;

const generated_signature = crypto
.createHmac("sha256", process.env.RAZORPAY_SECRET)
.update(razorpay_order_id + "|" + razorpay_payment_id)
.digest("hex");

if(generated_signature !== razorpay_signature){

return res.json({
success:false,
message:"Payment verification failed"
});

}

/* GET SUBSCRIPTION PLAN */

const [rows] = await connection.query(
"SELECT * FROM subscriptions WHERE id=?",
[subscription_id]
);

if(rows.length === 0){
return res.json({
success:false,
message:"Subscription not found"
});
}

const subscription = rows[0];

/* CREATE USER SUBSCRIPTION */

await connection.query(
`INSERT INTO user_subscriptions
(user_id, subscription_id, total_amount, remaining_balance, start_date, end_date)
VALUES (?,?,?,?,?,?)`,
[
userId,
subscription.id,
subscription.price,
subscription.price,
subscription.start_date,
subscription.end_date
]
);

/* SAVE TRANSACTION */

await connection.query(
`INSERT INTO subscription_transactions
(user_id, subscription_id, amount, transaction_id, payment_status)
VALUES (?,?,?,?,?)`,
[
userId,
subscription.id,
subscription.price,
razorpay_payment_id,
"success"
]
);

res.json({
success:true,
message:"Payment successful & subscription activated"
});

}catch(err){

console.log(err);

res.json({
success:false,
message:"Payment verification failed"
});

}

};