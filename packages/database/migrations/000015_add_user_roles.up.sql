-- Add role column to users table for RBAC
ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'player';

-- Add constraint to ensure valid roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('player', 'moderator', 'admin'));

-- Create index for role-based queries
CREATE INDEX idx_users_role ON users (role);

-- Add comment
COMMENT ON COLUMN users.role IS 'User role for authorization: player, moderator, admin';
