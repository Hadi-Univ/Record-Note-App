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
      <div class="header-right">
        <button class="pipeline-btn" @click="router.push({ name: 'pipeline' })" title="Audio Pipeline">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
        </button>
        <button class="logout-btn" @click="handleLogout" title="Sign out">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </header>

    <!-- New Note Input -->
    <section class="note-input-section">
      <!-- Tabs -->
      <div class="input-tabs">
        <button
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'text' }"
          @click="activeTab = 'text'"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
          </svg>
          Text Note
        </button>
        <button
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === 'audio' }"
          @click="activeTab = 'audio'"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
          Upload Audio
        </button>
      </div>

      <!-- Text input panel -->
      <div v-if="activeTab === 'text'" class="input-card">
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

      <!-- Audio upload panel -->
      <div v-else class="input-card">
        <div
          class="audio-drop-zone"
          :class="{ 'audio-drop-zone--dragging': isDragging, 'audio-drop-zone--selected': audioFile }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onAudioDrop"
          @click="triggerFileInput"
        >
          <input
            ref="fileInputRef"
            type="file"
            accept="audio/*"
            class="file-input-hidden"
            @change="onFileChange"
          />
          <template v-if="!audioFile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="drop-icon">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p class="drop-label">Drop an audio file here</p>
            <p class="drop-sublabel">or click to browse &nbsp;·&nbsp; MP3, WAV, M4A, OGG…</p>
          </template>
          <template v-else>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="drop-icon drop-icon--selected">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
            </svg>
            <p class="drop-label drop-label--selected">{{ audioFile.name }}</p>
            <p class="drop-sublabel">{{ formatFileSize(audioFile.size) }} &nbsp;·&nbsp; click to change</p>
          </template>
        </div>

        <p v-if="audioError" class="audio-error">{{ audioError }}</p>

        <div class="input-footer">
          <button v-if="audioFile" class="clear-audio-btn" @click.stop="clearAudioFile">
            Remove
          </button>
          <button
            class="add-btn"
            :class="{ 'add-btn--full': !audioFile }"
            @click="addAudioNote"
            :disabled="!audioFile"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Save Audio Note
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
          :class="{ 'note-card--audio': note.type === 'audio' }"
        >
          <div class="note-content">
            <!-- Text note -->
            <template v-if="note.type !== 'audio'">
              <p class="note-text">{{ note.text }}</p>
            </template>
            <!-- Audio note -->
            <template v-else>
              <div class="audio-note-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="audio-note-icon">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                </svg>
                <span class="audio-note-name">{{ note.fileName }}</span>
                <span class="audio-note-size">{{ formatFileSize(note.fileSize) }}</span>
              </div>
              <audio
                :src="note.audioSrc"
                controls
                class="audio-player"
                preload="metadata"
              ></audio>
            </template>
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

// ── Text note state ──────────────────────────────────────────────────────────
const newNoteText = ref('')

const charCountClass = computed(() => {
  const len = newNoteText.value.length
  if (len >= 480) return 'char-count char-count--danger'
  if (len >= 400) return 'char-count char-count--warning'
  return 'char-count'
})

// ── Tab state ────────────────────────────────────────────────────────────────
const activeTab = ref('text')

// ── Audio upload state ───────────────────────────────────────────────────────
const MAX_AUDIO_BYTES = 10 * 1024 * 1024 // 10 MB

const fileInputRef = ref(null)
const audioFile = ref(null)
const audioError = ref('')
const isDragging = ref(false)

function triggerFileInput() {
  fileInputRef.value?.click()
}

function validateAudioFile(file) {
  if (!file) return 'No file selected.'
  if (!file.type.startsWith('audio/')) return 'Please select a valid audio file (MP3, WAV, M4A, OGG, etc.).'
  if (file.size > MAX_AUDIO_BYTES) return `File is too large. Maximum size is ${formatFileSize(MAX_AUDIO_BYTES)}.`
  return null
}

function onFileChange(e) {
  const file = e.target.files?.[0]
  audioError.value = ''
  const err = validateAudioFile(file)
  if (err) { audioError.value = err; return }
  audioFile.value = file
}

function onAudioDrop(e) {
  isDragging.value = false
  audioError.value = ''
  const file = e.dataTransfer?.files?.[0]
  const err = validateAudioFile(file)
  if (err) { audioError.value = err; return }
  audioFile.value = file
}

function clearAudioFile() {
  audioFile.value = null
  audioError.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function addAudioNote() {
  if (!audioFile.value) return
  audioError.value = ''
  const file = audioFile.value
  const fileName = file.name
  const fileSize = file.size
  const reader = new FileReader()
  reader.onload = (e) => {
    notesStore.addAudioNote({
      audioSrc: e.target.result,
      fileName,
      fileSize
    })
    clearAudioFile()
  }
  reader.onerror = () => {
    audioError.value = 'Failed to read the audio file. Please try again.'
  }
  reader.readAsDataURL(file)
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Avatar ───────────────────────────────────────────────────────────────────
const defaultAvatar = computed(() => {
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

// ── Note actions ─────────────────────────────────────────────────────────────
const showClearDialog = ref(false)

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

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pipeline-btn {
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

.pipeline-btn svg {
  width: 20px;
  height: 20px;
}

.pipeline-btn:hover {
  color: var(--color-primary);
  background: var(--color-primary-light);
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

/* Input tabs */
.input-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 12px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text-muted);
  font-size: 14px;
  font-weight: 500;
  font-family: var(--font-family);
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}

.tab-btn svg {
  width: 15px;
  height: 15px;
}

.tab-btn--active {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
}

/* Audio drop zone */
.audio-drop-zone {
  min-height: 130px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 24px 16px;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.audio-drop-zone--dragging {
  background: var(--color-primary-light);
}

.audio-drop-zone--selected {
  background: var(--color-primary-light);
}

.drop-icon {
  width: 36px;
  height: 36px;
  color: var(--color-text-muted);
}

.drop-icon--selected {
  color: var(--color-primary);
}

.drop-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  text-align: center;
  word-break: break-all;
}

.drop-label--selected {
  color: var(--color-primary-dark);
}

.drop-sublabel {
  font-size: 12px;
  color: var(--color-text-muted);
  text-align: center;
}

.file-input-hidden {
  display: none;
}

.audio-error {
  font-size: 13px;
  color: var(--color-danger);
  padding: 4px 14px 0;
}

.clear-audio-btn {
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

.clear-audio-btn:hover {
  background: #FEE8E6;
}

.add-btn--full {
  margin-left: auto;
}

/* Audio note card */
.note-card--audio {
  flex-direction: column;
  align-items: stretch;
  gap: 0;
}

.note-card--audio .note-content {
  width: 100%;
}

.note-card--audio .delete-btn {
  align-self: flex-end;
  margin-top: 4px;
}

.audio-note-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.audio-note-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: var(--color-primary);
}

.audio-note-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.audio-note-size {
  font-size: 12px;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.audio-player {
  width: 100%;
  border-radius: var(--radius-sm);
  outline: none;
}
</style>
