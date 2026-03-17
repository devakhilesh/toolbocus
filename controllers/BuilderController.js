const connection = require("../config/db");

const { uploadSingleImage } = require("../utils/fileUpload");

// --- AUTHENTICATION ---
exports.loginpage = (req, res) => {
  if (req.session.user) return res.redirect("/admin/dashboard");
  res.render("login");
};

exports.login = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    const { email, password } = req.body;
    const [rows] = await connection.query(
      "SELECT * FROM admin_login WHERE email = ?",
      [email],
    );
    if (rows.length === 0 || rows[0].password_hash !== password) {
      return res.json({ status: false, message: "Invalid Email or Password" });
    }
    req.session.user = {
      id: rows[0].admin_id,
      name: rows[0].username,
      email: rows[0].email,
      role: rows[0].role,
    };
    return res.json({ status: true, redirect: "/admin/dashboard" });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
      stack: error.stack,
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
};

// --- DASHBOARD ---
exports.dashboardpage = (req, res) => {
  res.render("dashboard", {
    user: req.session.user,
    totalProperties: "15",
    totalEnquiries: "05",
    scheduledVisits: "12",
  });
};

// --- CATEGORY MANAGEMENT ---

// 1. View List
exports.view_categories = async (req, res) => {
  try {
    const [rows] = await connection.query(
      "SELECT * FROM categories ORDER BY id DESC",
    );
    res.render("Category/view_categories", {
      user: req.session.user,
      categories: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// 2. Add Category Page

// will  continue from here
exports.add_category_page = (req, res) => {
  res.render("Category/add_category", { user: req.session.user });
};

// 3. Save New Category
exports.save_category = async (req, res) => {
  try {
    const { name, status } = req.body;

    // const image_url = req.file ? '/uploads/categories/' + req.file.filename : '';

    // modified by Akhilesh soni

    let image_url = "";
    // upload Single image

    if (req.files && req.files.category_image) {
      const imageUrl = req.files.category_image;

      // multiple img selection not valid

      if (Array.isArray(imageUrl)) {
        return res.status(400).json({
          success: false,
          message: "Only one profile image allowed",
        });
      }

      // type validation
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
      ];

      if (!allowedTypes.includes(imageUrl.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Only image files are allowed",
        });
      }

      const folderName = "category_img";

      const category_imageUpload = await uploadSingleImage(
        imageUrl,
        folderName,
      );

      if (!category_imageUpload.status) {
        return res
          .status(400)
          .json({ success: false, error: "Error Uploading Category Image" });
      }

      image_url = category_imageUpload.data.url;
    }

    // console.log("Image URL:", image_url);
    // console.log("Name:", name, "Status:", status);

const statusValue = status === "active" ? 1 : 0;

    const sub_id = req.body.sub_id || 0;
    const sql =
      "INSERT INTO categories (name, sub_id, image_url, status) VALUES (?, ?, ?, ?)";
    await connection.query(sql, [name, sub_id, image_url, statusValue]);
    res.json({ status: true, message: "Category added successfully!" });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

// 4. Edit Category Page
exports.edit_category_page = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await connection.query(
      "SELECT * FROM categories WHERE id = ?",
      [id],
    );
    if (rows.length === 0) return res.status(404).send("Category not found");
    res.render("Category/edit_category", {
      category: rows[0],
      user: req.session.user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// 5. Update Category
exports.update_category = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    let image_url = null;

    //  Single Image Upload
    if (req.files && req.files.category_image) {
      const imageFile = req.files.category_image;

      // only single image allowed
      if (Array.isArray(imageFile)) {
        return res.status(400).json({
          success: false,
          message: "Only one image allowed",
        });
      }

      // type check
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
      ];

      if (!allowedTypes.includes(imageFile.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Only image files are allowed",
        });
      }

      // 🔥 Upload to Cloudinary
      const folderName = "category_img";

      const uploadResult = await uploadSingleImage(imageFile, folderName);

      if (!uploadResult.status) {
        return res.status(400).json({
          success: false,
          message: "Error uploading image",
        });
      }

      image_url = uploadResult.data.url;
    }

    // 🔹 Update Query
    let sql = "";
    let params = [];

let statusValue = 0;

    if(status){
        statusValue = status === "active" ? 1 : 0;
    }


    if (image_url) {
      sql = `
        UPDATE categories 
        SET name = ?, status = ?, image_url = ?
        WHERE id = ?
      `;
      params = [name, statusValue, image_url, id];
    } else {
      sql = `
        UPDATE categories 
        SET name = ?, status = ?
        WHERE id = ?
      `;
      params = [name, statusValue, id];
    }

    await connection.query(sql, params);
    res.json({ status: true, message: "Category updated successfully!" });
  } catch (error) {
    res.status(500).json({ status: false, message: "Error updating category" });
  }
};

// --- ONBOARDING MANAGEMENT ---

// 1. Render onboarding page
exports.view_onboarding = (req, res) => {
  res.render("Onboarding/view_onboarding", { user: req.session.user });
};

// 2. GET all onboarding screens (JSON)
exports.get_onboarding = async (req, res) => {
  try {
    const [rows] = await connection.query(
      "SELECT * FROM onboarding_screens ORDER BY screen_order ASC",
    );
    res.json({ status: true, data: rows });
  } catch (err) {
    console.error("get_onboarding error:", err);
    res.json({ status: false, message: "Failed to fetch onboarding screens." });
  }
};

// 3. CREATE a new onboarding screen
exports.save_onboarding = async (req, res) => {
  try {
    const { title, description, screen_order, status } = req.body;

    // const image_url = req.file
    //   ? "/uploads/onboarding/" + req.file.filename
    //   : null;

    // modified by Akhil

    let image_url = null;

    //  Single Image Upload
    if (req.files && req.files.onboarding_image) {
      const imageFile = req.files.onboarding_image;

      // only single image allowed
      if (Array.isArray(imageFile)) {
        return res.status(400).json({
          success: false,
          message: "Only one image allowed",
        });
      }

      // type check
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
      ];

      if (!allowedTypes.includes(imageFile.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Only image files are allowed",
        });
      }

      // 🔥 Upload to Cloudinary
      const folderName = "onboarding_img";

      const uploadResult = await uploadSingleImage(imageFile, folderName);

      if (!uploadResult.status) {
        return res.status(400).json({
          success: false,
          message: "Error uploading image",
        });
      }

      image_url = uploadResult.data.url;
    }


    let statusValue = 0;
    if (status) {
      statusValue = status === "active" ? 1 : 0;
    }


    await connection.query(
      `INSERT INTO onboarding_screens (title, description, image_url, screen_order, status)
             VALUES (?, ?, ?, ?, ?)`,
      [title, description, image_url, screen_order || 1, statusValue],
    );
    res.json({
      status: true,
      message: "Onboarding screen saved successfully!",
    });
  } catch (err) {
    console.error("save_onboarding error:", err);
    res.json({ status: false, message: "Failed to save onboarding screen." });
  }
};

