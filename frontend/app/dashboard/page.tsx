'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { api } from '@/lib/axios';
import { socket } from '@/lib/socket';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

import debounce from 'lodash/debounce';

type Note = {
  id: string;
  title: string;
  content: string;
  summary?: string;
  isArchived?: boolean;
};

export default function DashboardPage() {
  const [notes, setNotes] = useState<Note[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState('');

  const [title, setTitle] =
    useState('');

  const [content, setContent] =
    useState('');

  const [creating, setCreating] =
    useState(false);

  const router = useRouter();

  const {
    token,
    user,
    hydrated,
    hydrate,
  } = useAuthStore();

  // -----------------------------------
  // HYDRATE AUTH
  // -----------------------------------

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // -----------------------------------
  // AUTH PROTECTION
  // -----------------------------------

  useEffect(() => {
    if (!hydrated) return;

    if (!token) {
      router.push('/login');
    }
  }, [token, hydrated, router]);

  // -----------------------------------
  // FETCH NOTES
  // -----------------------------------

  useEffect(() => {
    if (!hydrated) return;

    if (token) {
      fetchNotes();
    }
  }, [token, hydrated]);

  async function fetchNotes() {
    try {
      setLoading(true);

      setError('');

      const res = await api.get('/notes');

      setNotes(res.data);
    } catch (err) {
      console.error(err);

      setError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------------
  // REALTIME SOCKET UPDATES
  // -----------------------------------

  useEffect(() => {
    if (!user) return;

    socket.on(
      `note:${user.id}`,
      (updatedNote: Note) => {
        setNotes((prev) =>
          prev.map((n) =>
            n.id === updatedNote.id
              ? updatedNote
              : n
          )
        );
      }
    );

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    return () => {
      socket.off(`note:${user.id}`);
    };
  }, [user]);

  // -----------------------------------
  // CREATE NOTE
  // -----------------------------------

  async function createNote() {
    try {
      if (!title || !content) return;

      setCreating(true);

      const res = await api.post('/notes', {
        title,
        content,
      });

      setNotes((prev) => [
        res.data,
        ...prev,
      ]);

      setTitle('');
      setContent('');
    } catch (err) {
      console.error(err);

      setError('Failed to create note');
    } finally {
      setCreating(false);
    }
  }

  // -----------------------------------
  // DELETE NOTE
  // -----------------------------------

  async function deleteNote(id: string) {
    try {
      await api.delete(`/notes/${id}`);

      setNotes((prev) =>
        prev.filter((n) => n.id !== id)
      );
    } catch (err) {
      console.error(err);

      setError('Failed to delete note');
    }
  }

  // -----------------------------------
  // ARCHIVE NOTE
  // -----------------------------------

  async function archiveNote(id: string) {
    try {
      await api.patch(
        `/notes/${id}/archive`
      );

      setNotes((prev) =>
        prev.filter((n) => n.id !== id)
      );
    } catch (err) {
      console.error(err);

      setError('Failed to archive note');
    }
  }

  // -----------------------------------
  // SEARCH NOTES
  // -----------------------------------

  const searchNotes = useMemo(
    () =>
      debounce(async (value: string) => {
        try {
          setLoading(true);

          if (!value) {
            await fetchNotes();
            return;
          }

          const res = await api.get(
            `/notes/search?q=${value}`
          );

          setNotes(res.data);
        } catch (err) {
          console.error(err);

          setError('Search failed');
        } finally {
          setLoading(false);
        }
      }, 300),
    []
  );

  // -----------------------------------
  // CLEANUP DEBOUNCE
  // -----------------------------------

  useEffect(() => {
    return () => {
      searchNotes.cancel();
    };
  }, [searchNotes]);

  // -----------------------------------
  // LOADING / AUTH STATES
  // -----------------------------------

  if (!hydrated) {
    return null;
  }

  if (!token) {
    return null;
  }

  // -----------------------------------
  // UI
  // -----------------------------------

  return (
    <div className="p-10 max-w-5xl mx-auto">
      {/* HEADER */}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">
            Smart Notes Dashboard
          </h1>

          {user && (
            <p className="text-gray-500 mt-2">
              Logged in as {user.email}
            </p>
          )}
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="bg-red-100 text-red-600 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* CREATE NOTE */}

      <div className="border rounded-2xl p-6 mb-8 shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">
          Create Note
        </h2>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Note title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            className="border p-3 rounded-lg"
          />

          <textarea
            placeholder="Write your note..."
            value={content}
            onChange={(e) =>
              setContent(e.target.value)
            }
            className="border p-3 rounded-lg min-h-[120px]"
          />

          <button
            onClick={createNote}
            disabled={creating}
            className="bg-black text-white px-5 py-3 rounded-lg w-fit disabled:opacity-50"
          >
            {creating
              ? 'Creating...'
              : 'Create Note'}
          </button>
        </div>
      </div>

      {/* SEARCH */}

      <div className="mb-6">
        <input
          placeholder="Search notes..."
          onChange={(e) =>
            searchNotes(e.target.value)
          }
          className="border p-3 rounded-lg w-full"
        />
      </div>

      {/* LOADING */}

      {loading && (
        <p className="text-gray-500 mb-4">
          Loading...
        </p>
      )}

      {/* EMPTY */}

      {!loading && notes.length === 0 && (
        <div className="text-gray-500 border rounded-xl p-8 text-center">
          No notes found
        </div>
      )}

      {/* NOTES */}

      <div className="grid gap-5">
        {notes.map((note) => (
          <div
            key={note.id}
            className="border rounded-2xl p-5 shadow-sm"
          >
            {/* TITLE */}

            <h2 className="font-bold text-2xl mb-2">
              {note.title}
            </h2>

            {/* CONTENT */}

            <p className="text-gray-700 mb-4 whitespace-pre-wrap">
              {note.content}
            </p>

            {/* AI SUMMARY */}

            <div className="bg-gray-100 rounded-xl p-4 mb-4">
              <h3 className="font-semibold mb-2">
                AI Summary
              </h3>

              {note.summary ? (
                <p>{note.summary}</p>
              ) : (
                <p className="text-gray-400">
                  Generating AI summary...
                </p>
              )}
            </div>

            {/* ACTIONS */}

            <div className="flex gap-3">
              <button
                onClick={() =>
                  archiveNote(note.id)
                }
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
              >
                Archive
              </button>

              <button
                onClick={() =>
                  deleteNote(note.id)
                }
                className="bg-red-500 text-white px-4 py-2 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}