# Travel Buddy (Ionic React)

This is a JavaScript (no TypeScript) Ionic React app scaffolded with a tabs layout and prepared for Capacitor + Android.

Local setup (run these in PowerShell in `d:\trip\travel-buddy`):

````markdown
# Travel Buddy (Ionic React)

A rebuilt Ionic React mobile application (JavaScript, Vite) with Capacitor-ready Android support, offline-first features (SQLite), Firebase authentication, MapLibre + Ola Maps integration, and a FastAPI backend integration pattern.

This README consolidates purpose, important files, why the project exists, and step-by-step instructions to run and build both the frontend mobile app and the backend expectations.

**Quick links**
- **Project root:** `README.md`
 # Travel Buddy (Ionic React)

A rebuilt Ionic React mobile application (JavaScript, Vite) with Capacitor-ready Android support, offline-first features (SQLite), Firebase authentication, MapLibre + Ola Maps integration, and a FastAPI backend integration pattern.

This README consolidates purpose, important files, why the project exists, and step-by-step instructions to run and build both the frontend mobile app and the backend expectations.

**Quick links**
- **Project root:** `README.md`
- **Build instructions:** `BUILD_INSTRUCTIONS.md`
- **Backend setup:** `FASTAPI_BACKEND_SETUP.md`
- **MongoDB integration:** `MONGODB_INTEGRATION.md`
- **Rebuild summary:** `REBUILD_SUMMARY.md`

**Prerequisites**
- **Node.js** 16+ and `npm`
- **Android Studio** (Android SDK + emulator) for native builds
- **Java 17** (for Android Gradle builds)
- **Python + FastAPI** (if you run the backend locally)
- Firebase project (for Google Sign-In) and `google-services.json` for Android

**Environment (.env)**
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

Use `http://10.0.2.2:8000` for the Android emulator to reach a backend running on your host at port 8000.

**What & Why**
- **What:** A mobile travel-itinerary app with online (FastAPI + MongoDB) and offline (Capacitor SQLite) support, maps, notifications, and secure auth.
- **Why:** Provide a resilient offline-first mobile experience while keeping backend responsibilities (data, auth) on a secure FastAPI service.

**High-level features**
- Firebase Google Sign-In with JWT exchange to a backend
- JWT refresh and automatic handling on 401
- Offline storage via `@capacitor-community/sqlite` (download itineraries for offline use)
- Map rendering with `maplibre-gl` and Ola Maps tiles
- Push & local notifications via Capacitor plugins
- Network detection and UI switching between online and offline sources

**Project structure (key files)**
- `src/` : main application source
	- `api/` : `axiosClient.js`, `firebase.js`, `network.js`, `notifications.js`, `olaMaps.js`
	- `components/` : `ItineraryMap.jsx`, `NetworkStatus.jsx`, `ProtectedRoute.jsx`
	- `context/` : `AuthContext.jsx` (auth state and provider)
	- `hooks/` : `useAuth.js`, `useItineraries.js`
	- `pages/` : `LoginPage.jsx`, `HomePage.jsx`, `ItineraryDetailPage.jsx`, `OfflinePage.jsx`, `SettingsPage.jsx`
	- `storage/` : `preferences.js`, `sqlite.js`
	- `router/` : `AppRouter.jsx`
	- `theme/` : `colors.js`
	- `utils/` : `helpers.js`, `constants.js`, `env.js`
- Android project: `android/` (Capacitor-generated Android project)
- Configs: `capacitor.config.json`, `ionic.config.json`, `vite.config.js`

**Scripts (from `package.json`)**
- `npm start` : Start dev server (Vite)
- `npm run build` : Build web assets
- `npm run preview` : Preview production build
- `npm run ionic:build` : Alias to `vite build`
- `npm run cap:sync` : `cap sync`
- `npm run cap:open` : `cap open android`

**Frontend setup & development (PowerShell)**
1. Install dependencies:

```powershell
npm install
```

2. Start dev server (web):