// 4. UPDATE an existing onboarding screen
exports.update_onboarding = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, screen_order, status } = req.body;
    let query, params;

    // modified by Akhil
    let image_url = null;

    //  Single Image Upload
    if (req.files && req.files.onboarding_image) {
      const imageFile = req.files.onboarding_image;

      // only single image allowed
      if (Array.isArray(imageFile)) {
        return res.status(400).json({
          success: false,
          message: "Only one image allowed",
        });
      }

      // type check
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
      ];

      if (!allowedTypes.includes(imageFile.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Only image files are allowed",
        });
      }

      // 🔥 Upload to Cloudinary
      const folderName = "onboarding_img";

      const uploadResult = await uploadSingleImage(imageFile, folderName);

      if (!uploadResult.status) {
        return res.status(400).json({
          success: false,
          message: "Error uploading image",
        });
      }

      image_url = uploadResult.data.url;
    }


    let statusValue = 0;
    if (status) {
        statusValue = status === "active" ? 1 : 0;
    }

    if (image_url) {
      query = `UPDATE onboarding_screens
                     SET title=?, description=?, image_url=?, screen_order=?, status=?
                     WHERE id=?`;
      params = [title, description, image_url, screen_order, statusValue, id];
    } else {
      query = `UPDATE onboarding_screens
                     SET title=?, description=?, screen_order=?, status=?
                     WHERE id=?`;
      params = [title, description, screen_order, statusValue, id];
    }
    await connection.query(query, params);
    res.json({
      status: true,
      message: "Onboarding screen updated successfully!",
    });
  } catch (err) {
    console.error("update_onboarding error:", err);
    res.json({ status: false, message: "Failed to update onboarding screen." });
  }
};

