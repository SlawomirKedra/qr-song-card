# QR Song Cards (v2)

Zmiany:
- Karta **dwustronna**: front = sam QR, back = wykonawca/tytuł/rok + miniatura.
- **Import z playlisty Spotify** — podaj link do playlisty, reszta zaciąga się automatycznie z API.
- Eksport PDF oddzielnie: **Fronty** i **Tyły** (do druku dwustronnego).

## Start
```bash
npm install
npm run dev
# front: http://localhost:5173, api: http://localhost:8080
```
Produkcja (jeden serwer Express):
```bash
npm run build && npm start
# http://localhost:8080
```

## Konfiguracja Spotify (backend)
Dodaj zmienne środowiskowe (Render → Settings → Environment):
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`

Back-end korzysta z **Client Credentials Flow**, więc wystarczą te 2 wartości, by pobrać publiczne playlisty.

## Deploy na Render (1 serwis)
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Env: `NODE_VERSION=20` (lub 22), `NPM_CONFIG_PRODUCTION=false`, `SPOTIFY_CLIENT_ID/SECRET`
