import Sidebar from './components/Sidebar'
import NoteList from './components/NoteList'
import NoteEditor from './components/NoteEditor'
import { useNotes } from './hooks/useNotes'

export default function App() {
  const {
    notes, notebooks, tags,
    loading, error,
    activeNote, activeNoteId, activeNotebookId, activeTag,
    view, searchQuery, sortBy,
    noteCountByNotebook, noteCountByTag, trashCount,
    setActiveNoteId, setActiveNotebookId, setActiveTag,
    setView, setSearchQuery, setSortBy,
    createNote, updateNote, trashNote, restoreNote,
    deleteNotePermanently, togglePin,
    createNotebook, renameNotebook, deleteNotebook,
  } = useNotes()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-3" style={{ background: '#1a1a1a' }}>
        <div className="w-8 h-8 border-2 border-[#00a82d] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#888] text-sm">데이터를 불러오는 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-3" style={{ background: '#1a1a1a' }}>
        <p className="text-red-400 font-medium">DB 연결 오류</p>
        <p className="text-[#666] text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Sidebar
        notebooks={notebooks}
        tags={tags}
        view={view}
        activeNotebookId={activeNotebookId}
        activeTag={activeTag}
        noteCountByNotebook={noteCountByNotebook}
        noteCountByTag={noteCountByTag}
        trashCount={trashCount}
        setView={setView}
        setActiveNotebookId={setActiveNotebookId}
        setActiveTag={setActiveTag}
        createNote={createNote}
        createNotebook={createNotebook}
        renameNotebook={renameNotebook}
        deleteNotebook={deleteNotebook}
      />
      <NoteList
        notes={notes}
        activeNoteId={activeNoteId}
        view={view}
        sortBy={sortBy}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSortBy={setSortBy}
        setActiveNoteId={setActiveNoteId}
        trashNote={trashNote}
        restoreNote={restoreNote}
        deleteNotePermanently={deleteNotePermanently}
        togglePin={togglePin}
        notebooks={notebooks}
      />
      <NoteEditor
        activeNote={activeNote}
        updateNote={updateNote}
        notebooks={notebooks}
        trashNote={trashNote}
      />
    </div>
  )
}
