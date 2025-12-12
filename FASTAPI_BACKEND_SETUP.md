# FastAPI Backend Integration Guide

## Overview

Your **FastAPI backend** (Python with uvicorn) is running on port 8000 and connects to MongoDB. The Android app connects to your FastAPI backend, which then queries MongoDB.

## Architecture

```
┌─────────────────┐         ┌──────────────┐         ┌──────────┐
│  Android App    │────────▶│  FastAPI     │────────▶│ MongoDB  │
│  (Ionic React)  │  HTTP   │  Backend     │  Motor  │ Database │
│                 │         │  :8000       │  Driver │          │
└─────────────────┘         └──────────────┘         └──────────┘
      │                            │
      │                            │
      ▼                            ▼
  SQLite (offline)          Handles all DB ops
```

## Setup Instructions

### 1. Create `.env` File

Create a `.env` file in the project root (`d:\travel-buddy - Copy\.env`):

```env
# FastAPI Backend URL
# Your backend is running on http://0.0.0.0:8000
# For Android Emulator: http://10.0.2.2:8000
# For local web: http://localhost:8000
VITE_API_URL=http://10.0.2.2:8000

# Other configs (already have defaults)
VITE_OLA_MAPS_KEY=7ESZWDQZLm4OdPwfVF5yDpyBiLM0qOkm74TMC93i
VITE_FIREBASE_API_KEY=AIzaSyDfWPSRUN0WHyWiZVz0BmX2dbzUjksT0zY
VITE_FIREBASE_AUTH_DOMAIN=ai-travel-4609c.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ai-travel-4609c
VITE_FIREBASE_STORAGE_BUCKET=ai-travel-4609c.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=999267496074
VITE_FIREBASE_APP_ID=1:999267496074:web:9c71b162e0135da037bd73
```

**Quick setup:**
```powershell
# Copy the example file
Copy-Item .env.example .env
```

### 2. FastAPI Backend Endpoints Required

Your FastAPI backend should provide these endpoints:

#### Authentication
- `POST /auth/firebase`
  - Request body: `{ "id_token": "firebase_id_token_string" }`
  - Response: `{ "access_token": "jwt_token", "token_type": "bearer", "user": {...} }`

- `POST /auth/refresh`
  - Request body: `{ "refresh": "refresh_token_string" }`
  - Response: `{ "access_token": "...", "refresh_token": "..." }`

#### Itineraries
- `GET /itineraries`
  - Headers: `Authorization: Bearer <jwt_token>`
  - Response: Array of itineraries in MongoDB schema format

- `GET /itineraries/{id}`
  - Headers: `Authorization: Bearer <jwt_token>`
  - Response: Single itinerary object

- `POST /itineraries`
  - Headers: `Authorization: Bearer <jwt_token>`
  - Request body: ItineraryCreate schema
  - Response: Created itinerary

- `PUT /itineraries/{id}`
  - Headers: `Authorization: Bearer <jwt_token>`
  - Request body: ItineraryUpdate schema
  - Response: Updated itinerary

- `DELETE /itineraries/{id}`
  - Headers: `Authorization: Bearer <jwt_token>`
  - Response: Success message

### 3. MongoDB Schema Support

The frontend is configured to handle your MongoDB schema:

```python
# Your FastAPI Pydantic models
class Itinerary(BaseModel):
    id: Optional[str]
    user_id: str
    title: str
    description: Optional[str]
    destination: str
    start_date: str  # YYYY-MM-DD
    end_date: str    # YYYY-MM-DD
    duration_days: int
    day_plans: List[DayPlan]
    total_budget: Optional[float]
    travel_style: Optional[str]
    is_public: bool = False
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
```

The frontend helpers extract:
- Activities from `day_plans[].activities[]`
- Start date from `start_date`
- Destination from `destination`
- Activity count across all day_plans
- Duration from `duration_days`

### 4. Connection URLs

Since your FastAPI backend runs on `http://0.0.0.0:8000`:

| Environment | URL |
|------------|-----|
| Android Emulator | `http://10.0.2.2:8000` |
| Local Web Browser | `http://localhost:8000` |
| Physical Device (same network) | `http://<your-computer-ip>:8000` |

To find your computer's IP (for physical device):
```powershell
ipconfig
# Look for IPv4 Address under your active network adapter
```

### 5. Testing the Connection

1. **Start your FastAPI backend:**
   ```powershell
   cd D:\trip\backend
   .\.venv\Scripts\Activate.ps1
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start the frontend:**
   ```powershell
   cd "d:\travel-buddy - Copy"
   npm start
   ```

3. **Test in browser:**
   - Open `http://localhost:3000`
   - Should connect to `http://localhost:8000` (FastAPI backend)

4. **Test on Android Emulator:**
   - Build and run: `npm run build && npx cap sync && npx cap open android`
   - Should connect to `http://10.0.2.2:8000` (FastAPI backend)

### 6. Data Flow

**When Online:**
```
Android App → GET /itineraries → FastAPI Backend → MongoDB → Response → Display
```

**When Offline:**
```
Android App → SQLite Database → Display
```

### 7. Important Notes

✅ **Correct Architecture:**
- Android app connects to FastAPI backend (HTTP API)
- FastAPI backend connects to MongoDB (Motor driver)
- Android app does NOT connect directly to MongoDB

✅ **Security:**
- MongoDB credentials stay in FastAPI backend
- JWT tokens used for authentication
- No database credentials in mobile app

✅ **Offline Support:**
- SQLite stores itineraries locally
- When online, fetches from MongoDB via FastAPI
- When offline, displays from SQLite

## Troubleshooting

1. **Connection refused:**
   - Check FastAPI backend is running on port 8000
   - Verify `VITE_API_URL` in `.env` matches your setup
   - For Android emulator, use `10.0.2.2:8000`
   - For physical device, use your computer's IP address

2. **CORS errors:**
   - FastAPI backend needs CORS middleware configured
   - Allow origin: `http://localhost:3000` (web) and your app origin

3. **401 Unauthorized:**
   - Check JWT token is being sent in headers
   - Verify Firebase auth is working
   - Check token refresh endpoint

4. **Data format mismatch:**
   - Ensure FastAPI returns data in MongoDB schema format
   - Check Pydantic model serialization
   - Verify `day_plans` structure matches frontend expectations

## Next Steps

1. ✅ Create `.env` file with `VITE_API_URL=http://10.0.2.2:8000`
2. ✅ Ensure FastAPI backend has CORS enabled
3. ✅ Verify FastAPI endpoints match expected format
4. ✅ Test authentication flow
5. ✅ Test itinerary fetching
6. ✅ Test offline mode

Your Android app is now ready to connect to your FastAPI MongoDB backend! 🚀

