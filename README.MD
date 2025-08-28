Database creation query for the database schema the backend uses:

````sql
CREATE TABLE `users` (
`user_id` BINARY(16),
`user_name` VARCHAR(18) NOT NULL,
`pass_hash` VARCHAR(255) NOT NULL,
PRIMARY KEY (`user_id`)
);

CREATE TABLE `chats` (
`chat_id` BINARY(16),
`chat_name` varchar(255) NOT NULL,
PRIMARY KEY (`chat_id`)
);

CREATE TABLE `users_in_chats` (
`user_id` BINARY(16),
`chat_id` BINARY(16),
`perms` ENUM('owner', 'admin', 'member') NOT NULL DEFAULT 'member',
PRIMARY KEY (`user_id`, `chat_id`),
FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
FOREIGN KEY (`chat_id`) REFERENCES `chats` (`chat_id`) ON DELETE CASCADE
);
```

