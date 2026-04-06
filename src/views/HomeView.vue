<template>
  <div class="home-page">
    <!-- Header -->
    <header class="app-header">
      <div class="header-left">
        <img
          :src="auth.user?.picture || defaultAvatar"
          :alt="auth.user?.name"
          class="user-avatar"
          @error="onAvatarError"
        />
        <div class="user-info">
          <p class="greeting">Good {{ timeOfDay }},</p>
          <p class="user-name">{{ auth.user?.name }}</p>
        </div>
      </div>
      <button class="logout-btn" @click="handleLogout" title="Sign out">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </header>

    <!-- New Note Input -->
    <section class="note-input-section">
      <div class="input-card">
        <textarea
          v-model="newNoteText"
          class="note-textarea"
          placeholder="What's on your mind? Tap to add a note..."
          rows="3"
          maxlength="500"
          @keydown.ctrl.enter="addNote"
        ></textarea>
        <div class="input-footer">
          <span :class="charCountClass">{{ newNoteText.length }}/500</span>
          <button
            class="add-btn"
            @click="addNote"
            :disabled="!newNoteText.trim()"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Note
          </button>
        </div>
      </div>
    </section>

    <!-- History Section -->
    <section class="history-section">
      <div class="history-header">
        <h2 class="history-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          History
          <span v-if="notesStore.notes.length > 0" class="note-count">{{ notesStore.notes.length }}</span>
        </h2>
        <button
          v-if="notesStore.notes.length > 0"
          class="clear-btn"
          @click="confirmClear"
        >
          Clear all
        </button>
      </div>

      <!-- Empty state -->
      <div v-if="notesStore.notes.length === 0" class="empty-state">
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="12" y="8" width="56" height="64" rx="6" fill="#E8F0FE" />
          <rect x="20" y="20" width="28" height="4" rx="2" fill="#DADCE0" />
          <rect x="20" y="30" width="40" height="4" rx="2" fill="#DADCE0" />
          <rect x="20" y="40" width="32" height="4" rx="2" fill="#DADCE0" />
          <rect x="20" y="50" width="20" height="4" rx="2" fill="#DADCE0" />
        </svg>
        <p class="empty-title">No notes yet</p>
        <p class="empty-subtitle">Add your first note above to get started!</p>
      </div>

      <!-- Notes List -->
      <TransitionGroup v-else name="note-list" tag="div" class="notes-list">
        <div
          v-for="note in notesStore.notes"
          :key="note.id"
          class="note-card"
        >
          <div class="note-content">
            <p class="note-text">{{ note.text }}</p>
            <time class="note-time" :datetime="note.createdAt">
              {{ formatDate(note.createdAt) }}
            </time>
          </div>
          <button class="delete-btn" @click="deleteNote(note.id)" title="Delete note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </section>

    <!-- Confirm clear dialog -->
    <Teleport to="body">
      <div v-if="showClearDialog" class="dialog-overlay" @click.self="showClearDialog = false">
        <div class="dialog">
          <h3>Clear all notes?</h3>
          <p>This action cannot be undone.</p>
          <div class="dialog-actions">
            <button class="dialog-cancel" @click="showClearDialog = false">Cancel</button>
            <button class="dialog-confirm" @click="clearAll">Clear all</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotesStore } from '@/stores/notes'

const router = useRouter()
const auth = useAuthStore()
const notesStore = useNotesStore()

const newNoteText = ref('')
const showClearDialog = ref(false)

const charCountClass = computed(() => {
  const len = newNoteText.value.length
  if (len >= 480) return 'char-count char-count--danger'
  if (len >= 400) return 'char-count char-count--warning'
  return 'char-count'
})

