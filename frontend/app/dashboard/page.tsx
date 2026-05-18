'use client';
import RichTextEditor
  from '@/components/RichTextEditor';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import ReactMarkdown
  from 'react-markdown';
import DOMPurify
  from 'isomorphic-dompurify';
import { io } from 'socket.io-client';
import { api } from '@/lib/axios';
import { socket } from '@/lib/socket';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

import debounce from 'lodash/debounce';
import {
  createNoteSchema,
} from '@/lib/validators';
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
  const [socketConnected,
          setSocketConnected] =
          useState(false);
  const {
    token,
    user,
    hydrated,
    hydrate,
  } = useAuthStore();
  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [editTitle, setEditTitle] =
    useState('');

  const [editContent, setEditContent] =
    useState('');
    const [chatMessage, setChatMessage] =
  useState('');

const [chatLoading, setChatLoading] =
  useState(false);

const [chatResponse, setChatResponse] =
  useState('');

const [chatSources, setChatSources] =
  useState<any[]>([]);
  type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
    };
  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

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
  useEffect(() => {
  if (!hydrated) return;

  if (!token || !user?.id) return;

  socket.connect();

  const handleConnect = () => {
    console.log('Socket connected');
    setSocketConnected(true);

    socket.emit('join', user.id);

    console.log(
      'Joined room:',
      user.id
    );
    // socket.on('connect', () => {
    //   console.log('Socket connected');
    // setSocketConnected(true);

    //   socket.emit('join', user.id);
    // });
  };
    const handleDisconnect = () => {
      console.log('Socket disconnected');

      setSocketConnected(false);
    };

  const handleNoteUpdate = (
    updatedNote: Note
  ) => {
    console.log(
      'Realtime note update:',
      updatedNote
    );

    setNotes((prev) =>
      prev.map((note) =>
        note.id === updatedNote.id
          ? updatedNote
          : note
      )
    );
  };

  socket.on('connect', handleConnect);
  socket.on(
    'disconnect',
    handleDisconnect
  );
  socket.on(
    'noteUpdated',
    handleNoteUpdate
  );

  return () => {
    socket.off(
      'connect',
      handleConnect
    );
    socket.off(
    'disconnect',
    handleDisconnect
  );

    socket.off(
      'noteUpdated',
      handleNoteUpdate
    );

    socket.disconnect();

    console.log('Socket disconnectedOUT');

      
  };
}, [hydrated, token, user]);

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
          console.log(
      'FETCHED NOTES:',
      res.data
    );

      setNotes(res.data);
    } catch (err) {
      console.error(err);

      setError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }
  async function saveEdit(
    noteId: string
  ) {
    try {
      // optimistic update

      setNotes((prev) =>
        prev.map((note) =>
          note.id === noteId
            ? {
                ...note,
                title: editTitle,
                content: editContent,
                summary: 'Generating AI summary...',
              }
            : note
        )
      );

      await api.patch(
        `/notes/${noteId}`,
        {
          title: editTitle,
          content: editContent,
        }
      );

      cancelEditing();
    } catch (err) {
      console.error(err);

      setError('Failed to update note');
    }
  }
  async function askAI() {
    if (!chatMessage.trim()) return;

    try {
      setChatLoading(true);

      setChatResponse('');

      const updatedMessages: ChatMessage[] = [
        ...messages,
        {
          role: 'user',
          content: chatMessage,
        },
      ];

      setMessages(updatedMessages);

      const token =
        useAuthStore.getState().token;

      const response = await fetch(
        'http://localhost:3001/chat/stream',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            question: chatMessage,
            messages: updatedMessages,
          }),
        },
      );

      if (!response.body) return;

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder();

      let accumulatedResponse = '';

      while (true) {
        const { done, value } =
          await reader.read();

        if (done) break;

        const chunk =
          decoder.decode(value);

        accumulatedResponse += chunk;

        setChatResponse(
          accumulatedResponse,
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            accumulatedResponse,
        },
      ]);

      setChatMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  }
    function handleLogout() {
    // clear cookie
    document.cookie =
      'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';

    // clear zustand auth
    localStorage.removeItem('auth-storage');

    // redirect
    router.push('/login');
  }
  function startEditing(note: Note) {
    setEditingId(note.id);

    setEditTitle(note.title);

    setEditContent(note.content);
  }
  function cancelEditing() {
    setEditingId(null);

    setEditTitle('');

    setEditContent('');
  }              

  // -----------------------------------
  // REALTIME SOCKET UPDATES
  // -----------------------------------

  // useEffect(() => {
  //   if (!user) return;

  //   socket.on(
  //     `note:${user.id}`,
  //     (updatedNote: Note) => {
  //       setNotes((prev) =>
  //         prev.map((n) =>
  //           n.id === updatedNote.id
  //             ? updatedNote
  //             : n
  //         )
  //       );
  //     }
  //   );

  //   socket.on('connect', () => {
  //     console.log('Socket connected');
  //   });

  //   return () => {
  //     socket.off(`note:${user.id}`);
  //   };
  // }, [user]);

  // -----------------------------------
  // CREATE NOTE
  // -----------------------------------

 async function createNote() {
  const parsed =
    createNoteSchema.safeParse({
      title,
      content,
    });

  if (!parsed.success) {
    alert(
      parsed.error.issues[0].message
    );

    return;
  }

  try {
    const optimisticNote = {
      id: crypto.randomUUID(),

      title,

      content,

      summary:
        'Generating AI summary...',

      createdAt:
        new Date().toISOString(),
    };

    setNotes((prev) => [
      optimisticNote,
      ...prev,
    ]);

    setTitle('');
    setContent('');

    const res = await api.post(
      '/notes',
      {
        title,
        content,
      }
    );

    setNotes((prev) => [
      res.data,
      ...prev.filter(
        (n) => n.id !== optimisticNote.id
      ),
    ]);
  } catch (err) {
    console.error(err);
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
    const res = await api.patch(
      `/notes/${id}/archive`
    );
        console.log(
      'ARCHIVING NOTE:',
      id
    );
    console.log("ARCHIVE RESPONSE DATA:", res.data);

    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? {
              ...note,
              isArchived: true,
            }
          : note
      )
    );
  } catch (err) {
    console.error(err);

    setError('Failed to archive note');
  }
}
  async function unarchiveNote(
  id: string
) {
  try {
    await api.patch(
      `/notes/${id}/unarchive`
    );

    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? {
              ...note,
              isArchived: false,
            }
          : note
      )
    );
  } catch (err) {
    console.error(err);

    setError(
      'Failed to unarchive note'
    );
  }
}
  const activeNotes =
  notes.filter(
    (note) => !note.isArchived
  );

