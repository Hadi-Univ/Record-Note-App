<template>
  <div class="login-page">
    <div class="login-container">
      <!-- App Logo / Icon -->
      <div class="app-icon">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" fill="#4285F4" />
          <path d="M14 16h20v2H14zm0 7h20v2H14zm0 7h12v2H14z" fill="white" />
          <circle cx="36" cy="34" r="8" fill="white" />
          <path d="M33 34l2 2 4-4" stroke="#4285F4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>

      <!-- Heading -->
      <h1 class="app-title">Record Note</h1>
      <p class="app-subtitle">Capture your thoughts, anywhere</p>

      <!-- Google Sign-In Button -->
      <div class="signin-section">
        <button class="google-btn" @click="handleGoogleSignIn" :disabled="isLoading">
          <span v-if="isLoading" class="btn-spinner"></span>
          <template v-else>
            <svg class="google-icon" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </template>
        </button>

        <!-- Error message -->
        <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
      </div>

      <!-- Demo mode notice -->
      <div class="demo-notice">
        <p>
          <strong>Demo mode:</strong> No real Google account is needed.
          Click the button above to sign in with a demo account.
        </p>
      </div>

      <!-- Footer -->
      <p class="footer-text">By continuing, you agree to our Terms of Service</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const isLoading = ref(false)
const errorMessage = ref('')

// Google OAuth Client ID - replace with your real client ID from Google Cloud Console
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

onMounted(() => {
  initGoogleSignIn()
})

function initGoogleSignIn() {
  if (!GOOGLE_CLIENT_ID) {
    // No real client ID – demo mode only
    return
  }
  if (window.google && window.google.accounts) {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false
    })
  } else {
    // Wait for GSI library to load
    window.addEventListener('load', () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false
        })
      }
    })
  }
}

function handleCredentialResponse(response) {
  isLoading.value = true
  errorMessage.value = ''
  try {
    // Decode the JWT credential to get user info
    const payload = parseJwt(response.credential)
    auth.loginWithGoogle({ ...payload, credential: response.credential })
    router.push({ name: 'home' })
  } catch (err) {
    errorMessage.value = 'Sign in failed. Please try again.'
  } finally {
    isLoading.value = false
  }
}

function parseJwt(token) {
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  )
  return JSON.parse(jsonPayload)
}

function handleGoogleSignIn() {
  isLoading.value = true
  errorMessage.value = ''

  if (GOOGLE_CLIENT_ID && window.google && window.google.accounts) {
    // Trigger the real Google Sign-In popup
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback: use demo sign-in
        signInWithDemo()
      }
    })
  } else {
    // Demo mode: simulate sign-in after a short delay
    signInWithDemo()
  }
}

function signInWithDemo() {
  setTimeout(() => {
    const demoUser = {
      sub: 'demo-user-001',
      name: 'Demo User',
      email: 'demo@example.com',
      picture: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='128' height='128' rx='64' fill='%234285F4'/><text x='64' y='64' dy='.35em' text-anchor='middle' font-family='sans-serif' font-size='52' font-weight='bold' fill='white'>DU</text></svg>`,
      credential: 'demo-token'
    }
    auth.loginWithGoogle(demoUser)
    isLoading.value = false
    router.push({ name: 'home' })
  }, 800)
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #E8F0FE 0%, #F8F9FA 50%, #E8F0FE 100%);
  padding: 24px 16px;
}

.login-container {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 40px 24px;
  width: 100%;
  max-width: 380px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.app-icon {
  width: 72px;
  height: 72px;
  margin-bottom: 4px;
}

.app-icon svg {
  width: 100%;
  height: 100%;
}

.app-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.5px;
}

.app-subtitle {
  font-size: 15px;
  color: var(--color-text-muted);
  margin-bottom: 12px;
}

.signin-section {
  width: 100%;
  margin-top: 8px;
}

.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 14px 20px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text);
  font-family: var(--font-family);
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  min-height: 52px;
}

.google-btn:hover:not(:disabled) {
  background: #F8F9FA;
  box-shadow: var(--shadow-sm);
}

.google-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.google-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.google-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}

.btn-spinner {
  width: 22px;
  height: 22px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-msg {
  margin-top: 10px;
  font-size: 14px;
  color: var(--color-danger);
}

.demo-notice {
  background: var(--color-primary-light);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  width: 100%;
  text-align: left;
}

.demo-notice p {
  font-size: 13px;
  color: var(--color-primary-dark);
  line-height: 1.5;
}

.footer-text {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 8px;
}
</style>
