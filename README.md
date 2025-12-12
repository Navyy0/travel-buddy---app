# Travel Buddy (Ionic React)

A rebuilt Ionic React mobile application (JavaScript, Vite) with Capacitor-ready Android support, offline-first features (SQLite), Firebase authentication, MapLibre + Ola Maps integration, and a FastAPI backend integration pattern.

This README consolidates purpose, important files, and step-by-step instructions to run and build both the frontend mobile app and the backend expectations.

## Quick links

* **Project root:** `README.md`
* **Build instructions:** `BUILD_INSTRUCTIONS.md`
* **Backend setup:** `FASTAPI_BACKEND_SETUP.md`
* **MongoDB integration:** `MONGODB_INTEGRATION.md`
* **Rebuild summary:** `REBUILD_SUMMARY.md`

## Prerequisites

* Node.js 16+ and `npm`
* Android Studio (Android SDK + emulator) for native builds
* Java 17 (for Android Gradle builds)
* Python + FastAPI (if you run the backend locally)
* Firebase project (for Google Sign-In) and `google-services.json` for Android

## Environment (.env)

Create a `.env` file in the project root with the following values (example):

```
VITE_API_URL=http://10.0.2.2:8000
VITE_OLA_MAPS_KEY=7ESZWDQZLm4OdPwfVF5yDpyBiLM0qOkm74TMC93i
VITE_FIREBASE_API_KEY=<your-firebase-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-firebase-auth-domain>
VITE_FIREBASE_PROJECT_ID=<your-firebase-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<your-firebase-storage-bucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-firebase-messaging-id>
VITE_FIREBASE_APP_ID=<your-firebase-app-id>
```

Notes:

* Use `http://10.0.2.2:8000` when running the backend on your host and testing from the Android emulator (this maps to host localhost).
* For a physical device, replace `VITE_API_URL` with your machine's LAN IP (e.g., `http://192.168.1.100:8000`).

## What & Why

* **What:** A mobile travel-itinerary app with online (FastAPI + MongoDB) and offline (Capacitor SQLite) support, maps, notifications, and secure auth.
* **Why:** Provide a resilient offline-first mobile experience while keeping backend responsibilities (data, auth) on a secure FastAPI service.

## High-level features

* Firebase Google Sign-In with JWT exchange to a backend
* JWT refresh and automatic handling on 401
* Offline storage via `@capacitor-community/sqlite` (download itineraries for offline use)
* Map rendering with `maplibre-gl` and Ola Maps tiles
* Push & local notifications via Capacitor plugins
* Network detection and UI switching between online and offline sources

## Project structure (key files)

* `src/` : main application source

  * `api/` : `axiosClient.js`, `firebase.js`, `network.js`, `notifications.js`, `olaMaps.js`
  * `components/` : `ItineraryMap.jsx`, `NetworkStatus.jsx`, `ProtectedRoute.jsx`
  * `context/` : `AuthContext.jsx` (auth state and provider)
  * `hooks/` : `useAuth.js`, `useItineraries.js`
  * `pages/` : `LoginPage.jsx`, `HomePage.jsx`, `ItineraryDetailPage.jsx`, `OfflinePage.jsx`, `SettingsPage.jsx`
  * `storage/` : `preferences.js`, `sqlite.js`
  * `router/` : `AppRouter.jsx`
  * `theme/` : `colors.js`
  * `utils/` : `helpers.js`, `constants.js`, `env.js`
* Android project: `android/` (Capacitor-generated Android project)
* Configs: `capacitor.config.json`, `ionic.config.json`, `vite.config.js`

## Scripts (from `package.json`)

* `npm start` : Start dev server (Vite) — default port depends on config (commonly 5173)
* `npm run build` : Build web assets
* `npm run preview` : Preview production build
* `npm run ionic:build` : Alias to `vite build`
* `npm run cap:sync` : `cap sync`
* `npm run cap:open` : `cap open android`

## Frontend setup & development (PowerShell)

1. Install dependencies:

```powershell
npm install
```

