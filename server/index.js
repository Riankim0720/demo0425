import 'dotenv/config'
import express from 'express'
import { join } from 'path'
import { initDb, getDb } from './db.js'

// process.cwd() = 프로젝트 루트 (어디서 실행해도 안전)
const DIST = join(process.cwd(), 'dist')

const app = express()
app.use(express.json({ limit: '10mb' }))

// ─── Notebooks ────────────────────────────────────────────────────────────────

app.get('/api/notebooks', async (req, res) => {
  try {
    const result = await getDb().execute('SELECT * FROM notebooks ORDER BY created_at ASC')
    res.json(result.rows.map(toNotebook))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/notebooks', async (req, res) => {
  try {
    const { id, name, createdAt } = req.body
    await getDb().execute({
      sql: 'INSERT INTO notebooks (id, name, created_at) VALUES (?, ?, ?)',
      args: [id, name, createdAt],
    })
    res.json({ id, name, createdAt })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/notebooks/:id', async (req, res) => {
  try {
    const { name } = req.body
    await getDb().execute({
      sql: 'UPDATE notebooks SET name = ? WHERE id = ?',
      args: [name, req.params.id],
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/notebooks/:id', async (req, res) => {
  try {
    await getDb().execute({
      sql: 'DELETE FROM notebooks WHERE id = ?',
      args: [req.params.id],
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Notes ─────────────────────────────────────────────────────────────────────

app.get('/api/notes', async (req, res) => {
  try {
    const result = await getDb().execute('SELECT * FROM notes ORDER BY updated_at DESC')
    res.json(result.rows.map(toNote))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/notes', async (req, res) => {
  try {
    const { id, title, content, notebookId, tags, createdAt, updatedAt, isTrashed, isPinned } = req.body
    await getDb().execute({
      sql: `INSERT INTO notes (id, title, content, notebook_id, tags, created_at, updated_at, is_trashed, is_pinned)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, title, content || '', notebookId,
        JSON.stringify(tags || []),
        createdAt, updatedAt,
        isTrashed ? 1 : 0,
        isPinned ? 1 : 0,
      ],
    })
    res.json(req.body)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/notes/:id', async (req, res) => {
  try {
    const updates = req.body
    const fields = []
    const args = []

    if (updates.title !== undefined)      { fields.push('title = ?');       args.push(updates.title) }
    if (updates.content !== undefined)    { fields.push('content = ?');     args.push(updates.content) }
    if (updates.notebookId !== undefined) { fields.push('notebook_id = ?'); args.push(updates.notebookId) }
    if (updates.tags !== undefined)       { fields.push('tags = ?');        args.push(JSON.stringify(updates.tags)) }
    if (updates.isTrashed !== undefined)  { fields.push('is_trashed = ?');  args.push(updates.isTrashed ? 1 : 0) }
    if (updates.isPinned !== undefined)   { fields.push('is_pinned = ?');   args.push(updates.isPinned ? 1 : 0) }

    fields.push('updated_at = ?')
    args.push(updates.updatedAt || new Date().toISOString())
    args.push(req.params.id)

    await getDb().execute({
      sql: `UPDATE notes SET ${fields.join(', ')} WHERE id = ?`,
      args,
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/notes/:id', async (req, res) => {
  try {
    await getDb().execute({
      sql: 'DELETE FROM notes WHERE id = ?',
      args: [req.params.id],
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── Static + SPA fallback ─────────────────────────────────────────────────────
// API 라우트 뒤에 등록, /api 경로는 절대 HTML 반환 안 함

app.use(express.static(DIST))

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  res.sendFile(join(DIST, 'index.html'))
})

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toNotebook(row) {
  return { id: row.id, name: row.name, createdAt: row.created_at }
}

function toNote(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    notebookId: row.notebook_id,
    tags: JSON.parse(row.tags || '[]'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isTrashed: row.is_trashed === 1,
    isPinned: row.is_pinned === 1,
  }
}

// ─── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001

async function main() {
  try {
    await initDb()
    app.listen(PORT, () => {
      console.log(`[server] port=${PORT} dist=${DIST}`)
    })
  } catch (err) {
    console.error('[server] 시작 실패:', err)
    process.exit(1)
  }
}

main()
