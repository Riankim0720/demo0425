import { useState, useEffect, useCallback } from 'react'
import { db, initDb } from '../db.js'

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

export function useNotes() {
  const [notebooks, setNotebooks] = useState([])
  const [allNotes, setAllNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [activeNoteId, setActiveNoteId] = useState(null)
  const [activeNotebookId, setActiveNotebookId] = useState(null)
  const [activeTag, setActiveTag] = useState(null)
  const [view, setView] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('updated')

  useEffect(() => {
    async function load() {
      try {
        await initDb()
        const [nbRes, noteRes] = await Promise.all([
          db.execute('SELECT * FROM notebooks ORDER BY created_at ASC'),
          db.execute('SELECT * FROM notes ORDER BY updated_at DESC'),
        ])
        setNotebooks(nbRes.rows.map(toNotebook))
        setAllNotes(noteRes.rows.map(toNote))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ─── 필터링 & 정렬 ──────────────────────────────────────────────────────────

  const stripHtml = (html) => {
    try {
      const div = document.createElement('div')
      div.innerHTML = html
      return div.textContent || ''
    } catch { return '' }
  }

  const filteredNotes = allNotes
    .filter(note => {
      if (view === 'trash') return note.isTrashed
      if (note.isTrashed) return false
      if (view === 'notebook' && note.notebookId !== activeNotebookId) return false
      if (view === 'tag' && !(note.tags || []).includes(activeTag)) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          note.title.toLowerCase().includes(q) ||
          stripHtml(note.content).toLowerCase().includes(q)
        )
      }
      return true
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'ko')
      if (sortBy === 'created') return new Date(b.createdAt) - new Date(a.createdAt)
      return new Date(b.updatedAt) - new Date(a.updatedAt)
    })

  const activeNote = allNotes.find(n => n.id === activeNoteId) || null
  const tags = [...new Set(allNotes.filter(n => !n.isTrashed).flatMap(n => n.tags || []))]

  const noteCountByNotebook = notebooks.reduce((acc, nb) => {
    acc[nb.id] = allNotes.filter(n => n.notebookId === nb.id && !n.isTrashed).length
    return acc
  }, {})
  const noteCountByTag = tags.reduce((acc, tag) => {
    acc[tag] = allNotes.filter(n => (n.tags || []).includes(tag) && !n.isTrashed).length
    return acc
  }, {})
  const trashCount = allNotes.filter(n => n.isTrashed).length

  // ─── Notes CRUD ─────────────────────────────────────────────────────────────

  const createNote = useCallback(async () => {
    const notebookId =
      view === 'notebook' ? activeNotebookId : (notebooks[0]?.id || 'default')
    const noteTags = view === 'tag' && activeTag ? [activeTag] : []
    const now = new Date().toISOString()
    const newNote = {
      id: crypto.randomUUID(),
      title: '제목 없음',
      content: '',
      notebookId,
      tags: noteTags,
      createdAt: now,
      updatedAt: now,
      isTrashed: false,
      isPinned: false,
    }
    setAllNotes(prev => [newNote, ...prev])
    setActiveNoteId(newNote.id)
    try {
      await db.execute({
        sql: `INSERT INTO notes (id, title, content, notebook_id, tags, created_at, updated_at, is_trashed, is_pinned)
              VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)`,
        args: [newNote.id, newNote.title, '', notebookId, JSON.stringify(noteTags), now, now],
      })
    } catch (err) { console.error('[createNote]', err) }
    return newNote
  }, [view, activeNotebookId, activeTag, notebooks])

  const updateNote = useCallback(async (id, updates) => {
    const updatedAt = new Date().toISOString()
    setAllNotes(prev =>
      prev.map(note => note.id === id ? { ...note, ...updates, updatedAt } : note)
    )
    try {
      const fields = []
      const args = []
      if (updates.title !== undefined)      { fields.push('title = ?');       args.push(updates.title) }
      if (updates.content !== undefined)    { fields.push('content = ?');     args.push(updates.content) }
      if (updates.notebookId !== undefined) { fields.push('notebook_id = ?'); args.push(updates.notebookId) }
      if (updates.tags !== undefined)       { fields.push('tags = ?');        args.push(JSON.stringify(updates.tags)) }
      if (updates.isTrashed !== undefined)  { fields.push('is_trashed = ?');  args.push(updates.isTrashed ? 1 : 0) }
      if (updates.isPinned !== undefined)   { fields.push('is_pinned = ?');   args.push(updates.isPinned ? 1 : 0) }
      fields.push('updated_at = ?')
      args.push(updatedAt)
      args.push(id)
      await db.execute({ sql: `UPDATE notes SET ${fields.join(', ')} WHERE id = ?`, args })
    } catch (err) { console.error('[updateNote]', err) }
  }, [])

  const trashNote = useCallback(async (id) => {
    setAllNotes(prev => prev.map(n => n.id === id ? { ...n, isTrashed: true } : n))
    setActiveNoteId(prev => prev === id ? null : prev)
    try {
      await db.execute({ sql: `UPDATE notes SET is_trashed = 1 WHERE id = ?`, args: [id] })
    } catch (err) { console.error('[trashNote]', err) }
  }, [])

  const restoreNote = useCallback(async (id) => {
    setAllNotes(prev => prev.map(n => n.id === id ? { ...n, isTrashed: false } : n))
    try {
      await db.execute({ sql: `UPDATE notes SET is_trashed = 0 WHERE id = ?`, args: [id] })
    } catch (err) { console.error('[restoreNote]', err) }
  }, [])

  const deleteNotePermanently = useCallback(async (id) => {
    setAllNotes(prev => prev.filter(n => n.id !== id))
    setActiveNoteId(prev => prev === id ? null : prev)
    try {
      await db.execute({ sql: `DELETE FROM notes WHERE id = ?`, args: [id] })
    } catch (err) { console.error('[deleteNote]', err) }
  }, [])

  const togglePin = useCallback(async (id) => {
    const note = allNotes.find(n => n.id === id)
    if (!note) return
    const isPinned = !note.isPinned
    setAllNotes(prev => prev.map(n => n.id === id ? { ...n, isPinned } : n))
    try {
      await db.execute({ sql: `UPDATE notes SET is_pinned = ? WHERE id = ?`, args: [isPinned ? 1 : 0, id] })
    } catch (err) { console.error('[togglePin]', err) }
  }, [allNotes])

  // ─── Notebooks CRUD ─────────────────────────────────────────────────────────

  const createNotebook = useCallback(async (name) => {
    const nb = { id: crypto.randomUUID(), name: name.trim(), createdAt: new Date().toISOString() }
    setNotebooks(prev => [...prev, nb])
    try {
      await db.execute({ sql: `INSERT INTO notebooks (id, name, created_at) VALUES (?, ?, ?)`, args: [nb.id, nb.name, nb.createdAt] })
    } catch (err) { console.error('[createNotebook]', err) }
    return nb
  }, [])

  const renameNotebook = useCallback(async (id, name) => {
    setNotebooks(prev => prev.map(nb => nb.id === id ? { ...nb, name: name.trim() } : nb))
    try {
      await db.execute({ sql: `UPDATE notebooks SET name = ? WHERE id = ?`, args: [name.trim(), id] })
    } catch (err) { console.error('[renameNotebook]', err) }
  }, [])

  const deleteNotebook = useCallback(async (id) => {
    if (notebooks.length <= 1) return
    const fallbackId = notebooks.find(nb => nb.id !== id)?.id
    setNotebooks(prev => prev.filter(nb => nb.id !== id))
    setAllNotes(prev => prev.map(n => n.notebookId === id ? { ...n, notebookId: fallbackId } : n))
    if (view === 'notebook' && activeNotebookId === id) { setView('all'); setActiveNotebookId(null) }
    try {
      await db.execute({ sql: `DELETE FROM notebooks WHERE id = ?`, args: [id] })
    } catch (err) { console.error('[deleteNotebook]', err) }
  }, [notebooks, view, activeNotebookId])

  return {
    notes: filteredNotes,
    notebooks,
    tags,
    loading,
    error,
    activeNote,
    activeNoteId,
    activeNotebookId,
    activeTag,
    view,
    searchQuery,
    sortBy,
    noteCountByNotebook,
    noteCountByTag,
    trashCount,
    setActiveNoteId,
    setActiveNotebookId,
    setActiveTag,
    setView,
    setSearchQuery,
    setSortBy,
    createNote,
    updateNote,
    trashNote,
    restoreNote,
    deleteNotePermanently,
    togglePin,
    createNotebook,
    renameNotebook,
    deleteNotebook,
  }
}
