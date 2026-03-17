const connection = require("../../config/db");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "my-shared-secret-key";

function getUserId(req) {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(authHeader.substring(7), JWT_SECRET).userId;
  } catch {
    return null;
  }
}

const fs = require("fs");
const path = require("path");
const { uploadSingleImage } = require("../../utils/fileUpload");
const STATIC_OTP = "123456";

class AuthController {
  // 1. LOGIN (handles both new & existing users)
  static async login(req, res) {
    try {
      const { phone_number } = req.body;

      if (!phone_number) {
        return res
          .status(400)
          .json({ success: false, error: "Phone number is required" });
      }

      const [userRows] = await connection.query(
        "SELECT * FROM users WHERE phone_number = ?",
        [phone_number],
      );

      let user = userRows[0];
      let isNewUser = false;

      // If user doesn't exist, create a minimal record
      if (!user) {
        isNewUser = true;
        const [result] = await connection.query(
          `INSERT INTO users (phone_number, is_verified, is_profile_complete, terms_accepted) 
                     VALUES (?, FALSE, FALSE, FALSE)`,
          [phone_number],
        );
        const [newUserRows] = await connection.query(
          "SELECT * FROM users WHERE id = ?",
          [result.insertId],
        );
        user = newUserRows[0];
      }

      // Send OTP
      await connection.query("DELETE FROM otps WHERE phone_number = ?", [
        phone_number,
      ]);
      const expires_at = new Date(Date.now() + 10 * 60 * 1000);
      await connection.query(
        "INSERT INTO otps (phone_number, otp_code, expires_at, is_used) VALUES (?, ?, ?, FALSE)",
        [phone_number, STATIC_OTP, expires_at],
      );

      return res.status(200).json({
        success: true,
        message: isNewUser ? "New user. OTP sent." : "OTP sent successfully",
        data: {
          is_new_user: isNewUser,
          phone_number,
          otp_code: STATIC_OTP, // remove in production
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      return res
        .status(500)
        .json({ success: false, error: "Failed to send OTP" });
    }
  }

  // 2. VERIFY OTP (returns is_profile_complete for both new & existing)
  static async verifyOTPOld(req, res) {
    try {
      const { phone_number, otp_code } = req.body;

      if (!phone_number || !otp_code) {
        return res
          .status(400)
          .json({ success: false, error: "Phone number and OTP are required" });
      }

      const [otpRow] = await connection.query(
        "SELECT * FROM otps WHERE phone_number = ? AND otp_code = ? AND is_used = FALSE AND expires_at > NOW()",
        [phone_number, otp_code],
      );

      const isValid = otp_code === STATIC_OTP || otpRow.length > 0;

      if (!isValid) {
        return res
          .status(401)
          .json({ success: false, error: "Invalid or expired OTP" });
      }

      // Mark user verified & OTP as used
      await connection.query(
        "UPDATE users SET is_verified = TRUE WHERE phone_number = ?",
        [phone_number],
      );
      if (otpRow.length > 0) {
        await connection.query("UPDATE otps SET is_used = TRUE WHERE id = ?", [
          otpRow[0].id,
        ]);
      }

      const [userRows] = await connection.query(
        "SELECT * FROM users WHERE phone_number = ?",
        [phone_number],
      );
      const user = userRows[0];

      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      const token = jwt.sign(
        {
          userId: user.id,
          phone_number: user.phone_number,
          email: user.email,
          full_name: user.full_name,
          is_verified: true,
          is_profile_complete: user.is_profile_complete,
        },
        JWT_SECRET,
        { expiresIn: "30d" },
      );

      const { password, ...userWithoutPassword } = user;

      return res.status(200).json({
        success: true,
        message: "OTP verified successfully",
        data: {
          user: userWithoutPassword,
          token,
          is_profile_complete: user.is_profile_complete === 1, // true or false
        },
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      return res
        .status(500)
        .json({ success: false, error: "Failed to verify OTP" });
    }
  }

  static async verifyOTP(req, res) {
    try {
      const { phone_number, otp_code } = req.body;

      if (!phone_number || !otp_code) {
        return res
          .status(400)
          .json({ success: false, error: "Phone number and OTP are required" });
      }

      const [otpRow] = await connection.query(
        "SELECT * FROM otps WHERE phone_number = ? AND otp_code = ? AND is_used = FALSE AND expires_at > NOW()",
        [phone_number, otp_code],
      );

      const isValid = otp_code === STATIC_OTP || otpRow.length > 0;

      if (!isValid) {
        return res
          .status(401)
          .json({ success: false, error: "Invalid or expired OTP" });
      }

      // Mark user verified & OTP as used
      await connection.query(
        "UPDATE users SET is_verified = TRUE WHERE phone_number = ?",
        [phone_number],
      );
      if (otpRow.length > 0) {
        await connection.query("UPDATE otps SET is_used = TRUE WHERE id = ?", [
          otpRow[0].id,
        ]);
      }

      const [userRows] = await connection.query(
        "SELECT * FROM users WHERE phone_number = ?",
        [phone_number],
      );
      const user = userRows[0];

      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      // ✅ BLOCK CHECK
      if (user.status === "blocked") {
        return res.status(403).json({
          success: false,
          error: "Your account has been blocked. Please contact support.",
        });
      }

      const token = jwt.sign(
        {
          userId: user.id,
          phone_number: user.phone_number,
          email: user.email,
          full_name: user.full_name,
          is_verified: true,
          is_profile_complete: user.is_profile_complete,
        },
        JWT_SECRET,
        { expiresIn: "30d" },
      );

      const { password, ...userWithoutPassword } = user;

      return res.status(200).json({
        success: true,
        message: "OTP verified successfully",
        data: {
          user: userWithoutPassword,
          token,
          is_profile_complete: user.is_profile_complete === 1,
        },
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      return res
        .status(500)
        .json({ success: false, error: "Failed to verify OTP" });
    }
  }

  // 3. COMPLETE PROFILE
  static async completeProfile(req, res) {
    try {
      const {
        user_id,
        full_name,
        email,
        date_of_birth,
        gender,
        location,
        latitude,
        longitude,
        terms_accepted,
      } = req.body;

      if (!user_id || !full_name || !email) {
        return res.status(400).json({
          success: false,
          error: "User ID, full name, and email are required",
        });
      }

      if (!terms_accepted) {
        return res.status(400).json({
          success: false,
          error: "You must accept the Terms & Privacy Policy",
        });
      }

      // Check email not taken by another user
      const [existingEmail] = await connection.query(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, user_id],
      );
      if (existingEmail.length > 0) {
        return res
          .status(400)
          .json({ success: false, error: "Email already in use" });
      }

      const [updateResult] = await connection.query(
        `UPDATE users SET 
                    full_name = ?, email = ?, date_of_birth = ?, gender = ?, 
                    location = ?, latitude = ?, longitude = ?, terms_accepted = ?, 
                    is_profile_complete = TRUE 
                 WHERE id = ?`,
        [
          full_name,
          email,
          date_of_birth || null,
          gender || null,
          location || null,
          latitude || 0,
          longitude || 0,
          terms_accepted ? 1 : 0,
          user_id,
        ],
      );

      if (updateResult.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      const [userRows] = await connection.query(
        "SELECT * FROM users WHERE id = ?",
        [user_id],
      );
      const user = userRows[0];

      const token = jwt.sign(
        {
          userId: user.id,
          phone_number: user.phone_number,
          email: user.email,
          full_name: user.full_name,
          is_verified: true,
          is_profile_complete: true,
        },
        JWT_SECRET,
        { expiresIn: "30d" },
      );

      const { password, ...userWithoutPassword } = user;

      return res.status(200).json({
        success: true,
        message: "Profile completed successfully",
        data: {
          user: userWithoutPassword,
          token,
          is_profile_complete: true,
        },
      });
    } catch (error) {
      console.error("Complete profile error:", error);
      return res
        .status(500)
        .json({ success: false, error: "Failed to complete profile" });
    }
  }

  // POST /api/update_profile
  static async updateProfile(req, res) {
    try {
      const userId = getUserId(req);
      if (!userId)
        return res.status(401).json({ success: false, error: "Unauthorized" });

      const { full_name, location, bio, profile_visibility } = req.body;

      // ✅ Save image to disk and return URL
      let profile_image = null;

      // if (req.files && req.files['profile_image'] && req.files['profile_image'][0]) {
      //     const file = req.files['profile_image'][0];
      //     const uploadDir = path.join(__dirname, '../../public/uploads/profiles');
      //     if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      //     const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
      //     fs.writeFileSync(path.join(uploadDir, fileName), file.buffer);
      //     profile_image = `${req.protocol}://${req.get('host')}/uploads/profiles/${fileName}`;
      // }

      // modifed by Akhil

      if (req.files && req.files.profile_image) {
        const profileImg = req.files.profile_image;

        // multiple img selection not valid

        if (Array.isArray(profileImg)) {
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

        if (!allowedTypes.includes(profileImg.mimetype)) {
          return res.status(400).json({
            success: false,
            message: "Only image files are allowed",
          });
        }

        const folderName = "profile_img";

        const profileImgUpload = await uploadSingleImage(
          profileImg,
          folderName,
        );

        if (!profileImgUpload.status) {
          return res
            .status(400)
            .json({ success: false, error: "Error Uploading Profile picture" });
        }

        profile_image = profileImgUpload.data.url;
      }

      const vis =
        profile_visibility !== undefined && profile_visibility !== ""
          ? profile_visibility == 1 || profile_visibility === "true"
            ? 1
            : 0
          : null;

      const [result] = await connection.query(
        `UPDATE users SET 
                full_name = CASE WHEN ? IS NOT NULL THEN ? ELSE full_name END,
                location = CASE WHEN ? IS NOT NULL THEN ? ELSE location END,
                bio = CASE WHEN ? IS NOT NULL THEN ? ELSE bio END,
                profile_image = CASE WHEN ? IS NOT NULL THEN ? ELSE profile_image END,
                profile_visibility = CASE WHEN ? IS NOT NULL THEN ? ELSE profile_visibility END
             WHERE id = ?`,
        [
          full_name || null,
          full_name || null,
          location || null,
          location || null,
          bio || null,
          bio || null,
          profile_image,
          profile_image,
          vis,
          vis,
          userId,
        ],
      );

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      const [[user]] = await connection.query(
        `SELECT id, full_name, location, bio, profile_image, profile_visibility
             FROM users WHERE id = ?`,
        [userId],
      );

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: { user },
      });
    } catch (error) {
      console.error("Update profile error:", error.message);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // POST /api/submit_user_review
  static async submitUserReview(req, res) {
    try {
      const reviewer_user_id = getUserId(req); // ← CHANGE THIS
      if (!reviewer_user_id)
        return res.status(401).json({ success: false, error: "Unauthorized" });

      const { user_id, rating, feedback_label, comment } = req.body;

      if (!user_id || !rating) {
        return res
          .status(400)
          .json({ success: false, error: "user_id and rating are required" });
      }

      if (rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ success: false, error: "Rating must be between 1 and 5" });
      }

      if (parseInt(reviewer_user_id) === parseInt(user_id)) {
        return res
          .status(400)
          .json({ success: false, error: "You cannot review yourself" });
      }

      const [[reviewedUser]] = await connection.query(
        `SELECT id FROM users WHERE id = ?`,
        [user_id],
      );
      if (!reviewedUser) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      const [[existing]] = await connection.query(
        `SELECT id FROM reviews WHERE reviewer_user_id = ? AND reviewed_user_id = ?`,
        [reviewer_user_id, user_id],
      );
      if (existing) {
        return res.status(400).json({
          success: false,
          error: "You have already reviewed this user",
        });
      }

      await connection.query(
        `INSERT INTO reviews (reviewer_user_id, reviewed_user_id, rating, feedback_label, comment, created_at) 
             VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          reviewer_user_id,
          user_id,
          rating,
          feedback_label || null,
          comment || null,
        ],
      );

      await connection.query(
        `UPDATE users SET 
                total_ratings = total_ratings + 1,
                avg_stars = (
                    SELECT ROUND(AVG(rating), 1) FROM reviews WHERE reviewed_user_id = ?
                )
             WHERE id = ?`,
        [user_id, user_id],
      );

      return res.status(200).json({
        success: true,
        message: "Review submitted successfully",
      });
    } catch (error) {
      console.error("Submit review error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  // GET /api/get_user_profile/:user_id
  static async getUserProfile(req, res) {
    try {
      const user_id = parseInt(req.params.user_id);
      if (isNaN(user_id) || user_id <= 0) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid user ID" });
      }

      // Get user details
      const [[user]] = await connection.query(
        `SELECT id, full_name, location, profile_image, bio, avg_stars, total_ratings 
             FROM users WHERE id = ?`,
        [user_id],
      );

      if (!user) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      const requestingUserId = getUserId(req);
      if (user.profile_visibility === 0 && requestingUserId !== user_id) {
        return res
          .status(403)
          .json({ success: false, error: "This profile is private" });
      }

      // Trade stats
      const [[giveCount]] = await connection.query(
        `SELECT COUNT(*) as total FROM giveaways 
             WHERE user_id = ? AND post_type = 'give' AND status IN ('Active', 'Completed')`,
        [user_id],
      );

      const [[takeCount]] = await connection.query(
        `SELECT COUNT(*) as total FROM giveaways 
             WHERE user_id = ? AND post_type = 'take' AND status IN ('Active', 'Completed')`,
        [user_id],
      );

      // Reviews list
      const [reviews] = await connection.query(
        `SELECT r.id, u.full_name as reviewer_name, u.profile_image as reviewer_image, 
                    r.rating, r.feedback_label, r.comment, r.created_at
             FROM reviews r
             LEFT JOIN users u ON u.id = r.reviewer_user_id
             WHERE r.reviewed_user_id = ?
             ORDER BY r.created_at DESC`,
        [user_id],
      );

      const totalGives = giveCount.total;
      const totalTakes = takeCount.total;

      return res.status(200).json({
        success: true,
        data: {
          user_details: {
            id: user.id,
            full_name: user.full_name,
            location: user.location,
            image: user.profile_image,
            bio: user.bio,
            average_rating: user.avg_stars ?? "0.0",
            total_reviews: user.total_ratings ?? 0,
          },
          trade_stats: {
            total_gives: totalGives,
            total_takes: totalTakes,
            total_trades: totalGives + totalTakes,
          },
          reviews: reviews.map((r) => ({
            id: r.id,
            reviewer_name: r.reviewer_name,
            reviewer_image: r.reviewer_image,
            rating: r.rating,
            feedback_label: r.feedback_label,
            comment: r.comment,
            created_at: r.created_at,
          })),
        },
      });
    } catch (error) {
      console.error("Get user profile error:", error);
      return res
        .status(500)
        .json({ success: false, error: "Failed to get user profile" });
    }
  }
}

module.exports = AuthController;
