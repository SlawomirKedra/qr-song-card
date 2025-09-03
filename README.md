# QR Song Cards

Prosta aplikacja webowa (React + Vite + Tailwind + Express), która umożliwia tworzenie i drukowanie kart z kodami QR do piosenek — w stylu QRSong.

## Funkcje
- Dodawanie wielu utworów (tytuł, wykonawca, rok, URL).
- Automatyczne generowanie QR (z URL).
- Opcjonalne pobranie miniatury i tytułu przez **oEmbed** (YouTube/Spotify/SoundCloud) via backend `/api/oembed`.
- Podgląd kart w siatce + tryb wydruku.
- Eksport **PDF** (A4, siatka 3×2) i **PNG** każdej karty.
- 3 motywy kart (Jasny, Ciemny, Neon).
- Jeden repozytorium: frontend + backend. W produkcji Express serwuje build Reacta.

## Szybki start (lokalnie)
Wymagany **Node 18+**.

```bash
# 1) Rozpakuj projekt i wejdź do katalogu
cd qr-song-cards

# 2) Zainstaluj zależności
npm install

# 3) Tryb developerski (frontend + backend równolegle)
npm run dev
# Frontend: http://localhost:5173
# Backend API: http://localhost:8080

# 4) Build produkcyjny i uruchomienie jednego serwera (Express + statyczny frontend)
npm run build && npm start
# Aplikacja: http://localhost:8080
```

## Deploy jako jeden serwis (np. Render)
1. Wgraj repo do GitHub.
2. Na Render utwórz **Web Service** z tego repo.
3. Ustaw:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Region/Node:** dowolne, Node 18+.
4. Po deployu otrzymasz jeden URL (np. `https://twoja-apka.onrender.com/`) — API i frontend będą pod tym samym hostem.

> Alternatywnie: backend na Render (Web Service), frontend na Netlify/Vercel (statyczny build z `client/dist`) i ustaw w `VITE_API_BASE` adres API.

## Zmienne środowiskowe (opcjonalne)
- `VITE_API_BASE` (frontend) – nadpisuje bazowy URL API w produkcji (gdy frontend nie jest serwowany przez Express).

## Struktura
```
qr-song-cards/
├─ client/           # React + Vite + Tailwind
│  ├─ src/
│  │  ├─ components/
│  │  ├─ utils/
│  │  ├─ App.jsx
│  │  └─ main.jsx
│  ├─ index.html
│  ├─ tailwind.config.cjs
│  ├─ postcss.config.cjs
│  ├─ vite.config.js
│  └─ package.json
├─ server/           # Express API + serwowanie builda
│  ├─ index.js
│  └─ package.json
├─ package.json      # skrypty monorepo
└─ README.md
```

## Licencja
MIT
