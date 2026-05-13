'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';

export default function DashboardPage() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const res = await api.get('/notes');
    setNotes(res.data);
  }

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">
        Smart Notes Dashboard
      </h1>

      <div className="grid gap-4">
        {notes.map((note: any) => (
          <div
            key={note.id}
            className="border rounded-xl p-4"
          >
            <h2 className="font-bold text-xl">
              {note.title}
            </h2>

            <p>{note.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}