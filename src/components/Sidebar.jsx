import { useState } from 'react'
import {
  FileText, BookOpen, Tag, Trash2, Plus, ChevronDown, ChevronRight,
  MoreHorizontal, Pencil, X,
} from 'lucide-react'

export default function Sidebar({
  notebooks, tags, view, activeNotebookId, activeTag,
  noteCountByNotebook, noteCountByTag, trashCount,
  setView, setActiveNotebookId, setActiveTag,
  createNote, createNotebook, renameNotebook, deleteNotebook,
}) {
  const [notebooksOpen, setNotebooksOpen] = useState(true)
  const [tagsOpen, setTagsOpen] = useState(true)
  const [newNotebookMode, setNewNotebookMode] = useState(false)
  const [newNotebookName, setNewNotebookName] = useState('')
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [nbMenuId, setNbMenuId] = useState(null)

  const handleCreateNotebook = () => {
    if (newNotebookName.trim()) {
      createNotebook(newNotebookName)
    }
    setNewNotebookName('')
    setNewNotebookMode(false)
  }

  const handleRename = (id) => {
    if (renameValue.trim()) renameNotebook(id, renameValue)
    setRenamingId(null)
    setRenameValue('')
    setNbMenuId(null)
  }

  const handleNotebookClick = (id) => {
    setActiveNotebookId(id)
    setView('notebook')
    setActiveTag(null)
  }

  const handleTagClick = (tag) => {
    setActiveTag(tag)
    setView('tag')
    setActiveNotebookId(null)
  }

  return (
    <div
      className="flex flex-col h-full overflow-hidden select-none"
      style={{ width: 240, minWidth: 240, background: '#1a1a1a', color: '#d4d4d4' }}
      onClick={() => setNbMenuId(null)}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4" style={{ borderBottom: '1px solid #2d2d2d' }}>
        <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: '#00a82d' }}>
          <FileText size={16} color="white" />
        </div>
        <span className="font-semibold text-white text-[15px]">NoteSpace</span>
      </div>

      {/* New Note Button */}
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={createNote}
          className="w-full flex items-center justify-center gap-2 text-white text-[13px] font-medium py-2 px-3 rounded-md transition-colors"
          style={{ background: '#00a82d' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#009a28')}
          onMouseLeave={e => (e.currentTarget.style.background = '#00a82d')}
        >
          <Plus size={15} />
          새 노트
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-1">
        {/* All Notes */}
        <NavItem
          icon={<FileText size={14} />}
          label="모든 노트"
          active={view === 'all'}
          onClick={() => { setView('all'); setActiveNotebookId(null); setActiveTag(null) }}
        />

        {/* Notebooks */}
        <div className="mt-3">
          <div className="flex items-center justify-between px-2 mb-1">
            <button
              className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider transition-colors"
              style={{ color: '#777' }}
              onClick={() => setNotebooksOpen(v => !v)}
            >
              {notebooksOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              노트북
            </button>
            <button
              className="rounded p-0.5 transition-colors"
              style={{ color: '#666' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = '#666')}
              onClick={e => { e.stopPropagation(); setNewNotebookMode(true) }}
              title="노트북 추가"
            >
              <Plus size={13} />
            </button>
          </div>

          {notebooksOpen && (
            <div>
              {newNotebookMode && (
                <div className="px-2 pb-1">
                  <input
                    autoFocus
                    type="text"
                    value={newNotebookName}
                    onChange={e => setNewNotebookName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleCreateNotebook()
                      if (e.key === 'Escape') { setNewNotebookMode(false); setNewNotebookName('') }
                    }}
                    onBlur={handleCreateNotebook}
                    placeholder="노트북 이름..."
                    className="w-full text-[12px] px-2 py-1 rounded outline-none"
                    style={{ background: '#2d2d2d', color: '#fff', border: '1px solid #00a82d' }}
                  />
                </div>
              )}
              {notebooks.map(nb => (
                <div key={nb.id} className="relative">
                  {renamingId === nb.id ? (
                    <div className="px-2 pb-1">
                      <input
                        autoFocus
                        type="text"
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRename(nb.id)
                          if (e.key === 'Escape') { setRenamingId(null); setRenameValue('') }
                        }}
                        onBlur={() => handleRename(nb.id)}
                        className="w-full text-[12px] px-2 py-1 rounded outline-none"
                        style={{ background: '#2d2d2d', color: '#fff', border: '1px solid #00a82d' }}
                      />
                    </div>
                  ) : (
                    <NavItem
                      icon={<BookOpen size={13} />}
                      label={nb.name}
                      count={noteCountByNotebook[nb.id] ?? 0}
                      active={view === 'notebook' && activeNotebookId === nb.id}
                      onClick={() => handleNotebookClick(nb.id)}
                      indent
                      onMore={e => { e.stopPropagation(); setNbMenuId(nbMenuId === nb.id ? null : nb.id) }}
                    />
                  )}
                  {nbMenuId === nb.id && (
                    <div
                      className="absolute left-4 z-50 rounded-lg py-1 shadow-xl"
                      style={{ top: '100%', background: '#2a2a2a', border: '1px solid #3d3d3d', minWidth: 140 }}
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] transition-colors"
                        style={{ color: '#ccc' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#3d3d3d')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => { setRenamingId(nb.id); setRenameValue(nb.name); setNbMenuId(null) }}
                      >
                        <Pencil size={12} />
                        이름 변경
                      </button>
                      {notebooks.length > 1 && (
                        <button
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] transition-colors"
                          style={{ color: '#f87171' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#3d3d3d')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          onClick={() => { deleteNotebook(nb.id); setNbMenuId(null) }}
                        >
                          <X size={12} />
                          삭제
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-3">
            <button
              className="w-full flex items-center gap-1 px-2 mb-1 text-[11px] font-semibold uppercase tracking-wider transition-colors"
              style={{ color: '#777' }}
              onClick={() => setTagsOpen(v => !v)}
            >
              {tagsOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              태그
            </button>
            {tagsOpen &&
              tags.map(tag => (
                <NavItem
                  key={tag}
                  icon={<Tag size={13} />}
                  label={tag}
                  count={noteCountByTag[tag] ?? 0}
                  active={view === 'tag' && activeTag === tag}
                  onClick={() => handleTagClick(tag)}
                  indent
                />
              ))
            }
          </div>
        )}
      </nav>

      {/* Trash */}
      <div className="px-2 py-2" style={{ borderTop: '1px solid #2d2d2d' }}>
        <NavItem
          icon={<Trash2 size={14} />}
          label="휴지통"
          count={trashCount || null}
          active={view === 'trash'}
          onClick={() => { setView('trash'); setActiveNotebookId(null); setActiveTag(null) }}
        />
      </div>
    </div>
  )
}

function NavItem({ icon, label, count, active, onClick, indent, onMore }) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center gap-2 py-1.5 rounded-md text-left transition-colors group"
      style={{
        paddingLeft: active ? (indent ? 10 : 6) : (indent ? 12 : 8),
        paddingRight: 8,
        background: active ? '#2d2d2d' : hovered ? '#252525' : 'transparent',
        borderLeft: active ? '2px solid #00a82d' : '2px solid transparent',
        color: active ? '#fff' : '#c0c0c0',
      }}
    >
      <span style={{ color: active ? '#00a82d' : '#777', flexShrink: 0 }}>{icon}</span>
      <span className="flex-1 truncate text-[13px]">{label}</span>
      {count !== null && count !== undefined && (
        <span className="text-[11px]" style={{ color: '#666' }}>{count}</span>
      )}
      {onMore && (
        <span
          className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5"
          style={{ color: '#777' }}
          onClick={onMore}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#777')}
        >
          <MoreHorizontal size={12} />
        </span>
      )}
    </button>
  )
}
