const { Client } = require("pg");

async function main() {
  const client = new Client({
  host: "127.0.0.1",
  port: 5432,
  user: "artisan",
  password: "test123",
  database: "artisanos",
});
  await client.connect();
  console.log("Connexion OK");

  const result = await client.query("SELECT current_database()");
  console.log(result.rows);

  await client.end();
}

main().catch(console.error);