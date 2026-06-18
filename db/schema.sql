-- ---------------------------------------------------------------------------
-- Penguin World - MySQL schema
-- ---------------------------------------------------------------------------
-- Run with:  mysql -u root -p < db/schema.sql
-- or use:    npm run init-db  (reads connection details from .env)
-- ---------------------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS penguin_world
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE penguin_world;

-- Users -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(20)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB;

-- Avatars ---------------------------------------------------------------------
-- One avatar per user (1:1). Holds cosmetic / display data.
CREATE TABLE IF NOT EXISTS avatars (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  nickname   VARCHAR(20)  NOT NULL,
  body_color VARCHAR(7)   NOT NULL DEFAULT '#3498db', -- hex color, e.g. #3498db
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_avatars_user (user_id),
  CONSTRAINT fk_avatars_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;