const defaultAvatar = computed(() => {
  // Generate an inline SVG avatar with initials as a data URI
  const name = auth.user?.name || 'User'
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='128' height='128' rx='64' fill='%234285F4'/><text x='64' y='64' dy='.35em' text-anchor='middle' font-family='sans-serif' font-size='52' font-weight='bold' fill='white'>${initials}</text></svg>`
  return `data:image/svg+xml,${svg}`
})

const timeOfDay = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
})

function onAvatarError(e) {
  e.target.src = defaultAvatar.value
}

function addNote() {
  if (!newNoteText.value.trim()) return
  notesStore.addNote(newNoteText.value)
  newNoteText.value = ''
}

function deleteNote(id) {
  notesStore.deleteNote(id)
}

function confirmClear() {
  showClearDialog.value = true
}

function clearAll() {
  notesStore.clearAll()
  showClearDialog.value = false
}

function handleLogout() {
  notesStore.reset()
  auth.logout()
  router.push({ name: 'login' })
}

function formatDate(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay === 1) return 'Yesterday'
  if (diffDay < 7) return `${diffDay} days ago`

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  max-width: 480px;
  margin: 0 auto;
}

/* Header */
.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--shadow-sm);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--color-primary-light);
}

.user-info {
  display: flex;
  flex-direction: column;
}

.greeting {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.2;
}

.user-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
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
}

.logout-btn svg {
  width: 20px;
  height: 20px;
}

.logout-btn:hover {
  color: var(--color-danger);
  background: #FEE8E6;
}

/* Note Input */
.note-input-section {
  padding: 16px;
}

.input-card {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  border: 1.5px solid var(--color-border);
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-card:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.15);
}

.note-textarea {
  width: 100%;
  padding: 14px 16px;
  border: none;
  outline: none;
  resize: none;
  font-size: 15px;
  font-family: var(--font-family);
  color: var(--color-text);
  background: transparent;
  line-height: 1.5;
}

.note-textarea::placeholder {
  color: var(--color-text-muted);
}

.input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 10px;
  border-top: 1px solid var(--color-border);
  background: #FAFAFA;
}

.char-count {
  font-size: 12px;
  color: var(--color-text-muted);
  transition: color 0.2s;
}

.char-count--warning {
  color: var(--color-warning);
}

.char-count--danger {
  color: var(--color-danger);
  font-weight: 600;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  font-family: var(--font-family);
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.add-btn svg {
  width: 16px;
  height: 16px;
}

.add-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.add-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.add-btn:disabled {
  background: var(--color-border);
  color: var(--color-text-muted);
  cursor: not-allowed;
}

/* History Section */
.history-section {
  flex: 1;
  padding: 0 16px 24px;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.history-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
}

.history-title svg {
  width: 20px;
  height: 20px;
  color: var(--color-primary);
}

.note-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.clear-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-danger);
  font-family: var(--font-family);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: background 0.2s;
}

.clear-btn:hover {
  background: #FEE8E6;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  gap: 12px;
}

.empty-state svg {
  width: 80px;
  height: 80px;
  opacity: 0.8;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
}

.empty-subtitle {
  font-size: 14px;
  color: var(--color-text-muted);
}

/* Notes list */
.notes-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.note-card {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: 14px 14px 14px 16px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border: 1px solid var(--color-border);
  transition: box-shadow 0.2s;
}

.note-card:hover {
  box-shadow: var(--shadow-md);
}

.note-content {
  flex: 1;
  min-width: 0;
}

.note-text {
  font-size: 15px;
  color: var(--color-text);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.note-time {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  transition: color 0.2s, background 0.2s;
}

.delete-btn svg {
  width: 18px;
  height: 18px;
}

.delete-btn:hover {
  color: var(--color-danger);
  background: #FEE8E6;
}

/* Note list transitions */
.note-list-enter-active,
.note-list-leave-active {
  transition: all 0.3s ease;
}

.note-list-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}

.note-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* Confirm Dialog */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 24px;
}

.dialog {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 24px;
  width: 100%;
  max-width: 320px;
  box-shadow: var(--shadow-lg);
}

.dialog h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.dialog p {
  font-size: 14px;
  color: var(--color-text-muted);
  margin-bottom: 20px;
}

.dialog-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.dialog-cancel,
.dialog-confirm {
  padding: 10px 20px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  font-family: var(--font-family);
  transition: background 0.2s;
}

.dialog-cancel {
  background: var(--color-bg);
  color: var(--color-text);
}

.dialog-cancel:hover {
  background: var(--color-border);
}

.dialog-confirm {
  background: var(--color-danger);
  color: white;
}

.dialog-confirm:hover {
  background: #C62828;
}
</style>
