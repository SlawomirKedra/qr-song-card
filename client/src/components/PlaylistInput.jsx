import React, { useState } from 'react';

export default function PlaylistInput({ onLoad }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onLoad(url);
    } catch (e) {
      setError(e?.message || 'Błąd');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2"
        placeholder="https://open.spotify.com/playlist/..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
      />
      <button
        className="px-3 py-2 rounded bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60"
        disabled={loading}
      >
        {loading ? 'Ładowanie…' : 'Wczytaj'}
      </button>
    </form>
  );
}