2. Start dev server (web):

```powershell
npm start
# opens at the Vite dev server port (commonly http://localhost:5173 unless configured otherwise)
```

3. Build production web assets:

```powershell
npm run build
```

4. Capacitor: sync and open Android project

```powershell
npx cap sync
npx cap open android
```

5. In Android Studio: add `google-services.json` to `android/app/` and run on emulator/device.

## Backend (FastAPI) expectations

The frontend expects a FastAPI backend with these endpoints (see `FASTAPI_BACKEND_SETUP.md` for full details):

* `POST /auth/firebase` — exchange Firebase ID token for JWT. Accepts `{ "id_token": "..." }` (or `{ "idToken": "..." }` depending on your frontend payload).
* `POST /auth/refresh` — refresh access tokens using a refresh token.
* `GET /itineraries` — list itineraries (authorized)
* `GET /itineraries/:id` — get itinerary by id
* `POST /itineraries` — create itinerary
* `PUT /itineraries/:id` — update itinerary
* `DELETE /itineraries/:id` — delete itinerary

Also ensure CORS allows `http://localhost:5173`, `http://localhost:3000` (if used), and your app origins. Use secure JWT handling and proper token expiry/rotation.

## MongoDB schema & mapping

The frontend expects itineraries in a schema similar to the one documented in `MONGODB_INTEGRATION.md` (fields like `start_date`, `day_plans[].activities[]`, `duration_days`). Keep IDs consistent (string UUID or Mongo ObjectId) and expose JSON fields the frontend expects.

## Important implementation notes

* Tokens stored using Capacitor Preferences (not localStorage)
* Axios client adds `Authorization: Bearer <token>` header automatically and handles 401 refresh
* Offline fallback uses SQLite (`@capacitor-community/sqlite`) with helper functions in `src/storage/sqlite.js`
* MapLibre + Ola Maps require `VITE_OLA_MAPS_KEY` in `.env`

## Troubleshooting

* Build errors (Capacitor plugins): ensure `npm install` completed and run `npx cap sync`.
* Firebase issues: verify `google-services.json` in `android/app/` and correct Firebase config in `.env`.
* Backend connectivity: emulator uses `http://10.0.2.2:8000`; physical device should use host LAN IP.
* CORS: enable CORS in FastAPI for the dev server origins.

## Code Overview (brief)

* **`src/main.jsx`**: App entry — initializes Ionic and mounts `App`.
* **`src/App.jsx`**: Wraps the app in an `ErrorBoundary` and renders `AppRouter` inside `IonApp`.
* **`src/router/AppRouter.jsx`**: Defines routes and tabs using `IonReactRouter`, uses `AuthProvider` to guard routes.
* **`src/context/AuthContext.jsx` & `src/hooks/useAuth.js`**: `useAuth` manages login/logout, tokens, and exposes `user`, `isAuthenticated`, `loading`, `login`, `logout`.
* **`src/api/axiosClient.js`**: Central Axios instance with interceptors for attaching tokens, handling 401 and token refresh.
* **`src/api/firebase.js`**: Firebase sign-in using `signInWithPopup`; exchanges Firebase ID token with backend `/auth/firebase`, stores returned access/refresh tokens.
* **`src/api/network.js`**: Uses Capacitor Network plugin to track connectivity and exposes `useNetworkStatus`.
* **`src/storage/sqlite.js`**: Offline storage using `@capacitor-community/sqlite` with a web fallback (jeep-sqlite). Provides helpers for storing and retrieving itineraries.
* **`src/hooks/useItineraries.js`**: Loads itineraries from backend when online or from SQLite when offline.
* **`src/pages/HomePage.jsx`**: Lists itineraries, supports pull-to-refresh, delete, and shows offline badges.
* **`src/pages/ItineraryDetailPage.jsx`**: Shows itinerary details, supports downloading for offline use and scheduling reminders.
* **`src/components/NetworkStatus.jsx`**: Displays `Online` or `Offline` status using `useNetworkStatus`.

---


