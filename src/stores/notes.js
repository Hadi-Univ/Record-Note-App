import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotesStore = defineStore('notes', () => {
  const notes = ref(JSON.parse(localStorage.getItem('rna_notes') || '[]'))

  function saveNotes() {
    localStorage.setItem('rna_notes', JSON.stringify(notes.value))
  }

  function addNote(text) {
    const note = {
      id: Date.now(),
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

  return { notes, addNote, deleteNote, clearAll }
})
