import { useEffect, useState, useRef, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import EditorToolbar from './EditorToolbar'
import { Tag, BookOpen, X, Plus, Calendar, Trash2, Clock } from 'lucide-react'

function formatFullDate(dateStr) {
  return new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function NoteEditor({ activeNote, updateNote, notebooks, trashNote }) {
  const [title, setTitle] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [showTagInput, setShowTagInput] = useState(false)
  const [saveStatus, setSaveStatus] = useState('saved')

  const activeNoteRef = useRef(activeNote)
  const isLoadingRef = useRef(false)
  const saveTimerRef = useRef(null)
  const titleTimerRef = useRef(null)
  const titleInputRef = useRef(null)

  useEffect(() => {
    activeNoteRef.current = activeNote
  }, [activeNote])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: '내용을 입력하세요...' }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      if (isLoadingRef.current) return
      setSaveStatus('saving')
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        const note = activeNoteRef.current
        if (note) {
          updateNote(note.id, { content: editor.getHTML() })
          setSaveStatus('saved')
        }
      }, 600)
    },
    editorProps: {
      attributes: { class: 'outline-none min-h-96' },
    },
  })

  // Load content when switching notes
  useEffect(() => {
    if (!editor) return
    if (activeNote) {
      isLoadingRef.current = true
      setTitle(activeNote.title || '')
      editor.commands.setContent(activeNote.content || '')
      setSaveStatus('saved')
      setTimeout(() => { isLoadingRef.current = false }, 50)
    } else {
      setTitle('')
      editor.commands.setContent('')
    }
  }, [activeNote?.id, editor])

  const handleTitleChange = (e) => {
    setTitle(e.target.value)
    setSaveStatus('saving')
    clearTimeout(titleTimerRef.current)
    titleTimerRef.current = setTimeout(() => {
      if (activeNoteRef.current) {
        updateNote(activeNoteRef.current.id, { title: e.target.value })
        setSaveStatus('saved')
      }
    }, 400)
  }

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      editor?.commands.focus()
    }
  }

  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim()
    if (tag && activeNote && !(activeNote.tags || []).includes(tag)) {
      updateNote(activeNote.id, { tags: [...(activeNote.tags || []), tag] })
    }
    setTagInput('')
    setShowTagInput(false)
  }, [tagInput, activeNote, updateNote])

  const handleRemoveTag = (tag) => {
    if (activeNote) {
      updateNote(activeNote.id, { tags: (activeNote.tags || []).filter(t => t !== tag) })
    }
  }

  if (!activeNote) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8" style={{ background: '#fff' }}>
        <div className="mb-4" style={{ color: '#e0e0e0' }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <p className="text-[15px] font-medium" style={{ color: '#bbb' }}>노트를 선택하세요</p>
        <p className="text-[13px] mt-1" style={{ color: '#d0d0d0' }}>왼쪽에서 노트를 선택하거나 새 노트를 만들어보세요</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: '#fff' }}>
      {/* Meta bar */}
      <div
        className="flex items-center justify-between gap-3 px-6 py-2"
        style={{ borderBottom: '1px solid #f0f0ee', background: '#fafafa' }}
      >
        <div className="flex items-center gap-3">
          {/* Notebook selector */}
          <div className="flex items-center gap-1.5">
            <BookOpen size={13} color="#bbb" />
            <select
              value={activeNote.notebookId || ''}
              onChange={e => updateNote(activeNote.id, { notebookId: e.target.value })}
              className="text-[12px] bg-transparent border-none outline-none cursor-pointer"
              style={{ color: '#888' }}
            >
              {notebooks.map(nb => (
                <option key={nb.id} value={nb.id}>{nb.name}</option>
              ))}
            </select>
          </div>

          <span style={{ color: '#e0e0e0', fontSize: 12 }}>•</span>

          {/* Updated date */}
          <div className="flex items-center gap-1">
            <Clock size={12} color="#bbb" />
            <span className="text-[12px]" style={{ color: '#aaa' }}>
              {formatFullDate(activeNote.updatedAt)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Save status */}
          <span className="text-[11px]" style={{ color: saveStatus === 'saving' ? '#f59e0b' : '#bbb' }}>
            {saveStatus === 'saving' ? '저장 중...' : '저장됨'}
          </span>

          {/* Delete button */}
          <button
            onClick={() => trashNote(activeNote.id)}
            className="flex items-center gap-1 text-[12px] px-2 py-1 rounded transition-colors"
            style={{ color: '#bbb' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#bbb'; e.currentTarget.style.background = 'transparent' }}
            title="휴지통으로 이동"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="px-6 pt-6 pb-1">
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={handleTitleChange}
          onKeyDown={handleTitleKeyDown}
          placeholder="제목"
          className="w-full text-[28px] font-bold bg-transparent outline-none"
          style={{ color: '#1a1a1a' }}
        />
      </div>

      {/* Tags */}
      <div className="px-6 pb-2 flex items-center flex-wrap gap-1.5 min-h-[32px]">
        <Tag size={12} color="#ccc" />
        {(activeNote.tags || []).map(tag => (
          <span
            key={tag}
            className="flex items-center gap-1 text-[12px] px-2 py-0.5 rounded-full"
            style={{ background: '#f0f9f3', color: '#00a82d', border: '1px solid #c8ecd3' }}
          >
            {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              style={{ color: '#00a82d', lineHeight: 1 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#007a1f')}
              onMouseLeave={e => (e.currentTarget.style.color = '#00a82d')}
            >
              <X size={10} />
            </button>
          </span>
        ))}
        {showTagInput ? (
          <input
            autoFocus
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAddTag()
              if (e.key === 'Escape') { setShowTagInput(false); setTagInput('') }
            }}
            onBlur={handleAddTag}
            placeholder="태그 입력..."
            className="text-[12px] outline-none rounded-full px-2 py-0.5"
            style={{
              width: 100,
              background: '#f0f9f3',
              border: '1px solid #c8ecd3',
              color: '#333',
            }}
          />
        ) : (
          <button
            onClick={() => setShowTagInput(true)}
            className="flex items-center gap-0.5 text-[12px] transition-colors"
            style={{ color: '#ccc' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#00a82d')}
            onMouseLeave={e => (e.currentTarget.style.color = '#ccc')}
          >
            <Plus size={12} />
            태그 추가
          </button>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: '#f0f0ee', marginBottom: 0 }} />

      {/* Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