// 5. DELETE an onboarding screen
exports.delete_onboarding = async (req, res) => {
  try {
    const { id } = req.params;
    await connection.query("DELETE FROM onboarding_screens WHERE id = ?", [id]);
    res.json({
      status: true,
      message: "Onboarding screen deleted successfully!",
    });
  } catch (err) {
    console.error("delete_onboarding error:", err);
    res.json({ status: false, message: "Failed to delete onboarding screen." });
  }
};

// --- ONBOARDING API (for mobile app) ---
exports.api_onboarding = async (req, res) => {
  try {
    const [rows] = await connection.query(
      "SELECT id, title, description, image_url, screen_order FROM onboarding_screens WHERE status = ? ORDER BY screen_order ASC",
      ["active"],
    );
    res.json({
      status: true,
      message: "Onboarding screens fetched successfully",
      data: rows,
    });
  } catch (err) {
    console.error("api_onboarding error:", err);
    res.json({ status: false, message: "Failed to fetch onboarding screens." });
  }
};

// ============================================================
// ADD THESE METHODS to your BuilderController
// ============================================================

// 1. View Users Page
exports.view_users = async (req, res) => {
  try {
    const [users] = await connection.query(
      "SELECT * FROM users ORDER BY created_at DESC",
    );
    res.render("users/view_users", { users });
  } catch (err) {
    console.error(err);
    res.render("users/view_users", { users: [] });
  }
};
exports.add_user = async (req, res) => {
  try {
    const {
      phone_number,
      full_name,
      email,
      date_of_birth,
      gender,
      location,
      is_profile_complete,
      terms_accepted,
    } = req.body;

    if (!phone_number) {
      return res.json({ status: false, message: "Phone number is required" });
    }

    const [existing] = await connection.query(
      "SELECT id FROM users WHERE phone_number = ?",
      [phone_number],
    );
    if (existing.length > 0) {
      return res.json({
        status: false,
        message: "Phone number already exists",
      });
    }

    if (email) {
      const [emailCheck] = await connection.query(
        "SELECT id FROM users WHERE email = ?",
        [email],
      );
      if (emailCheck.length > 0) {
        return res.json({ status: false, message: "Email already in use" });
      }
    }

    await connection.query(
      `INSERT INTO users 
                (phone_number, full_name, email, date_of_birth, gender, location, 
                 is_verified, is_profile_complete, terms_accepted) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        phone_number,
        full_name || null,
        email || null,
        date_of_birth || null,
        gender || null,
        location || null,
        1, // ✅ always set is_verified = 1 when admin adds
        is_profile_complete || 0,
        terms_accepted || 0,
      ],
    );

    res.json({ status: true, message: "User added successfully" });
  } catch (err) {
    console.error("Add user error:", err);
    res.json({ status: false, message: err.message }); // shows real DB error
  }
};

exports.block_user = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' or 'blocked'

    await connection.query("UPDATE users SET status = ? WHERE id = ?", [
      status,
      id,
    ]);

    res.json({
      status: true,
      message: `User ${status === "blocked" ? "blocked" : "unblocked"} successfully`,
    });
  } catch (err) {
    console.error(err);
    res.json({ status: false, message: err.message });
  }
};

/*exports.view_giveaways = async (req, res) => {
    try {
        const [giveaways] = await connection.query(`
            SELECT g.*, u.full_name as user_name, u.phone_number
            FROM giveaways g
            LEFT JOIN users u ON u.id = g.user_id
            WHERE g.status != 'Deleted'
            ORDER BY g.created_at DESC
        `);

        // parse images
        const parsed = giveaways.map(g => ({
            ...g,
            item_images:        JSON.parse(g.item_images        || '[]'),
            return_item_images: JSON.parse(g.return_item_images || '[]'),
        }));

        res.render('giveaways/view_giveaways', { giveaways: parsed });
    } catch (err) {
        console.error(err);
        res.render('giveaways/view_giveaways', { giveaways: [] });
    }
};
*/
exports.view_giveaways = async (req, res) => {
  try {
    const [giveaways] = await connection.query(`
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
END AS subscription_status

            FROM giveaways g

            LEFT JOIN users u 
            ON u.id = g.user_id

            LEFT JOIN user_subscriptions us
            ON us.user_id = g.user_id
            AND us.status = 'active'
            AND us.end_date >= NOW()

            WHERE g.status != 'Deleted'

            ORDER BY g.created_at DESC
        `);

    const parsed = giveaways.map((g) => ({
      ...g,
      item_images: JSON.parse(g.item_images || "[]"),
      return_item_images: JSON.parse(g.return_item_images || "[]"),
    }));

    res.render("giveaways/view_giveaways", { giveaways: parsed });
  } catch (err) {
    console.error(err);
    res.render("giveaways/view_giveaways", { giveaways: [] });
  }
};
exports.update_giveaway_status = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Active' or 'Inactive'
    await connection.query("UPDATE giveaways SET status = ? WHERE id = ?", [
      status,
      id,
    ]);
    res.json({ status: true, message: `Giveaway marked as ${status}` });
  } catch (err) {
    console.error(err);
    res.json({ status: false, message: err.message });
  }
};

// ============================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================

// View Subscriptions

exports.view_subscriptions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // records per page
    const offset = (page - 1) * limit;

    // total count
    const [countRows] = await connection.query(
      "SELECT COUNT(*) as total FROM subscriptions",
    );

    const total = countRows[0].total;
    const totalPages = Math.ceil(total / limit);
    /*
const [rows] = await connection.query(
`SELECT id,name,price,start_date,end_date,status
FROM subscriptions ORDER BY id DESC LIMIT ? OFFSET ?`, [limit, offset]
);*/
    /*const [rows] = await connection.query(
`SELECT 
 id,
 name,
 price,
 start_date,
 end_date,
 CASE 
    WHEN end_date < CURDATE() THEN 'Inactive'
    ELSE 'Active'
 END AS status
FROM subscriptions
ORDER BY id DESC
LIMIT ? OFFSET ?`,
[limit, offset]
);*/
    /*
const [rows] = await connection.query(
`SELECT 
 id,
 name,
 price,
 start_date,
 end_date,
 CASE
   WHEN status = 'Inactive' THEN 'Inactive'
   WHEN end_date < CURDATE() THEN 'Inactive'
   ELSE 'Active'
 END AS status
FROM subscriptions
ORDER BY id DESC
LIMIT ? OFFSET ?`,
[limit, offset]
);*/
    const [rows] = await connection.query(
      `SELECT 
id,
name,
price,
DATE_FORMAT(start_date,'%Y-%m-%d') AS start_date,
DATE_FORMAT(end_date,'%Y-%m-%d') AS end_date,
status
FROM subscriptions
ORDER BY id DESC
LIMIT ? OFFSET ?`,
      [limit, offset],
    );
    const success = req.session.success;
    req.session.success = null;

    res.render("subscription/view_subscriptions", {
      user: req.session.user,
      subscriptions: rows,
      success: success,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (err) {
    console.error(err);
    res.render("subscription/view_subscriptions", { subscriptions: [] });
  }
};

// Add Subscription
exports.add_subscription = async (req, res) => {
  try {
    const { name, price, start_date, end_date, description, status } = req.body;

    await connection.query(
      `INSERT INTO subscriptions
(name, price, start_date, end_date, description, status)
VALUES (?, ?, ?, ?, ?, ?)`,
      [name, price, start_date, end_date, description, status || "Active"],
    );
    req.session.success = "Subscription added successfully";

    res.redirect("/admin/subscription");
  } catch (err) {
    console.error(err);
    res.send("Error adding subscription");
  }
};

// Update Subscription
exports.update_subscription = async (req, res) => {
  try {
    const { id } = req.params;

    const { name, price, start_date, end_date, description, status } = req.body;

    // update subscription
    await connection.query(
      `UPDATE subscriptions
SET name=?, price=?, start_date=?, end_date=?, description=?, status=?
WHERE id=?`,
      [name, price, start_date, end_date, description, status, id],
    );

    req.session.success = "Subscription updated successfully";

    res.redirect("/admin/subscription");
  } catch (err) {
    console.error(err);
    res.send("Update failed");
  }
};
exports.delete_subscription = async (req, res) => {
  try {
    const { id } = req.params;

    await connection.query("DELETE FROM subscriptions WHERE id = ?", [id]);

    res.json({
      status: true,
      message: "Subscription deleted successfully",
    });
  } catch (err) {
    console.log(err);

    res.json({
      status: false,
      message: "Delete failed",
    });
  }
};

exports.subscribeUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subscription_id } = req.body;

    const [sub] = await connection.query(
      "SELECT * FROM subscriptions WHERE id=? AND status='active'",
      [subscription_id],
    );

    if (sub.length === 0) {
      return res.json({
        success: false,
        message: "Subscription not found",
      });
    }

    const subscription = sub[0];

    const totalAmount = subscription.price;

    /* use plan start and end date */
    const startDate = subscription.start_date;
    const endDate = subscription.end_date;

    await connection.query(
      `INSERT INTO user_subscriptions
(user_id, subscription_id, total_amount, remaining_balance, start_date, end_date)
VALUES (?,?,?,?,?,?)`,
      [userId, subscription.id, totalAmount, totalAmount, startDate, endDate],
    );

    res.json({
      success: true,
      message: "Subscription activated successfully",
      data: {
        total_balance: totalAmount,
      },
    });
  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: "Subscription failed",
    });
  }
};

exports.getMySubscription = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [rows] = await connection.query(
      `SELECT us.*, s.name
FROM user_subscriptions us
JOIN subscriptions s ON s.id = us.subscription_id
WHERE us.user_id=? AND us.status='active'
ORDER BY us.id DESC LIMIT 1`,
      [userId],
    );

    if (rows.length === 0) {
      return res.json({
        success: false,
        message: "No active subscription",
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (err) {
    console.log(err);

    res.json({
      success: false,
      message: "Error fetching subscription",
    });
  }
};
exports.view_user_subscriptions = async (req, res) => {
  try {
    const [rows] = await connection.query(`
SELECT
  us.id,
  us.user_id,
  u.full_name AS user_name,
  s.name AS plan_name,
  us.total_amount,
  us.remaining_balance,
  us.used_posts,
  us.start_date,
  us.end_date,

  CASE
    WHEN us.end_date < NOW() THEN 'inactive'
    ELSE us.status
  END AS status

FROM user_subscriptions us
LEFT JOIN subscriptions s ON s.id = us.subscription_id
LEFT JOIN users u ON u.id = us.user_id
ORDER BY us.id DESC
`);

    res.render("subscription/user_subscriptions", {
      user: req.session.user,
      subscriptions: rows,
    });
  } catch (err) {
    console.log("USER SUBSCRIPTION ERROR:", err);
    res.send("Error loading user subscriptions");
  }
};
