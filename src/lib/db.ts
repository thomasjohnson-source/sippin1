import postgres from 'postgres'

declare global {
  // eslint-disable-next-line no-var
  var _pgSql: ReturnType<typeof postgres> | undefined
}

// Reuse across hot-reloads in dev
const sql = globalThis._pgSql ?? postgres(process.env.DATABASE_URL!, {
  ssl: 'require',
  max: 3,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false, // required for Neon pooler
})

if (process.env.NODE_ENV !== 'production') globalThis._pgSql = sql

export default sql
