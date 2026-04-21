import React, { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import FloatingNavbar from './components/FloatingNavbar';
import NotesGrid from './components/NotesGrid';
import DocumentsGrid from './components/DocumentsGrid';
import AccountsGrid from './components/AccountsGrid';
import ExpensesGrid from './components/ExpensesGrid';
import NoteEditor from './components/NoteEditor';
import DocumentEditor from './components/DocumentEditor';
import AccountEditor from './components/AccountEditor';
import ExpenseEditor from './components/ExpenseEditor';
import AuthPage from './components/AuthPage';
import VaultLogin from './components/VaultLogin';
import VoiceNoteModal from './components/VoiceNoteModal';
import { useNotes } from './hooks/useNotes';
import { TABS } from './utils/constants';

export default function App() {
  const { user, loading: authLoading, login, register, logout, googleLogin } = useAuth();

  const [activeTab, setActiveTab] = useState('Notes');

  // Apply per-section gradient to body via data attribute
  useEffect(() => {
    document.body.setAttribute('data-tab', activeTab);
  }, [activeTab]);


  const [editorState, setEditorState] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const selectionMode = selectedIds.size > 0;
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultKey, setVaultKey] = useState(null);

  const isVaultTab = activeTab === 'Accounts' || activeTab === 'Documents';
  const showVaultLogin = isVaultTab && !vaultUnlocked;

  const { notes, loading, error, reload, addNote, editNote, removeNote } = useNotes(activeTab, vaultKey);

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
    try { await Promise.all([...selectedIds].map(id => removeNote(id))); }
    catch (e) { console.error(e); }
    setSelectedIds(new Set());
  };

  const handleFabSelect = (category) => {
    setEditorState({ note: { _id: null, title: '', body: '' }, category, rect: null });
  };

  const handleVoiceParsed = async (parsedData) => {
    try {
      const itemsText = (parsedData.items || []).map(i => `• ${i}`).join('\n');
      
      if (parsedData.action === 'add_to_note') {
        const existing = (Array.isArray(notes) ? notes : []).find(n => 
          n.title?.toLowerCase().includes((parsedData.title || '').toLowerCase())
        );
        if (existing) {
          const appendedBody = existing.body ? `${existing.body}\n${itemsText}` : itemsText;
          await editNote(existing._id, { ...existing, body: appendedBody, category: 'Notes' });
          return;
        }
      }
      
      // Fallback or create_note
      await addNote({ title: parsedData.title || 'Voice Note', body: itemsText, category: 'Notes' });
    } catch(err) {
      console.error("Failed to save voice note:", err);
    }
  };

  const handleSave = async (payload) => {
    if (!editorState) return;
    try {
      const fullPayload = { ...payload, category: editorState.category };
      if (!editorState.note || !editorState.note._id) {
        await addNote(fullPayload);
      } else {
        await editNote(editorState.note._id, fullPayload);
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdateInline = async (id, data, category) => {
    try {
      await editNote(id, { ...data, category });
      // do not implicitly reload here constantly, it can interrupt typing if focus resets. Let AccountCard handle local state optimism.
    } catch (e) { console.error(e); }
  };

  const handleDelete = async () => {
    const id = editorState?.note?._id;
    setEditorState(null);
    if (!id) return;
    try { await removeNote(id); } catch (e) { console.error(e); }
  };

  const handleClose = () => { setEditorState(null); };

  // ── Render ────────────────────────────────────────────────────────────────
  if (authLoading) return <div className="flex-1 flex items-center justify-center h-[100dvh]"><Loader2 className="w-9 h-9 animate-spin text-white/80" /></div>;
  if (!user) return <AuthPage onAuth={handleAuth} />;

  return (
    <>
      <Header user={user} onLogout={logout} />


      {showVaultLogin ? (
        <div
          className="flex-1 min-h-0 overflow-hidden flex flex-col"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
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

          {activeTab === 'Expenses' && (
            <ExpensesGrid
              expenses={notes}
              loading={loading}
              error={error}
              onExpenseClick={handleNoteClick}
              onExpenseLongPress={handleNoteLongPress}
              onExpenseToggleSelect={handleNoteToggleSelect}
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

        </>
      )}

      {/* Floating Navbar */}
      <FloatingNavbar 
        activeTab={activeTab} 
        setActiveTab={selectionMode ? undefined : setActiveTab} 
        onAdd={handleFabSelect}
        selectionMode={selectionMode}
        selectedCount={selectedIds.size}
        onDeleteSelected={handleDeleteSelected}
        onCancelSelection={handleCancelSelection}
        vaultLocked={showVaultLogin}
        onMicClick={() => setVoiceModalOpen(true)}
      />

      <VoiceNoteModal 
        isOpen={voiceModalOpen} 
        onClose={() => setVoiceModalOpen(false)} 
        onParsed={handleVoiceParsed} 
      />

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

      {editorState && editorState.category === 'Expenses' && (
        <ExpenseEditor
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
