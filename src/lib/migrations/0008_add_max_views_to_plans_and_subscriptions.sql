ALTER TABLE plans ADD COLUMN max_views INT NOT NULL DEFAULT 0 AFTER max_messages_day;
ALTER TABLE subscriptions ADD COLUMN plan_snapshot_max_views INT NULL DEFAULT 0 AFTER plan_snapshot_max_messages_day;
UPDATE subscriptions s
JOIN plans p ON s.plan_id = p.id
SET s.plan_snapshot_max_views = p.max_views
WHERE s.plan_snapshot_max_views = 0 OR s.plan_snapshot_max_views IS NULL;
