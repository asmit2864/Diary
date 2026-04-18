import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchNotes, createNote, updateNote, deleteNote } from '../utils/api';
import { decryptText } from '../utils/crypto';

export function useNotes(category, vaultKey) {
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const decryptItem = async (item, targetCategory = category) => {
    if (!vaultKey) return item;
    try {
      const dec = { ...item, category: targetCategory };
      if (targetCategory === 'Accounts') {
        dec.accountId = await decryptText(item.accountId, vaultKey);
        dec.accountPassword = await decryptText(item.accountPassword, vaultKey);
        dec.notes = await decryptText(item.notes, vaultKey);
      } else if (targetCategory === 'Documents') {
        dec.title = await decryptText(item.title, vaultKey);
        dec.body = await decryptText(item.body, vaultKey);
        if (item.documentUrl) {
          dec.documentUrl = await decryptText(item.documentUrl, vaultKey);
        }
      }
      return dec;
    } catch (e) {
      console.error("Decryption failed for item", item._id, e);
      return item;
    }
  };

  const hasPreloaded = useRef(false);
  const vaultPreloaded = useRef(false);


  const load = useCallback(async () => {
    try {
      // Only trigger hard loading if we have zero cached data for this tab
      setLoading(true);
      setError(null);
      const data = await fetchNotes(category);
      
      const decryptedData = await Promise.all(
        data.map(item => decryptItem(item))
      );
      
      setCache(prev => ({ ...prev, [category]: decryptedData }));

      // Kick off silent background preload for all other tabs
      if (!hasPreloaded.current) {
        hasPreloaded.current = true;
        const ALL_TABS = ['Notes', 'Expenses', 'Accounts', 'Documents'];
        
        ALL_TABS.forEach(cat => {
          if (cat === category) return;
          if (!vaultKey && (cat === 'Accounts' || cat === 'Documents')) return;
          
          fetchNotes(cat).then(async (catData) => {
            const decData = await Promise.all(catData.map(item => decryptItem(item, cat)));
            setCache(prev => prev[cat] ? prev : { ...prev, [cat]: decData });
          }).catch(() => {}); // silently fail background preloads
        });
      }

      // If the vault was just unlocked, kick off preloading for the other secure tab
      if (vaultKey && !vaultPreloaded.current) {
        vaultPreloaded.current = true;
        const VAULT_TABS = ['Accounts', 'Documents'];
        
        VAULT_TABS.forEach(cat => {
          if (cat === category) return;
          fetchNotes(cat).then(async (catData) => {
            const decData = await Promise.all(catData.map(item => decryptItem(item, cat)));
            setCache(prev => prev[cat] ? prev : { ...prev, [cat]: decData });
          }).catch(() => {});
        });
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, vaultKey]); 

  useEffect(() => {
    load();
  }, [load]);

  const addNote = async (data) => {
    const note = await createNote({ ...data, category });
    const dec = await decryptItem(note);
    setCache(prev => {
      const catList = prev[category] || [];
      return { ...prev, [category]: [dec, ...catList] };
    });
    return dec;
  };

  const editNote = async (id, data) => {
    const updated = await updateNote(id, data);
    const dec = await decryptItem(updated);
    setCache(prev => {
      const catList = prev[category] || [];
      return { ...prev, [category]: catList.map((n) => (n._id === id ? dec : n)) };
    });
    return dec;
  };

  const removeNote = async (id) => {
    await deleteNote(id, category);
    setCache(prev => {
      const catList = prev[category] || [];
      return { ...prev, [category]: catList.filter((n) => n._id !== id) };
    });
  };

  // The active list is the one from cache
  const activeNotes = cache[category] || [];
  
  // We only show the loading spinner if we don't have any cached data yet for this specific tab
  const isInitialLoading = loading && !cache[category];

  return { 
    notes: activeNotes, 
    loading: isInitialLoading, 
    error, 
    addNote, 
    editNote, 
    removeNote, 
    reload: load 
  };
}
