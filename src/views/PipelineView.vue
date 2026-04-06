<template>
  <div class="pipeline-view">
    <!-- Header -->
    <header class="pipeline-header">
      <div class="header-title-group">
        <h1 class="header-title">Audio Intelligence</h1>
        <p class="header-subtitle">{{ auth.user?.name }}</p>
      </div>
      <button class="logout-btn" @click="handleLogout" title="Sign out">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </header>

    <!-- Pipeline Component -->
    <AudioPipeline />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotesStore } from '@/stores/notes'
import AudioPipeline from '@/components/AudioPipeline.vue'

const router = useRouter()
const auth = useAuthStore()
const notesStore = useNotesStore()

function handleLogout() {
  notesStore.reset()
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.pipeline-view {
  min-height: 100vh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
}

.pipeline-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: var(--shadow-sm);
}

.logout-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s, background 0.2s;
  flex-shrink: 0;
}

.logout-btn svg {
  width: 20px;
  height: 20px;
}

.logout-btn:hover {
  color: var(--color-danger);
  background: #FEE8E6;
}

.header-title-group {
  flex: 1;
  min-width: 0;
}

.header-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}

.header-subtitle {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
