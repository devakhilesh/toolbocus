-- phpMyAdmin SQL Dump
-- version 5.0.4
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Aug 21, 2024 at 08:26 PM
-- Server version: 5.7.44-log
-- PHP Version: 7.4.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `propal`
--

-- --------------------------------------------------------

--
-- Table structure for table `tbl_users`
--

CREATE TABLE `tbl_users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `mobile_no` varchar(15) NOT NULL,
  `password` varchar(255) NOT NULL,
  `pass` varchar(255) NOT NULL,
  `status` int(11) NOT NULL DEFAULT '1',
  `contactname` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `companyname` varchar(50) DEFAULT NULL,
  `companydetails` varchar(255) DEFAULT NULL,
  `companyCIN` varchar(255) DEFAULT NULL,
  `reraregnumber` varchar(255) DEFAULT NULL,
  `companyaddress` varchar(255) DEFAULT NULL,
  `streetaddress` varchar(255) DEFAULT NULL,
  `city` varchar(70) DEFAULT NULL,
  `state` varchar(70) DEFAULT NULL,
  `postalcode` int(11) DEFAULT NULL,
  `role` int(11) NOT NULL DEFAULT '2' COMMENT '0=admin,1=Builder,2=user',
  `website` varchar(70) DEFAULT NULL,
  `token` text,
  `soft_delete` int(11) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `wallet` float(11,2) NOT NULL DEFAULT '0.00',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `profile_image` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `tbl_users`
--

INSERT INTO `tbl_users` (`id`, `name`, `mobile_no`, `password`, `pass`, `status`, `contactname`, `email`, `companyname`, `companydetails`, `companyCIN`, `reraregnumber`, `companyaddress`, `streetaddress`, `city`, `state`, `postalcode`, `role`, `website`, `token`, `soft_delete`, `created_at`, `updated_at`, `wallet`, `start_date`, `end_date`, `profile_image`) VALUES
(2, 'Admin', '234334343', 'e10adc3949ba59abbe56e057f20f883e', '123456', 1, 'tgrf', 'test@gmail.com', '4444444444', 'fdc', 'wefd', 'er', 'erfd', '3B street', 'Mumbai', 'Maharashtra', 411043, 0, 'refd', 'a85e3864098152d9db0a3729b3d64df0', 1, '2024-05-31 10:59:19', '2024-08-21 12:25:36', 3978.00, '2024-05-31', '2025-04-18', 'public/Images/Profile_images/profileImage-1724236080144.png'),
(7, 'User', '7219864404', '8aa2936902836cbf5a4b1192cf1ac876', '6698965c', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, NULL, NULL, 1, '2024-07-12 06:56:35', '2024-07-28 16:24:36', 100.00, NULL, NULL, NULL),
(10, 'TEST', '9898989898', 'f3bb568b983bd08088e5de20ffb9fbd3', '9def96b1', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, NULL, NULL, 1, '2024-07-17 10:06:03', '2024-07-28 16:24:35', 100.00, NULL, NULL, NULL),
(12, 'shivani', '7057015007', 'ca68b4b350c0fe1aa4af4ee684b02507', 'f63533fb', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, NULL, NULL, 1, '2024-07-22 06:06:29', '2024-07-28 16:24:32', 100.00, NULL, NULL, NULL),
(13, 'shivani', '7057015008', '8176ece90b8bb31c84c98996e194c347', '90ed6063', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, NULL, NULL, 1, '2024-07-22 06:42:55', '2024-07-28 16:24:30', 100.00, NULL, NULL, NULL),
(18, 'User', '7058143404', '8989a501736d74bbe5cc39c4f4635214', '93a1be65', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, NULL, NULL, 1, '2024-08-01 05:39:02', NULL, 0.00, NULL, NULL, NULL),
(19, 'test', '8989898989', 'a4315a020afb217ea3bc89a414b86201', '6e586615', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, NULL, NULL, 1, '2024-08-03 12:00:38', NULL, 0.00, NULL, NULL, NULL),
(20, 'sssss', '7987958005', '03ef8a78035dde18acd59ee4800be299', 'd48aa2cd', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, NULL, NULL, 1, '2024-08-06 05:43:28', NULL, 0.00, NULL, NULL, NULL),
(21, 'User', '8754557680', '4e57b95f690e9ab15b53c6cdf3106990', 'd6cb9bdb', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, NULL, NULL, 1, '2024-08-07 06:45:49', NULL, 0.00, NULL, NULL, NULL),
(22, 'shivani', '7056016009', '7e0da6e7ad503b4ba018dcd1c4e9456e', '6adbd610', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, 1, '2024-08-20 05:43:05', '2024-08-20 07:00:23', 0.00, NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `tbl_users`
--
ALTER TABLE `tbl_users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `tbl_users`
--
ALTER TABLE `tbl_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
