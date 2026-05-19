import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const sql = postgres(process.env.DATABASE_URL!);
  
  console.log('Creating tables...');
  
  await sql`
    CREATE TABLE IF NOT EXISTS visits (
      id SERIAL PRIMARY KEY,
      date VARCHAR(10) NOT NULL,
      hashed_ip VARCHAR(64) NOT NULL,
      session VARCHAR(64) NOT NULL,
      country VARCHAR(10),
      page VARCHAR(256) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      type VARCHAR(64) NOT NULL,
      project VARCHAR(256),
      platform VARCHAR(64),
      session VARCHAR(64) NOT NULL,
      date VARCHAR(10) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS feedback (
      id SERIAL PRIMARY KEY,
      rating INT NOT NULL,
      comment TEXT,
      name VARCHAR(256),
      date VARCHAR(64) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key VARCHAR(64) PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  console.log('Tables created successfully!');
  await sql.end();
}

run().catch(console.error);
