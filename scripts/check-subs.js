const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

// Manual simple .env parser
function loadEnv() {
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] ? match[2].trim() : "";
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "dias_imports_v3"
  });

  const [toExpire] = await conn.query(`
    SELECT s.id, s.company_id, c.name as company, s.plan_snapshot_name, s.status, 
           s.current_period_start, s.current_period_end, 
           CURDATE() as cur_date, NOW() as cur_time,
           s.current_period_end < CURDATE() as is_less_curdate,
           s.current_period_end < NOW() as is_less_now
    FROM subscriptions s
    LEFT JOIN companies c ON c.id = s.company_id
    WHERE s.status = 'active'
  `);

  console.log("=== ASSINATURAS ATIVAS VENCIDAS (DEVERIAM EXPIRAR) ===");
  console.table(toExpire);

  const [all] = await conn.query(`
    SELECT s.id, s.company_id, c.name as company, s.plan_snapshot_name, s.status, s.current_period_start, s.current_period_end
    FROM subscriptions s
    LEFT JOIN companies c ON c.id = s.company_id
    ORDER BY s.id DESC
    LIMIT 20
  `);

  console.log("=== ULTIMAS 20 ASSINATURAS CADASTRADAS ===");
  console.table(all);

  await conn.end();
}

run().catch(console.error);
