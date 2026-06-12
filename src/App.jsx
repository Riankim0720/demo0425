import Sidebar from './components/Sidebar'
import NoteList from './components/NoteList'
import NoteEditor from './components/NoteEditor'
import { useNotes } from './hooks/useNotes'

export default function App() {
  const {
    notes, notebooks, tags,
    activeNote, activeNoteId, activeNotebookId, activeTag,
    view, searchQuery, sortBy,
    noteCountByNotebook, noteCountByTag, trashCount,
    setActiveNoteId, setActiveNotebookId, setActiveTag,
    setView, setSearchQuery, setSortBy,
    createNote, updateNote, trashNote, restoreNote,
    deleteNotePermanently, togglePin,
    createNotebook, renameNotebook, deleteNotebook,
  } = useNotes()

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
