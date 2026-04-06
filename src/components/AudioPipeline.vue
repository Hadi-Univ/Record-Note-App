<template>
  <div class="pipeline-page">
    <!-- Settings Panel -->
    <section class="pipeline-section">
      <h2 class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="section-icon">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
        </svg>
        LLM Settings
      </h2>
      <div class="settings-grid">
        <div class="form-group">
          <label class="form-label">Provider</label>
          <select v-model="settings.provider" class="form-select">
            <option value="ollama">Ollama (Local)</option>
            <option value="openai">OpenAI (ChatGPT)</option>
            <option value="claude">Claude</option>
            <option value="gemini">Gemini</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Model Name <span class="form-hint">(optional)</span></label>
          <input v-model="settings.model" type="text" placeholder="e.g. gpt-4o" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">API Key <span class="form-hint">(optional)</span></label>
          <input v-model="settings.apiKey" type="password" placeholder="Leave blank for local" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">API Base URL</label>
          <input v-model="settings.apiUrl" type="text" class="form-input" />
        </div>
      </div>
    </section>

    <!-- Pipeline Section -->
    <section class="pipeline-section">
      <div class="section-header">
        <h2 class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="section-icon">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
          Audio Pipeline
        </h2>
        <div class="header-controls">
          <span :class="['badge', statusBadgeClass]">{{ statusBadgeText }}</span>
          <button v-if="hasProgress" class="link-btn link-btn--danger" @click="clearState">
            Clear progress
          </button>
        </div>
      </div>
      <p class="section-subtitle">Upload → Transcribe → Summarize → Visualize</p>

      <!-- File Upload -->
      <div
        v-if="pState.currentStep === 1"
        class="upload-zone"
        :class="{ 'upload-zone--dragging': isDragging }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onFileDrop"
        @click="triggerFileInput"
      >
        <input ref="fileInputRef" type="file" accept="audio/*" class="file-input-hidden" @change="onFileChange" />
        <template v-if="!audioFile">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="upload-icon">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p class="upload-label">Drop an audio file or click to browse</p>
          <p class="upload-sublabel">MP3, WAV, M4A, OGG, FLAC…</p>
        </template>
        <template v-else>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="upload-icon upload-icon--selected">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
          <p class="upload-label upload-label--selected">{{ audioFile.name }}</p>
          <p class="upload-sublabel">{{ formatFileSize(audioFile.size) }} · click to change</p>
        </template>
      </div>

      <!-- Active job folder indicator -->
      <div v-else class="folder-banner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="folder-icon">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        </svg>
        <div class="folder-info">
          <span class="folder-label">Current job folder</span>
          <span class="folder-name">{{ pState.folderName }}</span>
        </div>
      </div>

      <p v-if="uploadError" class="error-inline">{{ uploadError }}</p>

      <!-- Step Actions -->
      <div class="action-row">
        <template v-if="!auth.isAuthenticated">
          <button disabled class="btn btn--primary btn--disabled">Sign in to Start</button>
        </template>
        <template v-else-if="pState.status !== 'running'">
          <button
            v-if="pState.currentStep === 1 || pState.currentStep === 4"
            class="btn btn--primary"
            @click="startPipeline"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="btn-icon">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            {{ pState.currentStep === 4 ? 'Start new job' : 'Start pipeline' }}
          </button>
          <template v-if="pState.currentStep > 1 && pState.currentStep <= 3">
            <button class="btn btn--warning" @click="executeFromCurrentStep(false)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="btn-icon">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Resume pipeline
            </button>
            <button class="btn btn--secondary" @click="executeFromCurrentStep(true)">
              Run step {{ pState.currentStep }} only
            </button>
          </template>
        </template>
        <template v-else>
          <button disabled class="btn btn--primary btn--disabled">
            <span class="spinner"></span>
            Running step {{ pState.currentStep }}…
          </button>
        </template>
      </div>

      <!-- Error message -->
      <div v-if="pState.lastError" class="error-banner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="error-icon">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {{ pState.lastError }}
      </div>

      <!-- Stepper -->
      <div v-if="hasProgress" class="stepper">
        <div
          v-for="step in steps"
          :key="step.number"
          :class="['step', stepClass(step.number)]"
        >
          <div class="step-circle">
            <svg v-if="pState.currentStep > step.number" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="step-check">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span v-else class="step-num">{{ step.number }}</span>
          </div>
          <div class="step-label">{{ step.label }}</div>
          <div v-if="step.number < steps.length" class="step-line"></div>
        </div>
      </div>

      <!-- Results -->
      <div v-if="pState.results.transcription" class="result-card">
        <h3 class="result-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="result-icon">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          Transcription
        </h3>
        <div class="result-body">
          <p class="result-text">{{ pState.results.transcription.text || pState.results.transcription.transcript }}</p>
          <div v-if="pState.results.transcription.language" class="result-meta">
            Language: <strong>{{ pState.results.transcription.language }}</strong>
          </div>
          <div v-if="pState.results.transcription.duration" class="result-meta">
            Duration: <strong>{{ Math.round(pState.results.transcription.duration) }}s</strong>
          </div>
        </div>
      </div>

      <div v-if="pState.results.summary" class="result-card">
        <h3 class="result-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="result-icon">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          Summary
        </h3>
        <div class="result-body">
          <p class="result-text">{{ pState.results.summary.summary || pState.results.summary.text }}</p>
          <div v-if="pState.results.summary.key_points && pState.results.summary.key_points.length" class="key-points">
            <p class="key-points-label">Key points:</p>
            <ul class="key-points-list">
              <li v-for="(point, i) in pState.results.summary.key_points" :key="i">{{ point }}</li>
            </ul>
          </div>
        </div>
      </div>

      <div v-if="pState.results.visualization" class="result-card">
        <h3 class="result-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="result-icon">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Visualization
        </h3>
        <div class="result-body">
          <div v-if="pState.results.visualization.topics && pState.results.visualization.topics.length" class="topics-list">
            <div
              v-for="(topic, i) in pState.results.visualization.topics"
              :key="i"
              class="topic-item"
            >
              <div class="topic-header">
                <span class="topic-label">{{ topic.label || topic.name || topic }}</span>
                <span v-if="topic.score != null" class="topic-score">{{ Math.round(topic.score * 100) }}%</span>
              </div>
              <div v-if="topic.score != null" class="topic-bar-track">
                <div class="topic-bar-fill" :style="{ width: `${Math.round(topic.score * 100)}%` }"></div>
              </div>
            </div>
          </div>
          <div v-else-if="pState.results.visualization.html" class="viz-html">
            <pre class="result-text">{{ pState.results.visualization.html }}</pre>
          </div>
          <pre v-else class="result-text">{{ JSON.stringify(pState.results.visualization, null, 2) }}</pre>
        </div>
      </div>
    </section>

    <!-- History Section -->
    <section class="pipeline-section">
      <div class="section-header">
        <h2 class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="section-icon">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Job History
          <span v-if="history.length > 0" class="badge-count">{{ history.length }}</span>
        </h2>
        <button class="link-btn" :disabled="isFetchingHistory" @click="fetchHistory">
          <span v-if="isFetchingHistory" class="spinner spinner--sm"></span>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="link-icon">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
          </svg>
          Refresh
        </button>
      </div>

      <p v-if="historyError" class="error-inline">{{ historyError }}</p>

      <div v-if="history.length === 0 && !isFetchingHistory" class="empty-state">
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="12" y="8" width="56" height="64" rx="6" fill="#E8F0FE" />
          <rect x="20" y="20" width="28" height="4" rx="2" fill="#DADCE0" />
          <rect x="20" y="30" width="40" height="4" rx="2" fill="#DADCE0" />
          <rect x="20" y="40" width="32" height="4" rx="2" fill="#DADCE0" />
        </svg>
        <p class="empty-title">No history yet</p>
        <p class="empty-subtitle">Completed pipeline jobs will appear here.</p>
      </div>

      <div v-else class="history-list">
        <div v-for="job in history" :key="job.folder_name || job.id" class="history-card">
          <div class="history-card-header" @click="toggleJob(job)">
            <div class="history-card-info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="history-icon">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
              <div>
                <p class="history-folder">{{ job.folder_name || job.id }}</p>
                <p v-if="job.file_name" class="history-file">{{ job.file_name }}</p>
                <time v-if="job.created_at" class="history-time">{{ formatDate(job.created_at) }}</time>
              </div>
            </div>
            <svg
              :class="['chevron', { 'chevron--open': expandedJobs.has(job.folder_name || job.id) }]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          <div v-if="expandedJobs.has(job.folder_name || job.id)" class="history-card-body">
            <div v-if="job.transcription || job.transcript" class="history-result">
              <p class="history-result-label">Transcription</p>
              <p class="history-result-text">{{ job.transcription || job.transcript }}</p>
            </div>
            <div v-if="job.summary" class="history-result">
              <p class="history-result-label">Summary</p>
              <p class="history-result-text">{{ job.summary }}</p>
            </div>
            <div class="history-actions">
              <button
                v-if="job.download_url || job.transcription_url"
                class="btn btn--sm btn--secondary"
                @click.stop="downloadResult(job)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download
              </button>
              <button class="btn btn--sm btn--primary" @click.stop="loadJobIntoState(job)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                </svg>
                Load job
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

