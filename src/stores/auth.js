import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('rna_user') || 'null'))
  const token = ref(localStorage.getItem('rna_token') || null)

  const isAuthenticated = computed(() => !!user.value && !!token.value)

  function loginWithGoogle(googleUser) {
    // googleUser comes from the Google Identity Services callback
    const profile = {
      id: googleUser.sub,
      name: googleUser.name,
      email: googleUser.email,
      picture: googleUser.picture
    }
    user.value = profile
    token.value = googleUser.credential || 'google-token'
    localStorage.setItem('rna_user', JSON.stringify(profile))
    localStorage.setItem('rna_token', token.value)
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('rna_user')
    localStorage.removeItem('rna_token')
    // Revoke Google session if available
    if (window.google && window.google.accounts) {
      window.google.accounts.id.disableAutoSelect()
    }
  }

  return { user, token, isAuthenticated, loginWithGoogle, logout }
})
