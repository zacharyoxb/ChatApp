Database creation query for the database schema the backend uses:

````sql
CREATE TABLE `users` (
  `user_id` BINARY(16) PRIMARY KEY,
  `user_name` VARCHAR(18) NOT NULL UNIQUE,
  `pass_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `chats` (
  `chat_id` BINARY(16) PRIMARY KEY,
  `chat_name` VARCHAR(255) NOT NULL,
  `created_by` BINARY(16),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `is_public` BOOLEAN DEFAULT FALSE,
  `last_message_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
);

CREATE TABLE `users_in_chats` (
  `user_id` BINARY(16),
  `chat_id` BINARY(16),
  `role` ENUM('owner', 'admin', 'member') NOT NULL DEFAULT 'member',
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `chat_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`chat_id`) REFERENCES `chats` (`chat_id`) ON DELETE CASCADE
);

CREATE TABLE `dm_chats` (
  `chat_id` BINARY(16) PRIMARY KEY,
  `user1_id` BINARY(16) NOT NULL,
  `user2_id` BINARY(16) NOT NULL,
  `lower_user_id` BINARY(16) AS (LEAST(user1_id, user2_id)) STORED,
  `higher_user_id` BINARY(16) AS (GREATEST(user1_id, user2_id)) STORED,
  `last_message_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`chat_id`) REFERENCES `chats` (`chat_id`) ON DELETE CASCADE,
  FOREIGN KEY (`user1_id`) REFERENCES `users` (`user_id`),
  FOREIGN KEY (`user2_id`) REFERENCES `users` (`user_id`),
  UNIQUE KEY `dm_chat` (`lower_user_id`, `higher_user_id`)
);
```

Don't forget the indexes for performance:
````sql
CREATE INDEX idx_chats_public ON chats(is_public);
CREATE INDEX idx_users_in_chats_user ON users_in_chats(user_id);
```
