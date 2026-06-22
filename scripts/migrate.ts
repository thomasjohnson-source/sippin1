import postgres from 'postgres'
import * as dotenv from 'fs'

// Load .env.local manually
try {
  const env = require('fs').readFileSync('.env.local', 'utf8')
  for (const line of env.split('\n')) {
    const [k, ...v] = line.split('=')
    if (k && !k.startsWith('#')) process.env[k.trim()] = v.join('=').trim()
  }
} catch { /* no .env.local */ }

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' })

async function main() {
  console.log('Creating tables...')
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      company_name TEXT NOT NULL DEFAULT 'OJ Sippin',
      company_address TEXT NOT NULL DEFAULT '',
      company_phone TEXT NOT NULL DEFAULT '',
      company_email TEXT NOT NULL DEFAULT '',
      company_ein TEXT NOT NULL DEFAULT '',
      invoice_tax_rate REAL NOT NULL DEFAULT 0,
      invoice_terms TEXT NOT NULL DEFAULT 'Net 30',
      invoice_notes TEXT NOT NULL DEFAULT '',
      next_invoice_number INTEGER NOT NULL DEFAULT 1,
      bank_account_name TEXT NOT NULL DEFAULT '',
      bank_name TEXT NOT NULL DEFAULT '',
      bank_routing TEXT NOT NULL DEFAULT '',
      bank_account_number TEXT NOT NULL DEFAULT '',
      bank_account_type TEXT NOT NULL DEFAULT 'Checking',
      bank_notes TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      sku TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      unit TEXT NOT NULL DEFAULT 'can',
      unit_cost REAL NOT NULL DEFAULT 0,
      unit_cost_override INTEGER NOT NULL DEFAULT 0,
      sale_price REAL NOT NULL DEFAULT 0,
      current_stock REAL NOT NULL DEFAULT 0,
      low_stock_threshold REAL NOT NULL DEFAULT 50,
      active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS ingredients (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT 'each',
      cost_per_unit REAL NOT NULL DEFAULT 0,
      batch_price REAL NOT NULL DEFAULT 0,
      cans_per_batch REAL NOT NULL DEFAULT 0,
      product_id INTEGER REFERENCES products(id),
      current_stock REAL NOT NULL DEFAULT 0,
      low_stock_threshold REAL NOT NULL DEFAULT 100
    );
    CREATE TABLE IF NOT EXISTS batch_recipes (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id),
      batch_size INTEGER NOT NULL DEFAULT 24,
      name TEXT NOT NULL DEFAULT 'Standard Batch'
    );
    CREATE TABLE IF NOT EXISTS batch_recipe_lines (
      id SERIAL PRIMARY KEY,
      batch_recipe_id INTEGER NOT NULL REFERENCES batch_recipes(id) ON DELETE CASCADE,
      ingredient_id INTEGER NOT NULL REFERENCES ingredients(id),
      quantity_per_batch REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS production_runs (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id),
      batch_recipe_id INTEGER REFERENCES batch_recipes(id),
      quantity_produced INTEGER NOT NULL,
      cost_total REAL NOT NULL DEFAULT 0,
      run_date TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS inventory_adjustments (
      id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(id),
      ingredient_id INTEGER REFERENCES ingredients(id),
      quantity_change REAL NOT NULL,
      reason TEXT NOT NULL,
      date TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      reference TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS transaction_lines (
      id SERIAL PRIMARY KEY,
      transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
      account_id INTEGER NOT NULL REFERENCES accounts(id),
      debit REAL NOT NULL DEFAULT 0,
      credit REAL NOT NULL DEFAULT 0,
      memo TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      invoice_number TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'draft',
      contact_id INTEGER REFERENCES contacts(id),
      contact_snapshot TEXT NOT NULL DEFAULT '{}',
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      tax_rate REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      paid_at TEXT,
      transaction_id INTEGER REFERENCES transactions(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS invoice_lines (
      id SERIAL PRIMARY KEY,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      description TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0,
      line_total REAL NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      vendor TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      account_id INTEGER REFERENCES accounts(id),
      transaction_id INTEGER REFERENCES transactions(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  console.log('Seeding settings and chart of accounts...')
  await sql`INSERT INTO settings (id, company_name) VALUES (1, 'OJ Sippin') ON CONFLICT (id) DO NOTHING`
  await sql.unsafe(`
    INSERT INTO accounts (code, name, type) VALUES
      ('1000', 'Cash',                       'asset'),
      ('1100', 'Accounts Receivable',        'asset'),
      ('1300', 'Inventory — Raw Materials',  'asset'),
      ('1310', 'Inventory — Finished Goods', 'asset'),
      ('2000', 'Accounts Payable',           'liability'),
      ('3000', 'Owner''s Equity',            'equity'),
      ('4000', 'Revenue — Product Sales',    'revenue'),
      ('5000', 'Cost of Goods Sold',         'expense'),
      ('6000', 'Packaging & Materials',      'expense'),
      ('6100', 'Marketing & Advertising',    'expense'),
      ('6200', 'Legal & Professional',       'expense'),
      ('6300', 'Shipping & Freight',         'expense'),
      ('6400', 'Storage & Warehousing',      'expense'),
      ('6500', 'Administrative',             'expense')
    ON CONFLICT (code) DO NOTHING
  `)

  console.log('✓ Database ready!')
  await sql.end()
}

main().catch(e => { console.error(e); process.exit(1) })
