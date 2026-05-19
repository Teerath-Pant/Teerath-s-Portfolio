import fs from 'fs';
import path from 'path';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const sql = postgres(process.env.DATABASE_URL!);
  
  console.log('Migrating Analytics Data...');
  try {
    const analyticsPath = path.resolve(__dirname, 'analytics.json');
    if (fs.existsSync(analyticsPath)) {
      const data = JSON.parse(fs.readFileSync(analyticsPath, 'utf-8'));
      
      // Migrate visits
      if (data.visits && data.visits.length > 0) {
        for (const v of data.visits) {
          await sql`
            INSERT INTO visits (date, hashed_ip, session, country, page)
            VALUES (${v.date}, ${v.hashedIp}, ${v.session}, ${v.country || 'XX'}, ${v.page || '/'})
          `;
        }
        console.log(`Migrated ${data.visits.length} visits.`);
      }

      // Migrate events
      if (data.events && data.events.length > 0) {
        for (const e of data.events) {
          await sql`
            INSERT INTO events (type, project, platform, session, date)
            VALUES (${e.type}, ${e.project || null}, ${e.platform || null}, ${e.session}, ${e.date})
          `;
        }
        console.log(`Migrated ${data.events.length} events.`);
      }

      // Migrate ignoredIpHash
      if (data.ignoredIpHash) {
        await sql`
          INSERT INTO settings (key, value)
          VALUES (${'ignoredIpHash'}, ${data.ignoredIpHash})
          ON CONFLICT (key) DO UPDATE SET value = ${data.ignoredIpHash}
        `;
        console.log('Migrated ignoredIpHash setting.');
      }
    }
  } catch (err) {
    console.error('Error migrating analytics:', err);
  }

  console.log('Migrating Feedback Data...');
  try {
    const feedbackPath = path.resolve(__dirname, 'feedback.json');
    if (fs.existsSync(feedbackPath)) {
      const data = JSON.parse(fs.readFileSync(feedbackPath, 'utf-8'));
      
      if (data.feedback && data.feedback.length > 0) {
        for (const f of data.feedback) {
          await sql`
            INSERT INTO feedback (rating, comment, name, date)
            VALUES (${f.rating}, ${f.comment || ''}, ${f.name || 'Anonymous'}, ${f.date})
          `;
        }
        console.log(`Migrated ${data.feedback.length} feedback entries.`);
      }
    }
  } catch (err) {
    console.error('Error migrating feedback:', err);
  }

  console.log('Migration complete!');
  await sql.end();
}

run().catch(console.error);
