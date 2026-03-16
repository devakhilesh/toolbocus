-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 16, 2026 at 10:01 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- Database: `toolbocs`
CREATE DATABASE IF NOT EXISTS `toolbocs` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `toolbocs`;


-- --------------------------------------------------------
-- Table structure for table `admin_login`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin_login` (
  `admin_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'admin',
  `status` enum('active','inactive') DEFAULT 'active',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=2;

-- Dumping data for table `admin_login`
INSERT INTO `admin_login` (`admin_id`, `username`, `email`, `password_hash`, `role`, `status`, `last_login`, `created_at`, `updated_at`) VALUES
(1, 'admin01', 'admin@example.com', '123', 'admin', 'active', NULL, '2026-02-11 06:45:52', '2026-02-17 09:28:57');


-- --------------------------------------------------------
-- Table structure for table `categories`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `sub_id` int(11) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `status` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=12;

INSERT INTO `categories` (`id`, `name`, `sub_id`, `image_url`, `status`, `created_at`) VALUES
(1, 'Mobile Phones', 1, 'uploads/icons/mobiles.png', 1, '2026-02-09 06:11:53'),
(2, 'Laptops & Computers', 1, 'uploads/icons/laptops.png', 1, '2026-02-09 06:11:53'),
(3, 'Cameras & Lenses', 1, 'uploads/icons/cameras.png', 1, '2026-02-09 06:11:53'),
(4, 'Organic Fruits', 2, 'uploads/icons/fruits.png', 1, '2026-02-09 06:11:53'),
(5, 'Home-made Snacks', 2, 'uploads/icons/snacks.png', 1, '2026-02-09 06:11:53'),
(6, 'Dairy Products', 2, 'uploads/icons/dairy.png', 1, '2026-02-09 06:11:53'),
(7, 'Cars', 3, 'uploads/icons/cars.png', 1, '2026-02-09 06:11:53'),
(8, 'Bikes & Scooters', 3, 'uploads/icons/bikes.png', 1, '2026-02-09 06:11:53'),
(9, 'Sofas & Dining', 4, 'uploads/icons/sofa.png', 1, '2026-02-09 06:11:53'),
(10, 'Beds & Wardrobes', 4, 'uploads/icons/beds.png', 1, '2026-02-09 06:11:53');


-- --------------------------------------------------------
-- Table structure for table `giveaways`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `giveaways` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `post_type` enum('give','take') NOT NULL DEFAULT 'give',
  `pickup_area` varchar(255) NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `area_diameter` int(11) DEFAULT 5,
  `trade_type` enum('Temporary','Permanent') DEFAULT 'Temporary',
  `item_name` varchar(255) NOT NULL,
  `item_category` varchar(100) NOT NULL,
  `item_category_id` int(11) DEFAULT NULL,
  `item_condition` enum('New','Like New','Used') NOT NULL,
  `item_note` text DEFAULT NULL,
  `item_source` enum('Homemade','Store bought') DEFAULT NULL,
  `item_images` text DEFAULT NULL,
  `return_type` enum('Price','Item') NOT NULL,
  `price_min` decimal(10,2) DEFAULT 0.00,
  `price_max` decimal(10,2) DEFAULT 0.00,
  `is_negotiable` tinyint(1) DEFAULT 0,
  `return_item_name` varchar(255) DEFAULT NULL,
  `return_item_category` varchar(100) DEFAULT NULL,
  `return_item_condition` varchar(100) DEFAULT NULL,
  `return_item_description` text DEFAULT NULL,
  `return_item_source` varchar(100) DEFAULT NULL,
  `return_item_images` text DEFAULT NULL,
  `wallet_credits` int(11) DEFAULT 0,
  `notify_partners_only` tinyint(1) DEFAULT 0,
  `status` enum('Active','Inactive','Deleted','Completed') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `flow_id` int(11) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_post_type` (`post_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=89;

-- (Inserts for giveaways kept as in original dump; due to length they are omitted here for brevity.
-- Include your original INSERT INTO `giveaways` ... lines when saving the file.)