// ── Constants ─────────────────────────────────────────────────────────────────
const STATE_KEY = 'audio_pipeline_state_v2'
const SETTINGS_KEY = 'audio_pipeline_settings_v1'

const steps = [
  { number: 1, label: 'Transcribe' },
  { number: 2, label: 'Summarize' },
  { number: 3, label: 'Visualize' }
]

// ── Reactive State ────────────────────────────────────────────────────────────
const settings = reactive({
  provider: 'ollama',
  model: '',
  apiKey: '',
  apiUrl: 'http://localhost:8000'
})

const pState = reactive({
  currentStep: 1,
  status: 'idle',
  folderName: '',
  fileName: '',
  results: {
    transcription: null,
    summary: null,
    visualization: null
  },
  lastError: ''
})

const fileInputRef = ref(null)
const audioFile = ref(null)
const uploadError = ref('')
const isDragging = ref(false)
const history = ref([])
const isFetchingHistory = ref(false)
const historyError = ref('')
const expandedJobs = ref(new Set())

// ── Computed ──────────────────────────────────────────────────────────────────
const hasProgress = computed(() => {
  return !!(pState.folderName || pState.currentStep !== 1 || pState.status !== 'idle')
})

const baseUrl = computed(() => {
  const url = settings.apiUrl.trim()
  return url.endsWith('/') ? url.slice(0, -1) : url
})

