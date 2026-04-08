import { useState, useEffect, useCallback } from 'react';
import { fetchNotes, createNote, updateNote, deleteNote } from '../utils/api';
import { decryptText } from '../utils/crypto';

export function useNotes(category, vaultKey) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const decryptItem = async (item) => {
    if (!vaultKey) return item;
    try {
      const dec = { ...item, category };
      if (category === 'Accounts') {
        dec.accountPassword = await decryptText(item.accountPassword, vaultKey);
        dec.notes = await decryptText(item.notes, vaultKey);
      } else if (category === 'Documents') {
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

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchNotes(category);
      
      const decryptedData = await Promise.all(
        data.map(item => decryptItem(item))
      );
      
      setNotes(decryptedData);
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
    setNotes((prev) => [dec, ...prev]);
    return dec;
  };

  const editNote = async (id, data) => {
    const updated = await updateNote(id, data);
    const dec = await decryptItem(updated);
    setNotes((prev) => prev.map((n) => (n._id === id ? dec : n)));
    return dec;
  };

  const removeNote = async (id) => {
    await deleteNote(id, category);
    setNotes((prev) => prev.filter((n) => n._id !== id));
  };

  return { notes, loading, error, addNote, editNote, removeNote, reload: load };
}

