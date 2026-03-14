import { useState, useEffect, useCallback } from 'react';
import { fetchNotes, createNote, updateNote, deleteNote } from '../utils/api';

export function useNotes(category) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchNotes(category);
      setNotes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  const addNote = async (data) => {
    const note = await createNote({ ...data, category });
    setNotes((prev) => [note, ...prev]);
    return note;
  };

  const editNote = async (id, data) => {
    const updated = await updateNote(id, data);
    setNotes((prev) => prev.map((n) => (n._id === id ? updated : n)));
    return updated;
  };

  const removeNote = async (id) => {
    await deleteNote(id);
    setNotes((prev) => prev.filter((n) => n._id !== id));
  };

  return { notes, loading, error, addNote, editNote, removeNote, reload: load };
}
