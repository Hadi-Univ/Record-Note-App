# Record Note App

A mobile-first Vue 3 web application for capturing and tracking notes, featuring Google OAuth login.

## Features

- 📱 **Mobile-first design** – optimised for smartphone screens
- 🔐 **Google OAuth login** – sign in with your Google account (or demo mode)
- 📝 **Note history** – add, view, and delete personal notes
- 💾 **Persistent storage** – notes and session are saved in localStorage
- ✨ **Smooth animations** – list transitions and interactive feedback

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

## Project Structure

```
src/
├── assets/       # Global CSS (mobile-first variables and reset)
├── router/       # Vue Router with auth guards
├── stores/
│   ├── auth.js   # Authentication state (Pinia)
│   └── notes.js  # Notes/history state (Pinia)
└── views/
    ├── LoginView.vue  # Login page with Google OAuth button
    └── HomeView.vue   # Home page with note input and history list
```
