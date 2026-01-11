CREATE TABLE `loans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bankName` varchar(255) NOT NULL,
	`loanName` varchar(255) NOT NULL,
	`loanType` enum('personal','mortgage','auto','student','other') NOT NULL,
	`originalAmount` decimal(15,2) NOT NULL,
	`currentBalance` decimal(15,2) NOT NULL,
	`interestRate` decimal(5,2) NOT NULL,
	`monthlyPayment` decimal(15,2) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`color` varchar(7) DEFAULT '#8b5cf6',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `loans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`theme` enum('light','dark','system') NOT NULL DEFAULT 'system',
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`language` varchar(5) NOT NULL DEFAULT 'es',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `userPreferences_userId_unique` UNIQUE(`userId`)
);
