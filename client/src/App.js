import React, { useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import PillNav from './components/PillNav';
import NotesGrid from './components/NotesGrid';
import DocumentsGrid from './components/DocumentsGrid';
import AccountsGrid from './components/AccountsGrid';
import FAB from './components/FAB';
import NoteEditor from './components/NoteEditor';
import DocumentEditor from './components/DocumentEditor';
import AccountEditor from './components/AccountEditor';
import AuthPage from './components/AuthPage';
import VaultLogin from './components/VaultLogin';
import { useNotes } from './hooks/useNotes';
import { TABS } from './utils/constants';
import { createNote, updateNote, deleteNote } from './utils/api';

export default function App() {
  const { user, loading: authLoading, login, register, logout, googleLogin } = useAuth();

  const [activeTab, setActiveTab] = useState('Notes');
  const [editorState, setEditorState] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const selectionMode = selectedIds.size > 0;

  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultKey, setVaultKey] = useState(null);

  const isVaultTab = activeTab === 'Accounts' || activeTab === 'Documents';
  const showVaultLogin = isVaultTab && !vaultUnlocked;

  const { notes, loading, error, reload } = useNotes(activeTab, vaultKey);

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
    try { await Promise.all([...selectedIds].map(id => deleteNote(id, activeTab))); }
    catch (e) { console.error(e); }
    setSelectedIds(new Set());
    reload();
  };

  const handleFabSelect = async (category) => {
    try {
      const newNote = await createNote({ title: '', body: '', category });
      setEditorState({ note: newNote, category, rect: null });
    } catch (e) { console.error(e); }
  };

  const handleSave = async ({ title, body, accountId, accountPassword, notes: accNotes, documentUrl }) => {
    if (!editorState?.note?._id) return;
    try {
      await updateNote(editorState.note._id, { title, body, accountId, accountPassword, notes: accNotes, documentUrl, category: editorState.category });
    } catch (e) { console.error(e); }
  };

  const handleUpdateInline = async (id, data, category) => {
    try {
      await updateNote(id, { ...data, category });
      // do not implicitly reload here constantly, it can interrupt typing if focus resets. Let AccountCard handle local state optimism.
    } catch (e) { console.error(e); }
  };

  const handleDelete = async () => {
    if (!editorState?.note?._id) return;
    try { await deleteNote(editorState.note._id, editorState.category); } catch (e) { console.error(e); }
    setEditorState(null);
    reload();
  };

  const handleClose = () => { setEditorState(null); reload(); };

  // ── Render ────────────────────────────────────────────────────────────────
  if (authLoading) return <div className="flex items-center justify-center h-[100dvh]"><Loader2 className="w-8 h-8 animate-spin text-white/70" /></div>;
  if (!user) return <AuthPage onAuth={handleAuth} />;

  return (
    <>
      <Header user={user} onLogout={logout} />
      
      <PillNav activeTab={activeTab} onTabChange={selectionMode ? undefined : setActiveTab} />

      {showVaultLogin ? (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <VaultLogin 
            user={user} 
            onUnlock={(key) => { 
              setVaultKey(key); 
              setVaultUnlocked(true); 
            }} 
          />
        </div>
      ) : (
        <>
          {activeTab === 'Notes' && (
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
          )}

          {activeTab === 'Documents' && (
            <DocumentsGrid
              documents={notes}
              loading={loading}
              error={error}
              onDocumentClick={handleNoteClick}
              onDocumentLongPress={handleNoteLongPress}
              onDocumentToggleSelect={handleNoteToggleSelect}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              vaultKey={vaultKey}
            />
          )}

          {activeTab === 'Accounts' && (
            <AccountsGrid
              accounts={notes}
              loading={loading}
              error={error}
              onAccountClick={handleNoteClick}
              onAccountLongPress={handleNoteLongPress}
              onAccountToggleSelect={handleNoteToggleSelect}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              vaultKey={vaultKey}
              onUpdateInline={(id, data) => handleUpdateInline(id, data, activeTab)}
            />
          )}

          <FAB
            onAdd={() => handleFabSelect(activeTab)}
            selectionMode={selectionMode}
            selectedCount={selectedIds.size}
            onDeleteSelected={handleDeleteSelected}
            onCancelSelection={handleCancelSelection}
          />
        </>
      )}

      {editorState && editorState.category === 'Notes' && (
        <NoteEditor
          note={editorState.note}
          category={editorState.category}
          cardRect={editorState.rect}
          onClose={handleClose}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {editorState && editorState.category === 'Documents' && (
        <DocumentEditor
          note={editorState.note}
          category={editorState.category}
          cardRect={editorState.rect}
          onClose={handleClose}
          onSave={handleSave}
          onDelete={handleDelete}
          vaultKey={vaultKey}
        />
      )}

      {editorState && editorState.category === 'Accounts' && (
        <AccountEditor
          note={editorState.note}
          category={editorState.category}
          cardRect={editorState.rect}
          onClose={handleClose}
          onSave={handleSave}
          onDelete={handleDelete}
          vaultKey={vaultKey}
        />
      )}
    </>
  );
}
