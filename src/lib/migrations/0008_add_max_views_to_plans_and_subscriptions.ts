import { getDbPool } from "../src/lib/db";

export async function up() {
  const pool = getDbPool();
  try {
    await pool.query(`ALTER TABLE plans ADD COLUMN max_views INT NOT NULL DEFAULT 0 AFTER max_messages_day`);
    console.log("Colunm max_views adicionada em plans");
  } catch (e: any) {
    if (!e.message.includes("Duplicate column name")) {
      console.log("plans:", e.message);
    }
  }

  try {
    await pool.query(`ALTER TABLE subscriptions ADD COLUMN plan_snapshot_max_views INT NULL DEFAULT 0 AFTER plan_snapshot_max_messages_day`);
    console.log("Colunm plan_snapshot_max_views adicionada em subscriptions");
  } catch (e: any) {
    if (!e.message.includes("Duplicate column name")) {
      console.log("subscriptions:", e.message);
    }
  }
}
