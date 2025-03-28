# Spotify Music Stats Dashboard


*A Next.js + Flask application for visualizing personalized Spotify statistics*

## Features

- **Authentication**  
  - Spotify OAuth 2.0 flow
  - Session management with PostgreSQL
  - Admin role system

- **Core Analytics**  
  - Genre Sunburst Chart (`@visx/hierarchy`)
  - Track Mood Radar (react-chartjs-2)
  - Listening Timeline (vis-timeline)
  - Top Artists/Tracks with audio features

- **Technical Stack**  
  - Frontend: Next.js 14 (TypeScript), Tailwind CSS, shadcn/ui
  - Backend: Flask, SQLAlchemy, PostgreSQL
  - Visualization: D3.js, Framer Motion

## Project Structure
├── .gitignore
├── backend
│  ├── .env.local
│  ├── app.py
│  ├── database.py
│  ├── models.py
│  └── requirements.txt
├── frontend
│  ├── .env.local
│  ├── app
│  │  ├── (root)
│  │  │  └── layout.tsx
│  │  ├── api
│  │  │  ├── auth
│  │  │  │  └── [...all]
│  │  │  │    └── route.ts
│  │  │  └── proxy
│  │  │    └── route.ts
│  │  ├── dashboard
│  │  │  └── page.tsx
│  │  ├── favicon.ico
│  │  ├── globals.css
│  │  ├── home
│  │  ├── layout.tsx
│  │  ├── page.tsx
│  │  └── public
│  ├── components
│  │  ├── analytics
│  │  │  ├── GenreSunburst.tsx
│  │  │  └── GenreSunburstWrapper.tsx
│  │  ├── footer.tsx
│  │  ├── layout.tsx
│  │  ├── navbar.tsx
│  │  ├── signIn.tsx
│  │  ├── signUp.tsx
│  │  └── ui
│  │    ├── button.tsx
│  │    ├── card.tsx
│  │    ├── checkbox.tsx
│  │    ├── dialog.tsx
│  │    ├── input.tsx
│  │    ├── label.tsx
│  │    ├── sonner.tsx
│  │    ├── spinner.tsx
│  │    ├── toast.tsx
│  │    ├── toaster.tsx
│  │    └── use-toast.ts
│  ├── components.json
│  ├── eslint.config.mjs
│  ├── lib
│  │  ├── api.ts
│  │  ├── auth-client.ts
│  │  ├── auth.ts
│  │  └── utils.ts
│  ├── next-env.d.ts
│  ├── next.config.ts
│  ├── package-lock.json
│  ├── package.json
│  ├── postcss.config.mjs
│  ├── public
│  │  ├── file.svg
│  │  ├── globe.svg
│  │  ├── next.svg
│  │  ├── vercel.svg
│  │  └── window.svg
│  ├── README.md
│  ├── tsconfig.json
│  └── types
│    └── genres.ts
└── README.md


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
REDIRECT_URI=http://localhost:5000/callback

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