const statusBadgeText = computed(() => pState.status.toUpperCase())
const statusBadgeClass = computed(() => {
  if (pState.status === 'running') return 'badge--running'
  if (pState.status === 'error') return 'badge--error'
  if (pState.status === 'done') return 'badge--done'
  return 'badge--idle'
})

// ── LocalStorage Persistence ──────────────────────────────────────────────────
watch(pState, (newState) => {
  localStorage.setItem(STATE_KEY, JSON.stringify(newState))
}, { deep: true })

watch(settings, (newSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings))
}, { deep: true })

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  // Restore pipeline state
  const savedState = localStorage.getItem(STATE_KEY)
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState)
      // If the app reloaded while a step was running, mark it as an error so the
      // user can resume rather than being stuck in a perpetual "running" state.
      if (parsed.status === 'running') {
        parsed.status = 'error'
        parsed.lastError = parsed.lastError || 'Process interrupted (page refreshed). You can resume.'
      }
      Object.assign(pState, parsed)
    } catch {
      // ignore malformed saved state
    }
  }

  // Restore settings
  const savedSettings = localStorage.getItem(SETTINGS_KEY)
  if (savedSettings) {
    try {
      Object.assign(settings, JSON.parse(savedSettings))
    } catch {
      // ignore malformed saved settings
    }
  }

  // Auto-fetch history when the user is already authenticated
  if (auth.isAuthenticated) {
    fetchHistory()
  }
})

// ── File Handling ─────────────────────────────────────────────────────────────
function triggerFileInput() {
  fileInputRef.value?.click()
}

function onFileChange(e) {
  const file = e.target.files?.[0]
  uploadError.value = ''
  const err = validateAudioFile(file)
  if (err) {
    uploadError.value = err
    return
  }
  audioFile.value = file
}

function onFileDrop(e) {
  isDragging.value = false
  uploadError.value = ''
  const file = e.dataTransfer?.files?.[0]
  const err = validateAudioFile(file)
  if (err) {
    uploadError.value = err
    return
  }
  audioFile.value = file
}

