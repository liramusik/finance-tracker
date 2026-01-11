CREATE TABLE `accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`bankName` varchar(255) NOT NULL,
	`accountNumber` varchar(100),
	`accountType` enum('checking','savings','investment') NOT NULL DEFAULT 'checking',
	`balance` decimal(15,2) NOT NULL DEFAULT '0.00',
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`color` varchar(7) DEFAULT '#3b82f6',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(255) NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`color` varchar(7) DEFAULT '#6b7280',
	`icon` varchar(50),
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creditCards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`bankName` varchar(255) NOT NULL,
	`lastFourDigits` varchar(4),
	`creditLimit` decimal(15,2) NOT NULL DEFAULT '0.00',
	`currentBalance` decimal(15,2) NOT NULL DEFAULT '0.00',
	`availableCredit` decimal(15,2) NOT NULL DEFAULT '0.00',
	`closingDay` int DEFAULT 1,
	`paymentDueDay` int DEFAULT 15,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`color` varchar(7) DEFAULT '#ef4444',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creditCards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accountId` int,
	`creditCardId` int,
	`categoryId` int,
	`type` enum('income','expense') NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`description` text NOT NULL,
	`transactionDate` timestamp NOT NULL,
	`notes` text,
	`isRecurring` boolean NOT NULL DEFAULT false,
	`fileUrl` text,
	`fileKey` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `uploadedFiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileType` enum('pdf','image') NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` text NOT NULL,
	`fileSize` int,
	`processingStatus` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`extractedText` text,
	`transactionsCount` int DEFAULT 0,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `uploadedFiles_id` PRIMARY KEY(`id`)
);