-- --------------------------------------------------------
-- Table structure for table `onboarding_screens`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `onboarding_screens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `screen_order` int(11) NOT NULL DEFAULT 1,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=8;

INSERT INTO `onboarding_screens` (`id`, `title`, `description`, `image_url`, `screen_order`, `status`, `created_at`, `updated_at`) VALUES
(4, 'Sell What You Don’t Need', 'Turn your unused items into instant cash with just a few taps.', '/uploads/onboarding/1772015954772-Group (1).png', 1, 'active', '2026-02-25 10:39:14', '2026-02-25 10:54:05'),
(5, 'Buy Quality. Pay Less.', 'Discover verified listings near you at the best prices.', '/uploads/onboarding/1772016009742-Illustration.png', 2, 'active', '2026-02-25 10:40:09', '2026-02-25 10:54:31'),
(6, 'Buy & Sell Locally, Safely', 'Chat directly, meet nearby, and deal with confidence.', '/uploads/onboarding/1772016083439-OBJECTS (2).png', 2, 'active', '2026-02-25 10:41:23', '2026-02-25 10:54:15'),
(7, 'sell', 'description', '/uploads/onboarding/1773223290741-Screenshot (66).png', 1, 'active', '2026-03-11 10:01:30', '2026-03-11 10:01:30');


-- --------------------------------------------------------
-- Table structure for table `otps`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `otps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `phone_number` varchar(15) NOT NULL,
  `otp_code` varchar(6) NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_phone_otp` (`phone_number`,`otp_code`),
  KEY `idx_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=110;

INSERT INTO `otps` (`id`, `phone_number`, `otp_code`, `expires_at`, `is_used`, `created_at`) VALUES
(12, '8888888888', '123456', '2026-02-18 06:58:54', 1, '2026-02-18 06:48:54'),
(16, '7058143404', '123456', '2026-02-18 12:53:30', 1, '2026-02-18 12:43:30'),
(17, '9053050958', '123456', '2026-02-18 13:16:54', 1, '2026-02-18 13:06:54'),
(18, '9191919199', '123456', '2026-02-18 13:44:59', 1, '2026-02-18 13:34:59');
-- (and more rows as in original dump...)


