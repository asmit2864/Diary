import React, { useState, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import TabBar from './components/TabBar';
import NotesGrid from './components/NotesGrid';
import FAB from './components/FAB';
import NoteEditor from './components/NoteEditor';
import AuthPage from './components/AuthPage';
import { useNotes } from './hooks/useNotes';
import { TABS } from './utils/constants';
import { createNote, updateNote, deleteNote } from './utils/api';

export default function App() {
  const { user, loading: authLoading, login, register, logout, googleLogin } = useAuth();

  const [activeTab, setActiveTab] = useState('General');
  const [editorState, setEditorState] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const selectionMode = selectedIds.size > 0;

  const { notes, loading, error, reload } = useNotes(activeTab);

  // ── Auth handlers ─────────────────────────────────────────────────────────
  const handleAuth = async (mode, email, password) => {
    if (mode === 'google') await googleLogin(email); // Here 'email' is actually the credential token
    else if (mode === 'login') await login(email, password);
    else await register(email, password);
    reload();
  };

  // ── Touch swipe ───────────────────────────────────────────────────────────
  const touchStart = useRef(null); // { x, y, t }
  const handleTouchStart = (e) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };
  const handleTouchEnd = (e) => {
    if (selectionMode || !touchStart.current) return;
    const { x: x0, y: y0, t: t0 } = touchStart.current;
    touchStart.current = null;
    const t = e.changedTouches[0];
    const dx = t.clientX - x0;
    const dy = t.clientY - y0;
    // Ignore if vertical scroll dominates
    if (Math.abs(dy) > Math.abs(dx)) return;
    const dt = Date.now() - t0 || 1;
    const velocity = Math.abs(dx) / dt; // px/ms
    const isSwipe = Math.abs(dx) > 50 || velocity > 0.3;
    if (!isSwipe) return;
    const idx = TABS.indexOf(activeTab);
    const next = dx < 0 ? Math.min(idx + 1, TABS.length - 1) : Math.max(idx - 1, 0);
    if (next !== idx) setActiveTab(TABS[next]);
  };

  // ── Note actions ──────────────────────────────────────────────────────────
  const handleNoteClick = (note, rect) => setEditorState({ note, category: activeTab, rect: rect ?? null });
  const handleNoteLongPress = (id) => setSelectedIds(new Set([id]));
  const handleNoteToggleSelect = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const handleCancelSelection = () => setSelectedIds(new Set());
  const handleDeleteSelected = async () => {
    try { await Promise.all([...selectedIds].map(deleteNote)); }
    catch (e) { console.error(e); }
    setSelectedIds(new Set());
    reload();
  };

  const handleFabSelect = async (category) => {
    setActiveTab(category);
    try {
      const newNote = await createNote({ title: '', body: '', category });
      setEditorState({ note: newNote, category, rect: null });
    } catch (e) { console.error(e); }
  };

  const handleSave = async ({ title, body }) => {
    if (!editorState?.note?._id) return;
    try {
      await updateNote(editorState.note._id, { title, body, category: editorState.category });
    } catch (e) { console.error(e); }
  };

  const handleDelete = async () => {
    if (!editorState?.note?._id) return;
    try { await deleteNote(editorState.note._id); } catch (e) { console.error(e); }
    setEditorState(null);
    reload();
  };

  const handleClose = () => { setEditorState(null); reload(); };

  // ── Render ────────────────────────────────────────────────────────────────
  if (authLoading) return <div className="auth-loading"><div className="spinner" /></div>;
  if (!user) return <AuthPage onAuth={handleAuth} />;

  return (
    <>
      <Header user={user} onLogout={logout} />
      <TabBar activeTab={activeTab} onTabChange={selectionMode ? undefined : setActiveTab} />

      <NotesGrid
        notes={notes}
        loading={loading}
        error={error}
        onNoteClick={handleNoteClick}
        onNoteLongPress={handleNoteLongPress}
        onNoteToggleSelect={handleNoteToggleSelect}
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />

      <FAB
        onCategorySelect={handleFabSelect}
        selectionMode={selectionMode}
        selectedCount={selectedIds.size}
        onDeleteSelected={handleDeleteSelected}
        onCancelSelection={handleCancelSelection}
      />

      {editorState && (
        <NoteEditor
          note={editorState.note}
          category={editorState.category}
          cardRect={editorState.rect}
          onClose={handleClose}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}
