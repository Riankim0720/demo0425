import { useState, useEffect, useCallback } from 'react'

const WELCOME_CONTENT = `<h2>NoteSpace에 오신 것을 환영합니다</h2><p>에버노트에서 영감을 받은 메모 앱입니다. 아래 기능들을 사용해보세요.</p><h3>주요 기능</h3><ul><li><strong>서식 있는 텍스트</strong> — 굵게, 기울임, 밑줄, 형광펜</li><li><strong>다양한 목록</strong> — 글머리 기호, 번호, 체크리스트</li><li><strong>노트북</strong> — 주제별로 메모를 분류하세요</li><li><strong>태그</strong> — 키워드로 빠르게 찾으세요</li><li><strong>자동 저장</strong> — 입력하는 즉시 저장됩니다</li></ul><blockquote>왼쪽 상단의 새 노트 버튼을 눌러 시작해보세요!</blockquote>`

const DEFAULT_NOTEBOOKS = [
  { id: 'default', name: '내 노트북', createdAt: new Date().toISOString() }
]

export function useNotes() {
  const [notebooks, setNotebooks] = useState(() => {
    try {
      const saved = localStorage.getItem('ns_notebooks')
      return saved ? JSON.parse(saved) : DEFAULT_NOTEBOOKS
    } catch {
      return DEFAULT_NOTEBOOKS
    }
  })

  const [allNotes, setAllNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('ns_notes')
      if (saved) return JSON.parse(saved)
      return [{
        id: crypto.randomUUID(),
        title: 'NoteSpace에 오신 것을 환영합니다',
        content: WELCOME_CONTENT,
        notebookId: 'default',
        tags: ['시작하기'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isTrashed: false,
        isPinned: false,
      }]
    } catch {
      return []
    }
  })

  const [activeNoteId, setActiveNoteId] = useState(null)
  const [activeNotebookId, setActiveNotebookId] = useState(null)
  const [activeTag, setActiveTag] = useState(null)
  const [view, setView] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('updated')

  useEffect(() => {
    localStorage.setItem('ns_notebooks', JSON.stringify(notebooks))
  }, [notebooks])

  useEffect(() => {
    localStorage.setItem('ns_notes', JSON.stringify(allNotes))
  }, [allNotes])

  const stripHtml = (html) => {
    try {
      const div = document.createElement('div')
      div.innerHTML = html
      return div.textContent || ''
    } catch {
      return ''
    }
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

  const createNote = useCallback(() => {
    const notebookId =
      view === 'notebook' ? activeNotebookId : (notebooks[0]?.id || 'default')
    const noteTags = view === 'tag' && activeTag ? [activeTag] : []
    const newNote = {
      id: crypto.randomUUID(),
      title: '제목 없음',
      content: '',
      notebookId,
      tags: noteTags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isTrashed: false,
      isPinned: false,
    }
    setAllNotes(prev => [newNote, ...prev])
    setActiveNoteId(newNote.id)
    return newNote
  }, [view, activeNotebookId, activeTag, notebooks])

  const updateNote = useCallback((id, updates) => {
    setAllNotes(prev =>
      prev.map(note =>
        note.id === id
          ? { ...note, ...updates, updatedAt: new Date().toISOString() }
          : note
      )
    )
  }, [])

  const trashNote = useCallback((id) => {
    setAllNotes(prev =>
      prev.map(note => (note.id === id ? { ...note, isTrashed: true } : note))
    )
    setActiveNoteId(prev => (prev === id ? null : prev))
  }, [])

  const restoreNote = useCallback((id) => {
    setAllNotes(prev =>
      prev.map(note => (note.id === id ? { ...note, isTrashed: false } : note))
    )
  }, [])

  const deleteNotePermanently = useCallback((id) => {
    setAllNotes(prev => prev.filter(note => note.id !== id))
    setActiveNoteId(prev => (prev === id ? null : prev))
  }, [])

  const togglePin = useCallback((id) => {
    setAllNotes(prev =>
      prev.map(note =>
        note.id === id ? { ...note, isPinned: !note.isPinned } : note
      )
    )
  }, [])

  const createNotebook = useCallback((name) => {
    const newNotebook = {
      id: crypto.randomUUID(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
    }
    setNotebooks(prev => [...prev, newNotebook])
    return newNotebook
  }, [])

  const renameNotebook = useCallback((id, name) => {
    setNotebooks(prev =>
      prev.map(nb => (nb.id === id ? { ...nb, name: name.trim() } : nb))
    )
  }, [])

  const deleteNotebook = useCallback(
    (id) => {
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
    },
    [notebooks, view, activeNotebookId]
  )

  return {
    notes: filteredNotes,
    notebooks,
    tags,
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