const archivedNotes =
  notes.filter(
    (note) => note.isArchived
  );
  console.log(
  'ALL NOTES:',
  notes
);

console.log(
  'ARCHIVED NOTES:',
  archivedNotes
);
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
console.log(
  notes.map((n) => n.id)
);
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

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition"
        >
          Logout
        </button>
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

          <RichTextEditor
            content={content}
            onChange={setContent}
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

      <div className="mb-8">
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
      {/* AI CHAT */}
      <div className="border rounded-2xl p-6 mb-10 shadow-sm">
        <h2 className="text-2xl font-bold mb-4">
          AI Chat With Notes
        </h2>

        {/* CHAT INPUT */}

        <div className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Ask something about your notes..."
            value={chatMessage}
            onChange={(e) =>
              setChatMessage(
                e.target.value,
              )
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                askAI();
              }
            }}
            className="border p-3 rounded-lg flex-1"
          />

          <button
            onClick={askAI}
            disabled={chatLoading}
            className="bg-blue-600 text-white px-5 py-3 rounded-lg disabled:opacity-50"
          >
            {chatLoading
              ? 'Thinking...'
              : 'Ask AI'}
          </button>
        </div>

        {/* CHAT CONVERSATION */}

        <div className="space-y-4">
          {messages.map(
            (msg, index) => (
              <div
                key={index}
                className={
                  msg.role === 'user'
                    ? 'bg-blue-100 p-4 rounded-xl'
                    : 'bg-gray-100 p-4 rounded-xl'
                }
              >
                <p className="font-semibold mb-2">
                  {msg.role === 'user'
                    ? 'You'
                    : 'AI'}
                </p>

                <div
                  className="
                    prose
                    max-w-none
                    prose-zinc
                    whitespace-pre-wrap
                  "
                >
                  <ReactMarkdown>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ),
          )}

          {/* STREAMING RESPONSE */}

          {chatLoading &&
            chatResponse && (
              <div className="bg-gray-100 p-4 rounded-xl">
                <p className="font-semibold mb-2">
                  AI
                </p>

                <div
                  className="
                    prose
                    max-w-none
                    prose-zinc
                    whitespace-pre-wrap
                  "
                >
                  <ReactMarkdown>
                    {chatResponse}
                  </ReactMarkdown>
                </div>
              </div>
            )}
        </div>

        {/* SOURCES */}

        {Array.isArray(chatSources) &&
          chatSources.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-3">
                Sources
              </h4>

              <div className="flex flex-wrap gap-2">
                {chatSources.map(
                  (source) => (
                    <div
                      key={source.id}
                      className="bg-white border rounded-lg px-3 py-2 text-sm"
                    >
                      {source.title}
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
      </div>
      {/* ACTIVE NOTES */}

      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-5">
          Active Notes
        </h2>

        {!loading &&
          activeNotes.length === 0 && (
            <div className="text-gray-500 border rounded-xl p-8 text-center">
              No active notes
            </div>
          )}

        <div className="grid gap-5">
          {activeNotes.map((note) => (
            <div
              key={note.id}
              className="border rounded-2xl p-5 shadow-sm"
            >
              {/* EDIT MODE */}

              {editingId === note.id ? (
                <div className="flex flex-col gap-3 mb-4">
                  <input
                    value={editTitle}
                    onChange={(e) =>
                      setEditTitle(
                        e.target.value
                      )
                    }
                    className="border p-3 rounded-lg"
                  />

                  <RichTextEditor
                      content={editContent}
                      onChange={setEditContent}
                    />
                </div>
              ) : (
                <>
                  {/* TITLE */}

                  <h2 className="font-bold text-2xl mb-2">
                    {note.title}
                  </h2>

                  {/* CONTENT */}

                <div
                  className="prose max-w-none mb-4"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      note.content
                    ),
                  }}
                />
                </>
              )}

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

              <div className="flex gap-3 flex-wrap">
                {editingId === note.id ? (
                  <>
                    <button
                      onClick={() =>
                        saveEdit(note.id)
                      }
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                      Save
                    </button>

                    <button
                      onClick={cancelEditing}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() =>
                      startEditing(note)
                    }
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                  >
                    Edit
                  </button>
                )}

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

      {/* ARCHIVED NOTES */}

      <div>
        <h2 className="text-3xl font-bold mb-5">
          Archived Notes
        </h2>

        {archivedNotes.length === 0 && (
          <div className="text-gray-500 border rounded-xl p-8 text-center">
            No archived notes
          </div>
        )}

        <div className="grid gap-5">
          {archivedNotes.map((note) => (
            <div
              key={note.id}
              className="border rounded-2xl p-5 shadow-sm bg-gray-50"
            >
              {/* EDIT MODE */}

              {editingId === note.id ? (
                <div className="flex flex-col gap-3 mb-4">
                  <input
                    value={editTitle}
                    onChange={(e) =>
                      setEditTitle(
                        e.target.value
                      )
                    }
                    className="border p-3 rounded-lg"
                  />

                  <textarea
                    value={editContent}
                    onChange={(e) =>
                      setEditContent(
                        e.target.value
                      )
                    }
                    className="border p-3 rounded-lg min-h-[120px]"
                  />
                </div>
              ) : (
                <>
                  {/* TITLE */}

                  <h2 className="font-bold text-2xl mb-2">
                    {note.title}
                  </h2>

                  {/* CONTENT */}

                  <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                    {note.content}
                  </p>
                </>
              )}

              {/* AI SUMMARY */}

              <div className="bg-white rounded-xl p-4 mb-4">
                <h3 className="font-semibold mb-2">
                  AI Summary
                </h3>

                {note.summary ? (
                  <p>{note.summary}</p>
                ) : (
                  <p className="text-gray-400">
                    No summary available
                  </p>
                )}
              </div>

              {/* ACTIONS */}

              <div className="flex gap-3 flex-wrap">
                {editingId === note.id ? (
                  <>
                    <button
                      onClick={() =>
                        saveEdit(note.id)
                      }
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                      Save
                    </button>

                    <button
                      onClick={cancelEditing}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() =>
                      startEditing(note)
                    }
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                  >
                    Edit
                  </button>
                )}

                <button
                  onClick={() =>
                    unarchiveNote(note.id)
                  }
                  className="bg-green-600 text-white px-4 py-2 rounded-lg"
                >
                  Unarchive
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
    </div>
  );
}