import React, { useRef } from 'react';

export default function SongRow({ song, onChange, onRemove, onAuto }) {
  const fileInput = useRef(null);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (evt) => onChange({ cover: evt.target.result });
    reader.readAsDataURL(f);
  };

  return (
    <div className="grid md:grid-cols-[2fr_2fr_1fr_3fr_auto] gap-2 items-center">
      <input
        className="bg-slate-900 border border-slate-700 rounded px-3 py-2"
        placeholder="Tytuł"
        value={song.title}
        onChange={(e) => onChange({ title: e.target.value })}
      />
      <input
        className="bg-slate-900 border border-slate-700 rounded px-3 py-2"
        placeholder="Wykonawca"
        value={song.artist}
        onChange={(e) => onChange({ artist: e.target.value })}
      />
      <input
        className="bg-slate-900 border border-slate-700 rounded px-3 py-2"
        placeholder="Rok"
        value={song.year}
        onChange={(e) => onChange({ year: e.target.value })}
      />
      <div className="flex gap-2">
        <input
          className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2"
          placeholder="URL (Spotify/YouTube/SoundCloud lub dowolny)"
          value={song.url}
          onChange={(e) => onChange({ url: e.target.value })}
        />
        <button
          className="px-3 py-2 bg-amber-500 hover:bg-amber-600 rounded"
          onClick={() => onAuto && onAuto(song.url)}
          title="Auto‑uzupełnij z oEmbed"
        >
          Auto
        </button>
      </div>
      <div className="flex gap-2 justify-end">
        <input type="file" accept="image/*" ref={fileInput} onChange={onFile} className="hidden" />
        <button
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded"
          onClick={() => fileInput.current?.click()}
        >
          Okładka
        </button>
        <button
          className="px-3 py-2 bg-rose-600 hover:bg-rose-700 rounded"
          onClick={onRemove}
        >
          Usuń
        </button>
      </div>
    </div>
  );
}
