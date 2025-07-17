import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>('')

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('user_token', newToken)
  }

  function clearToken() {
    token.value = ''
    localStorage.removeItem('user_token')
  }

  return {
    token,
    setToken,
    clearToken,
  }
})