```powershell
npm start
# opens at http://localhost:3000 by default
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

**Backend (FastAPI) expectations**
- The frontend expects a FastAPI backend with these endpoints (see `FASTAPI_BACKEND_SETUP.md`):
	- `POST /auth/firebase` — exchange Firebase ID token for JWT (should accept `{ id_token }` or `{ idToken }` depending on implementation)
	- `POST /auth/refresh` — refresh tokens
	- `GET /itineraries` — list itineraries (authorized)
	- `GET /itineraries/:id`, `POST /itineraries`, `PUT /itineraries/:id`, `DELETE /itineraries/:id`

Refer to `FASTAPI_BACKEND_SETUP.md` for detailed environment variables, run commands, and connectivity notes (emulator vs host URLs).

**MongoDB schema & mapping**
- The frontend expects itineraries in a schema similar to the one documented in `MONGODB_INTEGRATION.md` (fields like `start_date`, `day_plans[].activities[]`, `duration_days`).

**Important implementation notes**
- Tokens stored using Capacitor Preferences (not localStorage)
- Axios client adds `Authorization: Bearer <token>` header automatically and handles 401 refresh
- Offline fallback uses SQLite (`@capacitor-community/sqlite`) with helper functions in `src/storage/sqlite.js`
- MapLibre + Ola Maps require `VITE_OLA_MAPS_KEY` in `.env`

**Troubleshooting**
- Build errors (Capacitor plugins): ensure `npm install` completed and run `npx cap sync`.
- Firebase issues: verify `google-services.json` in `android/app/` and correct Firebase config in `.env`.
- Backend connectivity: emulator uses `http://10.0.2.2:8000`; physical device should use host IP.
- CORS: enable CORS in FastAPI for `http://localhost:3000` and your app origins.

**Code Overview**
- **`src/main.jsx`**: App entry — initializes Ionic, logs Capacitor plugin info for debugging, and mounts `App` into the DOM.
- **`src/App.jsx`**: Wraps the application in an `ErrorBoundary` and renders the `AppRouter` inside `IonApp`.
- **`src/router/AppRouter.jsx`**: Defines routes and tabs using `IonReactRouter`. It uses `AuthProvider` to guard routes and initializes services (network + notifications). Shows a loading spinner while auth state initializes and redirects to `/login` when unauthenticated.
- **`src/context/AuthContext.jsx` & `src/hooks/useAuth.js`**: `useAuth` manages login/logout, checks stored tokens and Firebase user, and exposes `user`, `isAuthenticated`, `loading`, `login`, `logout`. `AuthProvider` exposes this hook via React Context for the app.
- **`src/api/axiosClient.js`**: Central Axios instance with:
	- request interceptor to attach JWT from in-memory cache or Capacitor Preferences
	- response interceptor to handle 401 responses and perform token refresh with queueing to avoid parallel refreshes
	- helper functions to set/get tokens and clear auth
	- exported `api` object with typed endpoints (`auth`, `itineraries`).
- **`src/api/firebase.js`**: Firebase sign-in using `signInWithPopup`; exchanges Firebase ID token with backend `/auth/firebase`, stores returned access/refresh tokens via `setAuthTokens`, and exposes `signInWithGoogle`, `signOut`, `getCurrentUser`.
- **`src/api/network.js`**: Uses Capacitor Network plugin to track connectivity, exposes `initNetwork`, `isOnline`, `useNetworkStatus` hook, and a subscription API for other modules.
- **`src/storage/sqlite.js`**: Offline storage layer using `@capacitor-community/sqlite` (and `jeep-sqlite` web fallback). Provides `saveItineraryOffline`, `getAllOfflineItineraries`, `getOfflineItinerary`, `deleteOfflineItinerary`, `isItineraryOffline`. Initializes the DB and creates `itineraries` table; gracefully degrades in browser/native when plugin not available.
- **`src/hooks/useItineraries.js`**: High-level hook that loads itineraries from backend when online or from SQLite when offline. Exposes `loadItineraries`, `getItinerary`, `downloadOffline`, `deleteItinerary`, and `checkIsOffline` to pages.
- **`src/pages/HomePage.jsx`**: Lists itineraries, supports pull-to-refresh, delete, and shows offline badges when an itinerary is saved locally. Uses `useItineraries`, `NetworkStatus`, and helper functions for display.
- **`src/pages/ItineraryDetailPage.jsx`**: Shows itinerary details (day plans, activities), supports downloading the itinerary for offline use and scheduling reminders via notifications. Falls back to offline source when necessary.
- **`src/components/NetworkStatus.jsx`**: Small UI badge component that displays `Online` or `Offline` using `useNetworkStatus`.
- **`src/components/ItineraryMap.jsx`**: Map component currently stubbed out (returns `null`) — map rendering removed from UI, but MapLibre & Ola Maps integration live in `src/api/olaMaps.js` if present.

**Suggested next steps**
- Create `.env` with values shown above.
- Run `npm install` locally to install dependencies.
- Start the dev server with `npm start` and open `http://localhost:3000`.
- If you plan to run on Android emulator, build and sync Capacitor: `npm run build && npx cap sync` then open in Android Studio with `npx cap open android`.

If you want, I can now extract additional code snippets into the README (for example, the axios auth flow or SQLite usage). Tell me what you'd like included.
