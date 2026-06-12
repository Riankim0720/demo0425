import { createClient } from '@libsql/client'

let client = null

export function getDb() {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  }
  return client
}

export async function initDb() {
  const db = getDb()

  await db.execute(`
    CREATE TABLE IF NOT EXISTS notebooks (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS notes (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL DEFAULT '',
      content     TEXT NOT NULL DEFAULT '',
      notebook_id TEXT NOT NULL,
      tags        TEXT NOT NULL DEFAULT '[]',
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL,
      is_trashed  INTEGER NOT NULL DEFAULT 0,
      is_pinned   INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (notebook_id) REFERENCES notebooks(id)
    )
  `)

  await db.execute({
    sql: `INSERT OR IGNORE INTO notebooks (id, name, created_at) VALUES (?, ?, ?)`,
    args: ['default', '내 노트북', new Date().toISOString()],
  })

  console.log('[db] 초기화 완료')
}
