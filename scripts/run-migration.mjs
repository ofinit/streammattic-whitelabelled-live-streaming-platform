import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function run() {
  const schemaPath = resolve(process.cwd(), 'scripts/001-schema.sql');
  const seedPath = resolve(process.cwd(), 'scripts/002-seed.sql');

  // Read schema SQL
  const schemaSql = readFileSync(schemaPath, 'utf-8');
  
  // Split by semicolons but respect $$ function bodies
  const statements = splitStatements(schemaSql);
  
  console.log(`Found ${statements.length} SQL statements to execute`);
  
  let success = 0;
  let skipped = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim();
    if (!stmt) continue;
    
    try {
      await sql(stmt);
      success++;
      if (success % 10 === 0) console.log(`  Executed ${success} statements...`);
    } catch (err) {
      // Skip "already exists" errors gracefully
      if (err.message && (
        err.message.includes('already exists') ||
        err.message.includes('duplicate key')
      )) {
        skipped++;
      } else {
        console.error(`Error on statement ${i + 1}:`, err.message);
        console.error(`Statement: ${stmt.substring(0, 120)}...`);
        // Continue on non-critical errors
      }
    }
  }
  
  console.log(`Schema: ${success} executed, ${skipped} skipped (already exist)`);
  
  // Run seed
  console.log('\nRunning seed data...');
  const seedSql = readFileSync(seedPath, 'utf-8');
  const seedStatements = splitStatements(seedSql);
  
  let seedSuccess = 0;
  let seedSkipped = 0;
  
  for (let i = 0; i < seedStatements.length; i++) {
    const stmt = seedStatements[i].trim();
    if (!stmt) continue;
    
    try {
      await sql(stmt);
      seedSuccess++;
    } catch (err) {
      if (err.message && (
        err.message.includes('duplicate key') ||
        err.message.includes('already exists') ||
        err.message.includes('unique constraint')
      )) {
        seedSkipped++;
      } else {
        console.error(`Seed error on statement ${i + 1}:`, err.message);
      }
    }
  }
  
  console.log(`Seed: ${seedSuccess} executed, ${seedSkipped} skipped (already exist)`);
  console.log('\nMigration complete!');
}

function splitStatements(sqlText) {
  const results = [];
  let current = '';
  let inDollarQuote = false;
  const lines = sqlText.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip pure comment lines
    if (trimmed.startsWith('--') && !inDollarQuote) continue;
    
    // Track $$ blocks (PL/pgSQL function bodies)
    const dollarCount = (line.match(/\$\$/g) || []).length;
    if (dollarCount % 2 !== 0) {
      inDollarQuote = !inDollarQuote;
    }
    
    current += line + '\n';
    
    // If line ends with ; and we're not inside a $$ block, it's end of statement
    if (trimmed.endsWith(';') && !inDollarQuote) {
      const stmt = current.trim();
      if (stmt && stmt !== ';') {
        results.push(stmt);
      }
      current = '';
    }
  }
  
  // Don't lose trailing content
  if (current.trim()) {
    results.push(current.trim());
  }
  
  return results;
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
