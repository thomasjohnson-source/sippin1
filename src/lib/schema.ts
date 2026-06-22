import { sql } from 'drizzle-orm'
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  company_name: text('company_name').notNull().default('OJ Sippin Inc.'),
  company_address: text('company_address').notNull().default(''),
  company_phone: text('company_phone').notNull().default(''),
  company_email: text('company_email').notNull().default(''),
  company_ein: text('company_ein').notNull().default(''),
  invoice_tax_rate: real('invoice_tax_rate').notNull().default(0),
  invoice_terms: text('invoice_terms').notNull().default('Net 30'),
  invoice_notes: text('invoice_notes').notNull().default('Thank you for your business!'),
  next_invoice_number: integer('next_invoice_number').notNull().default(1),
})

export const accounts = sqliteTable('accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  type: text('type', { enum: ['asset', 'liability', 'equity', 'revenue', 'expense'] }).notNull(),
  description: text('description').default(''),
})

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  description: text('description').notNull(),
  reference: text('reference').default(''),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
})

export const transaction_lines = sqliteTable('transaction_lines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  transaction_id: integer('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  account_id: integer('account_id').notNull().references(() => accounts.id),
  debit: real('debit').notNull().default(0),
  credit: real('credit').notNull().default(0),
  memo: text('memo').default(''),
})

export const contacts = sqliteTable('contacts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  company: text('company').default(''),
  email: text('email').default(''),
  phone: text('phone').default(''),
  address: text('address').default(''),
  notes: text('notes').default(''),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
})

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').default(''),
  unit: text('unit').notNull().default('can'),
  unit_cost: real('unit_cost').notNull().default(0),
  sale_price: real('sale_price').notNull().default(0),
  current_stock: real('current_stock').notNull().default(0),
  low_stock_threshold: real('low_stock_threshold').notNull().default(50),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
})

export const ingredients = sqliteTable('ingredients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  unit: text('unit').notNull().default('each'),
  cost_per_unit: real('cost_per_unit').notNull().default(0),
  current_stock: real('current_stock').notNull().default(0),
  low_stock_threshold: real('low_stock_threshold').notNull().default(100),
})

export const batch_recipes = sqliteTable('batch_recipes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  product_id: integer('product_id').notNull().references(() => products.id),
  batch_size: integer('batch_size').notNull().default(24),
  name: text('name').notNull().default('Standard Batch'),
})

export const batch_recipe_lines = sqliteTable('batch_recipe_lines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  batch_recipe_id: integer('batch_recipe_id').notNull().references(() => batch_recipes.id, { onDelete: 'cascade' }),
  ingredient_id: integer('ingredient_id').notNull().references(() => ingredients.id),
  quantity_per_batch: real('quantity_per_batch').notNull(),
})

export const production_runs = sqliteTable('production_runs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  product_id: integer('product_id').notNull().references(() => products.id),
  batch_recipe_id: integer('batch_recipe_id').references(() => batch_recipes.id),
  quantity_produced: integer('quantity_produced').notNull(),
  cost_total: real('cost_total').notNull().default(0),
  run_date: text('run_date').notNull(),
  notes: text('notes').default(''),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
})

export const inventory_adjustments = sqliteTable('inventory_adjustments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  product_id: integer('product_id').references(() => products.id),
  ingredient_id: integer('ingredient_id').references(() => ingredients.id),
  quantity_change: real('quantity_change').notNull(),
  reason: text('reason').notNull(),
  date: text('date').notNull(),
})

export const invoices = sqliteTable('invoices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoice_number: text('invoice_number').notNull().unique(),
  contact_id: integer('contact_id').references(() => contacts.id),
  contact_snapshot: text('contact_snapshot').default('{}'),
  issue_date: text('issue_date').notNull(),
  due_date: text('due_date').notNull(),
  status: text('status', { enum: ['draft', 'sent', 'paid', 'overdue'] }).notNull().default('draft'),
  notes: text('notes').default(''),
  subtotal: real('subtotal').notNull().default(0),
  tax_rate: real('tax_rate').notNull().default(0),
  tax_amount: real('tax_amount').notNull().default(0),
  total: real('total').notNull().default(0),
  paid_at: text('paid_at'),
  transaction_id: integer('transaction_id').references(() => transactions.id),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
})

export const invoice_lines = sqliteTable('invoice_lines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  invoice_id: integer('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  product_id: integer('product_id').references(() => products.id),
  description: text('description').notNull(),
  quantity: real('quantity').notNull().default(1),
  unit_price: real('unit_price').notNull().default(0),
  line_total: real('line_total').notNull().default(0),
})

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  vendor: text('vendor').notNull(),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  account_id: integer('account_id').references(() => accounts.id),
  transaction_id: integer('transaction_id').references(() => transactions.id),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
})
