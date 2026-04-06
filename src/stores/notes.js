import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

export const useNotesStore = defineStore('notes', () => {
  const notes = ref([])

  function storageKey() {
    const auth = useAuthStore()
    const userId = auth.user?.id || 'guest'
    return `rna_notes_${userId}`
  }

  function loadNotes() {
    notes.value = JSON.parse(localStorage.getItem(storageKey()) || '[]')
  }

  function saveNotes() {
    localStorage.setItem(storageKey(), JSON.stringify(notes.value))
  }

  // Reset in-memory notes without writing to storage (used on logout)
  function reset() {
    notes.value = []
  }

  // Load notes on store init (handles page reload when user is already logged in)
  loadNotes()

  function addNote(text) {
    const note = {
      id: crypto.randomUUID(),
      text: text.trim(),
      createdAt: new Date().toISOString()
    }
    notes.value.unshift(note)
    saveNotes()
    return note
  }

  function deleteNote(id) {
    const index = notes.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      notes.value.splice(index, 1)
      saveNotes()
    }
  }

  function clearAll() {
    notes.value = []
    saveNotes()
  }

  return { notes, loadNotes, reset, addNote, deleteNote, clearAll }
})
