USE cyberspace_db;

/* Table structure for table `users` */
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `role_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `notes` text COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_0900_ai_ci DEFAULT 'active',
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=90002;

/* Table structure for table `permissions` */
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=30003;

/* Table structure for table `lessons` */
DROP TABLE IF EXISTS `lessons`;
CREATE TABLE `lessons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `program_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `type` enum('document','video','quiz') NOT NULL DEFAULT 'document',
  `data` longtext DEFAULT NULL,
  `sequence_order` int DEFAULT '1',
  `is_required` tinyint(1) DEFAULT '1',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=210001;

/* Table structure for table `gallery` */
DROP TABLE IF EXISTS `gallery`;
CREATE TABLE `gallery` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` text COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `image_url` varchar(255) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_0900_ai_ci DEFAULT 'General',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `likes` int DEFAULT '0',
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=30007;

/* Table structure for table `teacher_lesson_progress` */
DROP TABLE IF EXISTS `teacher_lesson_progress`;
CREATE TABLE `teacher_lesson_progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int NOT NULL,
  `lesson_id` int NOT NULL,
  `status` enum('not_started','in_progress','pending_review','completed') DEFAULT 'not_started',
  `quiz_answers` json DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `uk_teacher_lesson` (`teacher_id`,`lesson_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=330001;

/* Table structure for table `articles` */
DROP TABLE IF EXISTS `articles`;
CREATE TABLE `articles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `content` longtext COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `excerpt` text COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `image_url` varchar(255) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `author` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=6;

/* Table structure for table `role_permissions` */
DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions` (
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`) /*T![clustered_index] CLUSTERED */,
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/* Table structure for table `teacher_program_assignments` */
DROP TABLE IF EXISTS `teacher_program_assignments`;
CREATE TABLE `teacher_program_assignments` (
  `teacher_id` int NOT NULL,
  `program_id` int NOT NULL,
  `assigned_by` int DEFAULT NULL,
  `assigned_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `sequence` int NOT NULL,
  PRIMARY KEY (`teacher_id`,`program_id`) /*T![clustered_index] CLUSTERED */,
  KEY `fk_tpa_program` (`program_id`),
  KEY `fk_tpa_admin` (`assigned_by`),
  CONSTRAINT `fk_tpa_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tpa_program` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tpa_admin` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/* Table structure for table `programs` */
DROP TABLE IF EXISTS `programs`;
CREATE TABLE `programs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `age_range` varchar(50) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` text COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `image_url` varchar(255) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `icon` varchar(50) COLLATE utf8mb4_0900_ai_ci DEFAULT '?',
  `bg_color` varchar(50) COLLATE utf8mb4_0900_ai_ci DEFAULT 'bg-light-blue',
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `lesson_status` enum('draft','inactive','active') COLLATE utf8mb4_0900_ai_ci DEFAULT 'draft',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=30006;

/* Table structure for table `schedules` */
DROP TABLE IF EXISTS `schedules`;
CREATE TABLE `schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int NOT NULL,
  `date` date NOT NULL,
  `time_start` time NOT NULL,
  `time_end` time NOT NULL,
  `freq_id` varchar(36) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `frequency` varchar(50) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `repeat_until` date DEFAULT NULL,
  `color` varchar(50) COLLATE utf8mb4_0900_ai_ci DEFAULT '#C7EABB',
  `program` varchar(150) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `module` varchar(150) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `location` varchar(150) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=240001;

/* Table structure for table `teacher_certifications` */
DROP TABLE IF EXISTS `teacher_certifications`;
CREATE TABLE `teacher_certifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int NOT NULL,
  `program_id` int NOT NULL,
  `assigned_by` int DEFAULT NULL,
  `certificate_code` varchar(100) NOT NULL,
  `image_link` varchar(255) DEFAULT NULL,
  `issued_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=90001;

/* Table structure for table `registrations` */
DROP TABLE IF EXISTS `registrations`;
CREATE TABLE `registrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `parent_name` varchar(255) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `child_name` varchar(255) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `child_age` int NOT NULL,
  `whatsapp_number` varchar(20) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `info_source` varchar(255) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `has_prior_experience` tinyint(1) DEFAULT '0',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=30009;

/* Table structure for table `roles` */
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=30005;

/* Table structure for table `reports` */
DROP TABLE IF EXISTS `reports`;
CREATE TABLE `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `schedule_id` int DEFAULT NULL,
  `teacher_id` int NOT NULL,
  `invoice_number` varchar(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `date` date NOT NULL,
  `time_start` time DEFAULT NULL,
  `time_end` time DEFAULT NULL,
  `program` varchar(150) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `module` varchar(150) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `total_student_attendance` int DEFAULT '0',
  `students_name` text COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `image_url` varchar(255) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci AUTO_INCREMENT=60001;

