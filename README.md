# Spotify Music Stats Dashboard


*A Next.js + Flask application for visualizing personalized Spotify statistics*
<img alt="Dashboard" src="./preview.jpg">
## Core Features
### Personalized Music Analytics

- Top artists and tracks with dynamic time ranges
- Genre distribution visualization
- Audio feature analysis (energy, danceability, etc.)
- Library statistics and saved tracks metrics
### Interactive Data Visualizations

- Genre sunburst chart powered by @visx/hierarchy
- Audio feature comparisons
- Responsive and animated UI with Framer Motion
- Authentication & Security

### Spotify OAuth 2.0 implementation
- JWT-based session management
- Secure credential handling with HTTPOnly cookies
### User Experience

- Mobile-responsive design
- Time range selection (short-term, medium-term, long-term)
- Skeleton loading states
- Error handling with fallback retry mechanisms
## Technical Stack
### Frontend
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS with shadcn/ui components
- State Management: React Hooks + SWR for data fetching
#### Visualization Libraries:
- @visx/hierarchy for genre sunburst
- framer-motion for animations
- Image optimization with Next.js Image component
### Backend
- Framework: Flask (Python)
- Database: PostgreSQL with SQLAlchemy ORM
- Authentication: Flask-JWT-Extended
- External APIs: Spotify Web API
- Security: CORS handling, token refresh automation
## Project Structure
```
├── backend/
│   ├── app.py              # Main Flask application
│   ├── database.py         # Database connection and models
│   ├── models.py           # SQLAlchemy data models
│   └── requirements.txt    # Python dependencies
│
├── frontend/
│   ├── app/                # Next.js app directory
│   │   ├── api/            # API routes for auth and proxying
│   │   ├── dashboard/      # Main dashboard page
│   │   ├── callback/       # OAuth callback handler
│   │   └── api-docs/       # API documentation page
│   │
│   ├── components/         # React components
│   │   ├── analytics/      # Data visualization components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── TopArtists.tsx  # Artist display component
│   │   └── TopTracks.tsx   # Track display component
│   │
│   ├── lib/                # Utility functions and hooks
│   │   ├── useSession.ts   # Authentication hook
│   │   ├── useStatsData.ts # Data fetching hooks
│   │   └── utils.ts        # Helper utilities
│   │
│   └── public/             # Static assets
└── README.md
```
## API Structure
### Authentication

- `/api/auth/login`: Initiates Spotify OAuth flow
- `/api/auth/callback`: Processes OAuth callback
- `/api/auth/refresh`: Refreshes access tokens
### User Data

- `/api/user/tracks`: Gets user's top tracks
- `/api/user/artists`: Gets user's top artists
- `/api/user/recent`: Gets recently played tracks
### Statistics

- `/api/stats/audio-features`: Gets audio feature averages
- `/api/stats/genres`: Gets user's dominant genres
- `/api/stats/library`: Gets library statistics
### Documentation

- `/api/docs`: Auto-generated API documentation
## Setup Guide

### 1. Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+
- Spotify Developer Account

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```
### 3. Configure .env.local
#### Spotify
CLIENT_ID=your_spotify_client_id
CLIENT_SECRET=your_spotify_secret
REDIRECT_URI=http://localhost:3000/callback

#### Database
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=5432
DB_NAME=musictracker

### 4. Frontend Setup
```bash
cd frontend
npm install
```

### 5. Run the Application
#### Backend
```bash
flask run --port 5000
```
#### Frontend
```bash
npm run build
npm start
```