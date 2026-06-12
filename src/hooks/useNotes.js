import { useState, useEffect, useCallback } from 'react'

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
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

  // 초기 데이터 로드
  useEffect(() => {
    Promise.all([
      api('/api/notebooks'),
      api('/api/notes'),
    ])
      .then(([nbs, notes]) => {
        setNotebooks(nbs)
        setAllNotes(notes)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
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
      await api('/api/notes', { method: 'POST', body: JSON.stringify(newNote) })
    } catch (err) {
      console.error('[createNote]', err)
    }
    return newNote
  }, [view, activeNotebookId, activeTag, notebooks])

  const updateNote = useCallback(async (id, updates) => {
    const updatedAt = new Date().toISOString()
    setAllNotes(prev =>
      prev.map(note =>
        note.id === id ? { ...note, ...updates, updatedAt } : note
      )
    )
    try {
      await api(`/api/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...updates, updatedAt }),
      })
    } catch (err) {
      console.error('[updateNote]', err)
    }
  }, [])

  const trashNote = useCallback(async (id) => {
    setAllNotes(prev =>
      prev.map(note => (note.id === id ? { ...note, isTrashed: true } : note))
    )
    setActiveNoteId(prev => (prev === id ? null : prev))
    try {
      await api(`/api/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isTrashed: true }),
      })
    } catch (err) {
      console.error('[trashNote]', err)
    }
  }, [])

  const restoreNote = useCallback(async (id) => {
    setAllNotes(prev =>
      prev.map(note => (note.id === id ? { ...note, isTrashed: false } : note))
    )
    try {
      await api(`/api/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isTrashed: false }),
      })
    } catch (err) {
      console.error('[restoreNote]', err)
    }
  }, [])

  const deleteNotePermanently = useCallback(async (id) => {
    setAllNotes(prev => prev.filter(note => note.id !== id))
    setActiveNoteId(prev => (prev === id ? null : prev))
    try {
      await api(`/api/notes/${id}`, { method: 'DELETE' })
    } catch (err) {
      console.error('[deleteNote]', err)
    }
  }, [])

  const togglePin = useCallback(async (id) => {
    const note = allNotes.find(n => n.id === id)
    if (!note) return
    const isPinned = !note.isPinned
    setAllNotes(prev =>
      prev.map(n => (n.id === id ? { ...n, isPinned } : n))
    )
    try {
      await api(`/api/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isPinned }),
      })
    } catch (err) {
      console.error('[togglePin]', err)
    }
  }, [allNotes])

  // ─── Notebooks CRUD ─────────────────────────────────────────────────────────

  const createNotebook = useCallback(async (name) => {
    const newNotebook = {
      id: crypto.randomUUID(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
    }
    setNotebooks(prev => [...prev, newNotebook])
    try {
      await api('/api/notebooks', { method: 'POST', body: JSON.stringify(newNotebook) })
    } catch (err) {
      console.error('[createNotebook]', err)
    }
    return newNotebook
  }, [])

  const renameNotebook = useCallback(async (id, name) => {
    setNotebooks(prev =>
      prev.map(nb => (nb.id === id ? { ...nb, name: name.trim() } : nb))
    )
    try {
      await api(`/api/notebooks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
      })
    } catch (err) {
      console.error('[renameNotebook]', err)
    }
  }, [])

  const deleteNotebook = useCallback(
    async (id) => {
      if (notebooks.length <= 1) return
      const fallbackId = notebooks.find(nb => nb.id !== id)?.id
      setNotebooks(prev => prev.filter(nb => nb.id !== id))
      setAllNotes(prev =>
        prev.map(note =>
          note.notebookId === id ? { ...note, notebookId: fallbackId } : note
        )
      )
      if (view === 'notebook' && activeNotebookId === id) {
        setView('all')
        setActiveNotebookId(null)
      }
      try {
        await api(`/api/notebooks/${id}`, { method: 'DELETE' })
      } catch (err) {
        console.error('[deleteNotebook]', err)
      }
    },
    [notebooks, view, activeNotebookId]
  )

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
