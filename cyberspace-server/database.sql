/*
SQLyog Ultimate v12.5.1 (64 bit)
MySQL - 8.0.30 : Database - cyberspace_db
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*Table structure for table `articles` */

DROP TABLE IF EXISTS `articles`;

CREATE TABLE `articles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `content` longtext,
  `excerpt` text,
  `image_url` varchar(255) DEFAULT NULL,
  `author` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `articles` */

/*Table structure for table `gallery` */

DROP TABLE IF EXISTS `gallery`;

CREATE TABLE `gallery` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `image_url` varchar(255) NOT NULL,
  `category` varchar(50) DEFAULT 'General',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `likes` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `gallery` */

insert  into `gallery`(`id`,`title`,`description`,`image_url`,`category`,`created_at`,`likes`) values 
(3,'tes','tes','http://localhost:5000/uploads/1769594630864.png','General','2026-01-28 17:03:50',0),
(4,'testes','testes','http://localhost:5000/uploads/1769594651988.png','General','2026-01-28 17:04:11',0),
(5,'testestes','testes','http://localhost:5000/uploads/1769594669421.png','General','2026-01-28 17:04:29',0),
(6,'testestest','testest','http://localhost:5000/uploads/1769594678197.png','General','2026-01-28 17:04:38',0);

/*Table structure for table `permissions` */

DROP TABLE IF EXISTS `permissions`;

CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `permissions` */

insert  into `permissions`(`id`,`name`,`description`) values 
(1,'registrations.view',NULL),
(2,'registrations.delete',NULL);

/*Table structure for table `programs` */

DROP TABLE IF EXISTS `programs`;

CREATE TABLE `programs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `age_range` varchar(50) NOT NULL,
  `description` text,
  `image_url` varchar(255) DEFAULT NULL,
  `icon` varchar(50) DEFAULT '?',
  `bg_color` varchar(50) DEFAULT 'bg-light-blue',
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `programs` */

insert  into `programs`(`id`,`title`,`age_range`,`description`,`image_url`,`icon`,`bg_color`,`sort_order`,`is_active`,`created_at`,`updated_at`) values 
(1,'tes','Ages 4-6','Screen-free coding experience designed for young children. Learn logic through play.','http://localhost:5000/uploads/1770797933749.png','?','bg-light-blue',1,1,'2026-02-11 15:03:25','2026-02-11 15:18:53'),
(2,'Codey Rocky','Ages 6-8','The perfect entry into graphical programming and AI concepts.',NULL,'?','bg-light-purple',2,1,'2026-02-11 15:03:25','2026-02-11 15:03:25'),
(3,'mBot V2','Ages 8-12','Build and code your own robot. A hands-on journey into mechanics and sensors.',NULL,'?','bg-light-green',3,1,'2026-02-11 15:03:25','2026-02-11 15:03:25'),
(4,'Arduino & Python','Ages 12+','Advanced electronics and text-based coding for future engineers.',NULL,'⚡','bg-light-orange',4,1,'2026-02-11 15:03:25','2026-02-11 15:03:25'),
(5,'Python AI','Ages 13+','Deep dive into Artificial Intelligence and Machine Learning with Python.',NULL,'?','bg-light-blue',5,1,'2026-02-11 15:03:25','2026-02-11 15:03:25');

/*Table structure for table `registrations` */

DROP TABLE IF EXISTS `registrations`;

CREATE TABLE `registrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `parent_name` varchar(255) NOT NULL,
  `child_name` varchar(255) NOT NULL,
  `child_age` int NOT NULL,
  `whatsapp_number` varchar(20) NOT NULL,
  `info_source` varchar(255) DEFAULT NULL,
  `has_prior_experience` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `registrations` */

insert  into `registrations`(`id`,`parent_name`,`child_name`,`child_age`,`whatsapp_number`,`info_source`,`has_prior_experience`,`created_at`) values 
(1,'tes','tes',10,'','Social Media',1,'2026-01-27 17:06:50'),
(2,'q','q',11,'081121211212','Social Media',1,'2026-01-27 17:14:31'),
(3,'tes','tes',18,'081221211212','Friends/Family',1,'2026-01-27 17:27:10'),
(4,'tes','tes',12,'081221122112','Social Media',1,'2026-01-27 17:33:04'),
(5,'anto','anto',10,'089878909876','Social Media',1,'2026-01-27 23:38:47'),
(6,'tester 123','tester',17,'081221123456','Friends/Family',1,'2026-01-28 10:30:00'),
(7,'3','s',7,'33232','Friends/Family',1,'2026-01-28 11:26:08'),
(8,'zain','z',9,'088112344321','School Event',1,'2026-01-28 17:38:37');

/*Table structure for table `role_permissions` */

DROP TABLE IF EXISTS `role_permissions`;

CREATE TABLE `role_permissions` (
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `role_permissions` */

insert  into `role_permissions`(`role_id`,`permission_id`) values 
(1,1),
(2,1),
(1,2);

/*Table structure for table `roles` */

DROP TABLE IF EXISTS `roles`;

CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `roles` */

insert  into `roles`(`id`,`name`,`description`) values 
(1,'admin','Full Access'),
(2,'staff','Read Only Access');

/*Table structure for table `users` */

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int NOT NULL,
  `date` date NOT NULL,
  `time_start` time NOT NULL,
  `time_end` time NOT NULL,
  `freq_id` varchar(36) DEFAULT NULL,
  `frequency` varchar(50) DEFAULT NULL,
  `repeat_until` date DEFAULT NULL,
  `color` varchar(50) DEFAULT '#C7EABB',
  `program` varchar(150) DEFAULT NULL,
  `module` varchar(150) DEFAULT NULL,
  `location` varchar(150) DEFAULT NULL,
  `notes` text,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `schedule_id` int DEFAULT NULL,
  `teacher_id` int NOT NULL,
  `invoice_number` varchar(100) DEFAULT NULL,
  `date` date NOT NULL,
  `time_start` time DEFAULT NULL,
  `time_end` time DEFAULT NULL,
  `program` varchar(150) DEFAULT NULL,
  `module` varchar(150) DEFAULT NULL,
  `total_student_attendance` int DEFAULT '0',
  `students_name` text,
  `notes` text, /* Renamed from summary */
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `image_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `users` */

insert  into `users`(`id`,`username`,`password_hash`,`role_id`,`created_at`) values 
(1,'admin','$2b$10$GKx81DYb4.Od2m/R1r3CLOX6VtF.5O0UUwrFIGsi/7hJCaH887N6m',1,'2026-01-28 00:14:01');

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