-- --------------------------------------------------------
-- Table structure for table `post_deductions`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `post_deductions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `post_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- --------------------------------------------------------
-- Table structure for table `ratings`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ratings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `owner_id` int(11) NOT NULL,
  `rater_id` int(11) NOT NULL,
  `stars` tinyint(4) NOT NULL,
  `review` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `owner_id` (`owner_id`),
  KEY `rater_id` (`rater_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci AUTO_INCREMENT=7;


-- --------------------------------------------------------
-- Table structure for table `reviews`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reviewer_user_id` int(11) NOT NULL,
  `reviewed_user_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL,
  `feedback_label` varchar(100) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci AUTO_INCREMENT=5;

INSERT INTO `reviews` (`id`, `reviewer_user_id`, `reviewed_user_id`, `rating`, `feedback_label`, `comment`, `created_at`) VALUES
(1, 17, 18, 5, 'Friendly', 'Excellent experience!', '2026-03-07 13:26:44'),
(2, 20, 17, 5, 'Friendly', 'Good', '2026-03-07 18:36:28'),
(3, 19, 17, 5, 'Friendly', NULL, '2026-03-07 18:43:41'),
(4, 17, 23, 5, 'Friendly', NULL, '2026-03-09 13:04:39');


-- --------------------------------------------------------
-- Table structure for table `subscriptions`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=27;

INSERT INTO `subscriptions` (`id`, `name`, `price`, `description`, `status`, `created_at`, `start_date`, `end_date`) VALUES
(2, 'test', 50.00, '', 'active', '2026-03-10 06:24:08', '2026-03-10', '2026-04-14'),
(16, 'testing12', 300.00, '', 'active', '2026-03-11 05:00:15', '2026-03-11', '2026-04-14');


-- --------------------------------------------------------
-- Table structure for table `subscription_transactions`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subscription_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `subscription_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `transaction_type` enum('purchase','renewal') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- --------------------------------------------------------
-- Table structure for table `tbl_notifications`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tbl_notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `notification_title` varchar(255) NOT NULL,
  `notification_message` text NOT NULL,
  `recipient_type` int(11) NOT NULL,
  `created_by` int(11) DEFAULT NULL,
  `status` tinyint(4) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=3;

INSERT INTO `tbl_notifications` (`id`, `notification_title`, `notification_message`, `recipient_type`, `created_by`, `status`, `created_at`) VALUES
(2, 'created', 'creating', 3, 1, 1, '2026-03-11 09:29:09');


-- --------------------------------------------------------
-- Table structure for table `trade_responses`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `trade_responses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `giveaway_id` int(11) NOT NULL,
  `poster_user_id` int(11) NOT NULL,
  `responder_user_id` int(11) NOT NULL,
  `giving_item_name` varchar(255) NOT NULL,
  `giving_item_category` varchar(100) DEFAULT NULL,
  `giving_item_category_id` int(11) DEFAULT NULL,
  `giving_item_condition` enum('New','Like New','Used') DEFAULT NULL,
  `giving_item_images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `giving_item_note` text DEFAULT NULL,
  `giving_is_homemade` tinyint(1) DEFAULT 0,
  `giving_is_store_bought` tinyint(1) DEFAULT 0,
  `return_type` enum('item','price','free','existing') NOT NULL,
  `return_item_name` varchar(255) DEFAULT NULL,
  `return_item_category` varchar(100) DEFAULT NULL,
  `return_item_condition` varchar(50) DEFAULT NULL,
  `return_item_description` text DEFAULT NULL,
  `return_is_homemade` tinyint(1) DEFAULT 0,
  `return_is_store_bought` tinyint(1) DEFAULT 0,
  `return_item_images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `price_range_start` decimal(10,2) DEFAULT 0.00,
  `price_range_end` decimal(10,2) DEFAULT 0.00,
  `offer_price` decimal(10,2) DEFAULT 0.00,
  `offer_is_negotiable` tinyint(1) DEFAULT 0,
  `status` enum('pending','accepted','rejected','meeting_set','completed','cancelled') DEFAULT 'pending',
  `meeting_type` enum('come_to_me','i_pick_up','centre_point') DEFAULT NULL,
  `meeting_location` varchar(255) DEFAULT NULL,
  `meeting_latitude` decimal(10,8) DEFAULT NULL,
  `meeting_longitude` decimal(11,8) DEFAULT NULL,
  `meeting_scheduled_at` datetime DEFAULT NULL,
  `payment_confirmed` tinyint(1) DEFAULT 0,
  `payment_amount` decimal(10,2) DEFAULT 0.00,
  `rejected_by` int(11) DEFAULT NULL,
  `rejected_reason` text DEFAULT NULL,
  `notify_poster` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `flow_id` int(11) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `giveaway_id` (`giveaway_id`),
  KEY `poster_user_id` (`poster_user_id`),
  KEY `responder_user_id` (`responder_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci AUTO_INCREMENT=13;

-- (Insert rows for trade_responses as per original dump if you need them)


-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `phone_number` varchar(15) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `is_profile_complete` tinyint(1) DEFAULT 0,
  `terms_accepted` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `avg_stars` decimal(2,1) DEFAULT 0.0,
  `total_ratings` int(11) DEFAULT 0,
  `status` enum('active','blocked') DEFAULT 'active',
  `bio` text DEFAULT NULL,
  `profile_image` longtext DEFAULT NULL,
  `profile_visibility` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone_number` (`phone_number`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_phone` (`phone_number`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=31;

INSERT INTO `users` (`id`, `phone_number`, `full_name`, `email`, `password`, `date_of_birth`, `gender`, `location`, `latitude`, `longitude`, `is_verified`, `is_profile_complete`, `terms_accepted`, `created_at`, `updated_at`, `avg_stars`, `total_ratings`, `status`, `bio`, `profile_image`, `profile_visibility`) VALUES
(17, '7588012884', 'Nikhil Bare', 'nikhil@gmail.com', NULL, '1990-01-01', 'Male', 'address, IND', 18.52467000, 73.87860000, 1, 1, 1, '2026-03-06 10:27:21', '2026-03-09 04:50:42', 5.0, 2, 'active', NULL, NULL, 1),
(18, '7575757575', 'Demo user 1', 'demo@gmail.com', NULL, '2005-03-10', 'Male', '201B, Ambegaon Budruk, Pune, Maharashtra', 18.45777380, 73.83046630, 1, 1, 1, '2026-03-06 10:51:52', '2026-03-07 07:56:44', 5.0, 1, 'active', NULL, NULL, 1);


-- --------------------------------------------------------
-- Table structure for table `user_subscriptions`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `subscription_id` int(11) DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `remaining_balance` decimal(10,2) DEFAULT NULL,
  `used_posts` int(11) DEFAULT 0,
  `post_price` decimal(10,2) DEFAULT 5.00,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=15;

INSERT INTO `user_subscriptions` (`id`, `user_id`, `subscription_id`, `total_amount`, `remaining_balance`, `used_posts`, `post_price`, `start_date`, `end_date`, `status`, `created_at`) VALUES
(1, 24, 2, 50.00, 50.00, 0, 5.00, '2026-03-10 16:28:46', '2026-04-09 16:28:46', 'active', '2026-03-10 10:58:46');


-- --------------------------------------------------------
-- Foreign key constraints (run after all tables exist)
-- --------------------------------------------------------
ALTER TABLE `giveaways`
  ADD CONSTRAINT `giveaways_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `ratings`
  ADD CONSTRAINT `ratings_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `ratings_ibfk_2` FOREIGN KEY (`rater_id`) REFERENCES `users` (`id`);

ALTER TABLE `trade_responses`
  ADD CONSTRAINT `trade_responses_ibfk_1` FOREIGN KEY (`giveaway_id`) REFERENCES `giveaways` (`id`),
  ADD CONSTRAINT `trade_responses_ibfk_2` FOREIGN KEY (`poster_user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `trade_responses_ibfk_3` FOREIGN KEY (`responder_user_id`) REFERENCES `users` (`id`);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;