# Record Note App

A mobile-first Vue 3 web application for capturing notes and running an AI audio processing pipeline, featuring Google OAuth login.

## Features

- 📱 **Mobile-first design** – optimised for smartphone screens
- 🔐 **Google OAuth login** – sign in with your Google account (or demo mode)
- 📝 **Note history** – add, view, and delete personal notes
- 💾 **Persistent storage** – notes, session, and pipeline state are saved in localStorage
- ✨ **Smooth animations** – list transitions and interactive feedback
- 🎙️ **Audio Intelligence Pipeline** – Upload → Transcribe → Summarize → Visualize

## Tech Stack

- **Vue 3** (Composition API + `<script setup>`)
- **Vue Router 4** – hash-based routing with auth guards
- **Pinia** – state management for auth and notes
- **Vite 5** – fast build tool

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production build

```bash
npm run build
npm run preview
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add your domain to **Authorised JavaScript origins**
4. Copy the client ID and create a `.env.local` file:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

> Without a real client ID the app runs in **demo mode** and signs you in automatically with a placeholder account.

## Audio Intelligence Pipeline

The pipeline view (`/pipeline`) provides a full 3-step AI audio processing workflow:

| Step | Endpoint | Description |
|------|----------|-------------|
| 1 | `POST /api/v1/transcribe` | Uploads the audio file and returns a transcript |
| 2 | `POST /api/v1/summarize` | Generates a summary from the transcript |
| 3 | `POST /api/v1/visualize` | Produces topic/keyword visualizations |

### Pipeline Features

- **Persistent state** – pipeline progress is saved to `localStorage` and survives page refreshes
- **Resumable** – if a step fails or the page is reloaded mid-run, you can resume from the last completed step
- **LLM configuration** – choose between Ollama, OpenAI, Claude, or Gemini; settings are persisted across sessions
- **Job history** – completed jobs are retrieved from `GET /api/v1/history` and can be loaded back into the viewer
- **Download** – job results can be downloaded directly from the history panel

### Backend API Setup

Point the **API Base URL** setting at your backend (default: `http://localhost:8000`).
The backend must expose the following endpoints and accept a Google identity token for authentication:

```
POST /api/v1/transcribe   – multipart/form-data: file, google_token
POST /api/v1/summarize    – application/json: folder_name, file_name, provider, model?, api_key?, base_url, google_token
POST /api/v1/visualize    – application/json: folder_name, file_name, provider, model?, api_key?, base_url, google_token
GET  /api/v1/history      – Authorization: Bearer <google_token>
```

## Project Structure

```
src/
├── assets/          # Global CSS (mobile-first variables and reset)
├── components/
│   └── AudioPipeline.vue  # Audio processing pipeline component
├── router/          # Vue Router with auth guards
├── stores/
│   ├── auth.js      # Authentication state (Pinia)
│   └── notes.js     # Notes/history state (Pinia)
└── views/
    ├── LoginView.vue     # Login page with Google OAuth button
    ├── HomeView.vue      # Home page with note input and history list
    └── PipelineView.vue  # Audio Intelligence Pipeline page
```