function validateAudioFile(file) {
  if (!file) return 'No file selected.'
  if (!file.type.startsWith('audio/')) {
    return 'Please select a valid audio file (MP3, WAV, M4A, OGG, etc.).'
  }
  const maxBytes = 100 * 1024 * 1024 // 100 MB
  if (file.size > maxBytes) return `File is too large. Maximum size is ${formatFileSize(maxBytes)}.`
  return null
}

// ── Pipeline State Management ─────────────────────────────────────────────────
function clearState() {
  Object.assign(pState, {
    currentStep: 1,
    status: 'idle',
    folderName: '',
    fileName: '',
    results: { transcription: null, summary: null, visualization: null },
    lastError: ''
  })
  audioFile.value = null
  uploadError.value = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function stepClass(stepNumber) {
  if (pState.currentStep > stepNumber) return 'step--done'
  if (pState.currentStep === stepNumber) {
    return pState.status === 'running' ? 'step--active step--running' : 'step--active'
  }
  return 'step--pending'
}

// ── Pipeline Execution ────────────────────────────────────────────────────────
async function startPipeline() {
  if (pState.currentStep === 4) clearState()
  uploadError.value = ''

  if (!audioFile.value) {
    uploadError.value = 'Please upload an audio file first.'
    return
  }
  await executeFromCurrentStep(false)
}

async function executeFromCurrentStep(stopAfterOneStep = false) {
  pState.lastError = ''
  try {
    if (pState.currentStep === 1) {
      await runStep1Transcribe()
      if (stopAfterOneStep) return
    }
    if (pState.currentStep === 2) {
      await runStep2Summarize()
      if (stopAfterOneStep) return
    }
    if (pState.currentStep === 3) {
      await runStep3Visualize()
      if (stopAfterOneStep) return
    }
    if (pState.currentStep === 4) {
      pState.status = 'done'
      fetchHistory()
    }
  } catch (err) {
    pState.status = 'error'
    pState.lastError = err?.message || String(err)
  }
}

// ── API Steps ─────────────────────────────────────────────────────────────────
async function runStep1Transcribe() {
  pState.status = 'running'

  const formData = new FormData()
  formData.append('file', audioFile.value)

  const res = await fetch(`${baseUrl.value}/api/v1/transcribe`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.token || ''}`
    },
    body: formData
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || data.error || `Transcription failed (${res.status}).`)

  pState.results.transcription = data
  pState.folderName = data.folder_name || pState.folderName
  pState.fileName = data.file_name || audioFile.value?.name || pState.fileName
  pState.currentStep = 2
  pState.status = 'idle'
}

async function runStep2Summarize() {
  pState.status = 'running'

  const res = await fetch(`${baseUrl.value}/api/v1/summarize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.token || ''}`
    },
    body: JSON.stringify({
      folder_name: pState.folderName,
      file_name: pState.fileName,
      provider: settings.provider,
      model: settings.model || undefined,
      api_key: settings.apiKey || undefined,
      base_url: baseUrl.value,
      google_token: auth.token || ''
    })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || data.error || `Summarization failed (${res.status}).`)

  pState.results.summary = data
  pState.currentStep = 3
  pState.status = 'idle'
}

async function runStep3Visualize() {
  pState.status = 'running'

  const res = await fetch(`${baseUrl.value}/api/v1/visualize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.token || ''}`
    },
    body: JSON.stringify({
      folder_name: pState.folderName,
      file_name: pState.fileName,
      provider: settings.provider,
      model: settings.model || undefined,
      api_key: settings.apiKey || undefined,
      base_url: baseUrl.value,
      google_token: auth.token || ''
    })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || data.error || `Visualization failed (${res.status}).`)

  pState.results.visualization = data
  pState.currentStep = 4
  pState.status = 'done'
}

// ── History ───────────────────────────────────────────────────────────────────
async function fetchHistory() {
  if (!auth.isAuthenticated) return
  isFetchingHistory.value = true
  historyError.value = ''

  try {
    const res = await fetch(`${baseUrl.value}/api/v1/history`, {
      headers: {
        Authorization: `Bearer ${auth.token || ''}`
      }
    })
    const data = await res.json().catch(() => [])
    if (!res.ok) throw new Error(data.detail || data.error || `Failed to fetch history (${res.status}).`)
    history.value = Array.isArray(data) ? data : (data.jobs || data.items || [])
  } catch (err) {
    historyError.value = err.message || 'Could not load history.'
  } finally {
    isFetchingHistory.value = false
  }
}

function toggleJob(job) {
  const key = job.folder_name || job.id
  const s = new Set(expandedJobs.value)
  if (s.has(key)) {
    s.delete(key)
  } else {
    s.add(key)
  }
  expandedJobs.value = s
}

function loadJobIntoState(job) {
  const transcriptionText = job.transcription || job.transcript
  const summaryText = job.summary?.summary || job.summary?.text || (typeof job.summary === 'string' ? job.summary : null)
  Object.assign(pState, {
    currentStep: 4,
    status: 'done',
    folderName: job.folder_name || job.id || '',
    fileName: job.file_name || '',
    results: {
      transcription: transcriptionText ? { text: transcriptionText } : null,
      summary: summaryText ? { summary: summaryText } : null,
      visualization: job.visualization || null
    },
    lastError: ''
  })
}

function downloadResult(job) {
  const url = job.download_url || job.transcription_url
  if (!url) return
  const fullUrl = url.startsWith('http') ? url : `${baseUrl.value}${url}`
  const link = document.createElement('a')
  link.href = fullUrl
  link.download = `${job.folder_name || 'result'}.json`
  link.click()
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
.pipeline-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
}

.pipeline-section {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  border: 1.5px solid var(--color-border);
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.section-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  width: 18px;
  height: 18px;
  color: var(--color-primary);
  flex-shrink: 0;
}

.section-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: -8px;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

/* Badge */
.badge {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
  letter-spacing: 0.05em;
}
.badge--idle   { background: #F1F3F4; color: var(--color-text-muted); }
.badge--running { background: #E8F0FE; color: var(--color-primary-dark); }
.badge--error  { background: #FCE8E6; color: var(--color-danger); }
.badge--done   { background: #E6F4EA; color: #1E8E3E; }

.badge-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 10px;
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
}

/* Settings Grid */
.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 480px) {
  .settings-grid { grid-template-columns: 1fr; }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
}

.form-hint {
  font-weight: 400;
  font-size: 11px;
}

.form-input,
.form-select {
  width: 100%;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 9px 12px;
  font-size: 14px;
  font-family: var(--font-family);
  color: var(--color-text);
  background: var(--color-surface);
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}

.form-input:focus,
.form-select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.15);
}

/* Upload Zone */
.upload-zone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: 28px 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-zone:hover,
.upload-zone--dragging {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.upload-icon {
  width: 36px;
  height: 36px;
  color: var(--color-text-muted);
}

.upload-icon--selected { color: var(--color-primary); }

.upload-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.upload-label--selected { color: var(--color-primary-dark); }

.upload-sublabel {
  font-size: 12px;
  color: var(--color-text-muted);
}

.file-input-hidden { display: none; }

/* Folder Banner */
.folder-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #E6F4EA;
  border: 1.5px solid #CEEAD6;
  border-radius: var(--radius-sm);
  padding: 12px 14px;
}

.folder-icon {
  width: 20px;
  height: 20px;
  color: #1E8E3E;
  flex-shrink: 0;
}

.folder-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.folder-label {
  font-size: 11px;
  font-weight: 600;
  color: #1E8E3E;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.folder-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  word-break: break-all;
}

/* Action Row */
.action-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-family);
  cursor: pointer;
  border: none;
  transition: background 0.2s, transform 0.1s, opacity 0.2s;
  flex: 1;
  min-width: 140px;
}

.btn:active:not(:disabled) { transform: scale(0.97); }

.btn--primary { background: var(--color-primary); color: #fff; }
.btn--primary:hover:not(:disabled) { background: var(--color-primary-dark); }

.btn--warning { background: var(--color-warning); color: #1a1a1a; }
.btn--warning:hover:not(:disabled) { background: #e8ad00; }

.btn--secondary { background: #F1F3F4; color: var(--color-text); }
.btn--secondary:hover:not(:disabled) { background: var(--color-border); }

.btn--disabled,
.btn:disabled { opacity: 0.55; cursor: not-allowed; }

.btn--sm {
  padding: 7px 12px;
  font-size: 13px;
  flex: none;
  min-width: unset;
}

.btn-icon { width: 16px; height: 16px; flex-shrink: 0; }

.link-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  font-family: var(--font-family);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
  transition: color 0.2s;
}

.link-btn:hover:not(:disabled) {
  color: var(--color-primary-dark);
  text-decoration: underline;
}

.link-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.link-btn--danger { color: var(--color-danger); }
.link-btn--danger:hover { color: #c62828; }

.link-icon { width: 14px; height: 14px; }

/* Spinner */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

.spinner--sm {
  width: 14px;
  height: 14px;
  border-color: rgba(66, 133, 244, 0.3);
  border-top-color: var(--color-primary);
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Stepper */
.stepper {
  display: flex;
  align-items: flex-start;
  margin-top: 4px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
}

.step-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  transition: all 0.3s;
  position: relative;
  z-index: 1;
}

.step-check { width: 16px; height: 16px; }
.step-num { font-size: 13px; font-weight: 700; }

.step-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-align: center;
  margin-top: 6px;
}

.step-line {
  position: absolute;
  top: 18px;
  left: 50%;
  right: -50%;
  height: 2px;
  background: var(--color-border);
  z-index: 0;
}

.step--done .step-circle { background: #E6F4EA; border-color: #1E8E3E; color: #1E8E3E; }
.step--done .step-label  { color: #1E8E3E; }
.step--done .step-line   { background: #1E8E3E; }

.step--active .step-circle {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
}
.step--active .step-label { color: var(--color-primary); }

.step--running .step-circle { animation: pulse 1.2s ease-in-out infinite; }

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(66, 133, 244, 0.4); }
  50%       { box-shadow: 0 0 0 6px rgba(66, 133, 244, 0); }
}

/* Error banners */
.error-banner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #FCE8E6;
  border: 1.5px solid #F5C6C3;
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  font-size: 14px;
  color: var(--color-danger);
  font-weight: 500;
}

.error-icon { width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }

.error-inline { font-size: 13px; color: var(--color-danger); margin-top: -4px; }

/* Result Cards */
.result-card {
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.result-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
  padding: 10px 14px;
  background: #F8F9FA;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 6px;
}

.result-icon { width: 15px; height: 15px; color: var(--color-primary); flex-shrink: 0; }

.result-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-text {
  font-size: 14px;
  color: var(--color-text);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.result-meta { font-size: 12px; color: var(--color-text-muted); }

.key-points-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}

.key-points-list {
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.key-points-list li { font-size: 13px; color: var(--color-text); line-height: 1.5; }

.topics-list { display: flex; flex-direction: column; gap: 10px; }

.topic-item { display: flex; flex-direction: column; gap: 4px; }

.topic-header { display: flex; justify-content: space-between; align-items: center; }

.topic-label { font-size: 13px; font-weight: 600; color: var(--color-text); }

.topic-score { font-size: 12px; color: var(--color-text-muted); }

.topic-bar-track {
  height: 6px;
  background: #F1F3F4;
  border-radius: 3px;
  overflow: hidden;
}

.topic-bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 3px;
  transition: width 0.6s ease;
}

.viz-html { font-size: 14px; color: var(--color-text); line-height: 1.6; }

/* History */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 0 8px;
  text-align: center;
}

.empty-title { font-size: 15px; font-weight: 600; color: var(--color-text); }

.empty-subtitle { font-size: 13px; color: var(--color-text-muted); }

.history-list { display: flex; flex-direction: column; gap: 10px; }

.history-card {
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.history-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  cursor: pointer;
  background: #F8F9FA;
  transition: background 0.2s;
}

.history-card-header:hover { background: var(--color-primary-light); }

.history-card-info {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.history-icon {
  width: 18px;
  height: 18px;
  color: var(--color-primary);
  flex-shrink: 0;
  margin-top: 2px;
}

.history-folder {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  word-break: break-all;
}

.history-file { font-size: 12px; color: var(--color-text-muted); margin-top: 1px; }

.history-time { display: block; font-size: 11px; color: var(--color-text-muted); margin-top: 2px; }

.chevron {
  width: 18px;
  height: 18px;
  color: var(--color-text-muted);
  flex-shrink: 0;
  transition: transform 0.2s;
}

.chevron--open { transform: rotate(180deg); }

.history-card-body {
  padding: 14px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-result { display: flex; flex-direction: column; gap: 4px; }

.history-result-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.history-result-text {
  font-size: 13px;
  color: var(--color-text);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.history-actions { display: flex; gap: 8px; flex-wrap: wrap; }
</style>
