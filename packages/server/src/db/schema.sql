-- EventNoti Database Schema
-- SQLite

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user')),
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Webhook 配置表
CREATE TABLE IF NOT EXISTS webhooks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 分组表 (created_by column added via migration for existing databases)
CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    webhook_id INTEGER REFERENCES webhooks(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id),  -- Legacy column for backward compatibility
    created_by INTEGER REFERENCES users(id),  -- 创建者（管理员）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 用户-分组关联表（管理员分配用户到分组）
CREATE TABLE IF NOT EXISTS user_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    assigned_by INTEGER NOT NULL REFERENCES users(id),  -- 分配者（管理员）
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, group_id)
);

-- 事件表
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    target_date DATE NOT NULL,
    target_time TEXT DEFAULT '09:00',  -- 通知时间，格式 HH:MM
    remind_days INTEGER DEFAULT 7,
    message_format TEXT DEFAULT 'text' CHECK(message_format IN ('text', 'markdown')),  -- 消息格式
    group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired', 'completed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 通知记录表
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    scheduled_time TEXT DEFAULT '09:00',  -- 通知时间，格式 HH:MM
    sent_at DATETIME,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_target_date ON events(target_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_group_id ON events(group_id);
-- idx_groups_created_by created in migration after column is added
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_date ON notifications(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_event_id ON notifications(event_id);
-- idx_user_groups indexes created in migration

-- 循环提醒表
CREATE TABLE IF NOT EXISTS recurring_reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT DEFAULT 'custom' CHECK(category IN ('stand', 'water', 'eye', 'medicine', 'custom')),
    interval_minutes INTEGER NOT NULL,
    start_time TEXT DEFAULT '09:00',
    end_time TEXT DEFAULT '18:00',
    workdays_only INTEGER DEFAULT 1,
    group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
    message_format TEXT DEFAULT 'text' CHECK(message_format IN ('text', 'markdown')),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'disabled')),
    last_sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 循环提醒发送日志表
CREATE TABLE IF NOT EXISTS recurring_reminder_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reminder_id INTEGER NOT NULL REFERENCES recurring_reminders(id) ON DELETE CASCADE,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'sent' CHECK(status IN ('sent', 'failed')),
    error_message TEXT
);

-- 循环提醒索引
CREATE INDEX IF NOT EXISTS idx_recurring_reminders_user_id ON recurring_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_reminders_status ON recurring_reminders(status);
CREATE INDEX IF NOT EXISTS idx_recurring_reminders_category ON recurring_reminders(category);
CREATE INDEX IF NOT EXISTS idx_recurring_reminder_logs_reminder_id ON recurring_reminder_logs(reminder_id);
CREATE INDEX IF NOT EXISTS idx_recurring_reminder_logs_sent_at ON recurring_reminder_logs(sent_at);

-- 系统设置表
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 默认设置
INSERT OR IGNORE INTO settings (key, value) VALUES ('timezone', 'Asia/Shanghai');
