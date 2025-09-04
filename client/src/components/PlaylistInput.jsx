import React, { useState } from 'react';

export default function PlaylistInput({ onLoad }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await onLoad(url); } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="form">
      <input className="input" placeholder="https://open.spotify.com/playlist/..." value={url} onChange={(e)=>setUrl(e.target.value)} required />
      <button className="btn" style={{background:'#334155'}} disabled={loading}>{loading ? 'Ładowanie…' : 'Wczytaj'}</button>
    </form>
  );
}
