import { useState, useRef, useEffect } from 'react'
import { Search, X, Pin, Trash2, RotateCcw, FileText } from 'lucide-react'

function formatDate(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function stripHtml(html) {
  try {
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent || ''
  } catch {
    return ''
  }
}

export default function NoteList({
  notes, activeNoteId, view, sortBy, searchQuery,
  setSearchQuery, setSortBy, setActiveNoteId,
  trashNote, restoreNote, deleteNotePermanently, togglePin,
  notebooks,
}) {
  const [contextMenu, setContextMenu] = useState(null)

  useEffect(() => {
    const hide = () => setContextMenu(null)
    document.addEventListener('click', hide)
    return () => document.removeEventListener('click', hide)
  }, [])

  const getNotebookName = (id) => notebooks.find(nb => nb.id === id)?.name || ''

  const handleContextMenu = (e, note) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, note })
  }

  const viewTitle =
    view === 'trash' ? '휴지통' :
    view === 'notebook' ? '' :
    view === 'tag' ? '' :
    '모든 노트'

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ width: 300, minWidth: 300, background: '#f4f4f2', borderRight: '1px solid #e0e0dc' }}
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-2" style={{ borderBottom: '1px solid #e0e0dc' }}>
        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-md"
          style={{ background: '#fff', border: '1px solid #e0e0dc', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
        >
          <Search size={14} color="#999" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="노트 검색..."
            className="flex-1 text-[13px] bg-transparent outline-none"
            style={{ color: '#333' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}>
              <X size={13} color="#bbb" />
            </button>
          )}
        </div>

        {/* Count + Sort */}
        <div className="flex items-center justify-between mt-2 px-0.5">
          <span className="text-[11px]" style={{ color: '#999' }}>
            {notes.length}개의 노트
            {searchQuery && <span> · &ldquo;{searchQuery}&rdquo;</span>}
          </span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="text-[11px] bg-transparent border-none outline-none cursor-pointer"
            style={{ color: '#888' }}
          >
            <option value="updated">최근 수정순</option>
            <option value="created">최근 생성순</option>
            <option value="title">제목순</option>
          </select>
        </div>
      </div>

      {/* Note list */}
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-2">
            <FileText size={32} color="#d0d0d0" />
            <p className="text-[13px]" style={{ color: '#aaa' }}>
              {searchQuery
                ? `"${searchQuery}"에 대한 노트가 없습니다`
                : view === 'trash'
                ? '휴지통이 비어있습니다'
                : '노트가 없습니다'}
            </p>
          </div>
        ) : (
          notes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              active={note.id === activeNoteId}
              view={view}
              notebookName={getNotebookName(note.notebookId)}
              onClick={() => setActiveNoteId(note.id)}
              onContextMenu={e => handleContextMenu(e, note)}
            />
          ))
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 9999,
            background: '#fff',
            border: '1px solid #e5e5e5',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            minWidth: 160,
            padding: '4px 0',
          }}
          onClick={e => e.stopPropagation()}
        >
          {view !== 'trash' ? (
            <>
              <CtxItem
                icon={<Pin size={13} />}
                label={contextMenu.note.isPinned ? '핀 해제' : '핀으로 고정'}
                onClick={() => { togglePin(contextMenu.note.id); setContextMenu(null) }}
              />
              <CtxItem
                icon={<Trash2 size={13} />}
                label="휴지통으로 이동"
                danger
                onClick={() => { trashNote(contextMenu.note.id); setContextMenu(null) }}
              />
            </>
          ) : (
            <>
              <CtxItem
                icon={<RotateCcw size={13} />}
                label="복원"
                onClick={() => { restoreNote(contextMenu.note.id); setContextMenu(null) }}
              />
              <CtxItem
                icon={<Trash2 size={13} />}
                label="영구 삭제"
                danger
                onClick={() => { deleteNotePermanently(contextMenu.note.id); setContextMenu(null) }}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}

function NoteCard({ note, active, view, notebookName, onClick, onContextMenu }) {
  const preview = stripHtml(note.content).trim().slice(0, 110)

  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className="px-3 py-3 cursor-pointer transition-colors"
      style={{
        borderBottom: '1px solid #e8e8e4',
        borderLeft: active ? '2px solid #00a82d' : '2px solid transparent',
        paddingLeft: active ? 10 : 12,
        background: active ? '#fff' : undefined,
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#ebebea' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = '' }}
    >
      {/* Title */}
      <div className="flex items-center gap-1.5 mb-0.5">
        {note.isPinned && <Pin size={10} color="#00a82d" style={{ flexShrink: 0 }} />}
        <h3
          className="text-[13px] font-semibold truncate"
          style={{ color: active ? '#1a1a1a' : '#2d2d2d' }}
        >
          {note.title || '제목 없음'}
        </h3>
      </div>

      {/* Preview */}
      {preview && (
        <p
          className="text-[12px] leading-relaxed"
          style={{
            color: '#999',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {preview}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[11px]" style={{ color: '#bbb' }}>
          {formatDate(note.updatedAt)}
        </span>
        <div className="flex items-center gap-1">
          {(note.tags || []).slice(0, 2).map(tag => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ background: '#e8f5ec', color: '#00a82d' }}
            >
              {tag}
            </span>
          ))}
          {(note.tags || []).length > 2 && (
            <span className="text-[10px]" style={{ color: '#bbb' }}>
              +{note.tags.length - 2}
            </span>
          )}
        </div>
      </div>

      {view === 'all' && notebookName && (
        <div className="mt-0.5">
          <span className="text-[10px]" style={{ color: '#ccc' }}>{notebookName}</span>
        </div>
      )}
    </div>
  )
}

function CtxItem({ icon, label, danger, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center gap-2 px-3 py-2 text-[13px] transition-colors text-left"
      style={{
        color: danger ? '#ef4444' : '#333',
        background: hovered ? (danger ? '#fef2f2' : '#f5f5f3') : 'transparent',
      }}
    >
      {icon}
      {label}
    </button>
  )
}
