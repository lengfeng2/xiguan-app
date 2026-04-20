import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || '')
  const users = ref(JSON.parse(localStorage.getItem('registered_users') || '[]'))

  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const username = computed(() => user.value?.username || '')

  function initUser() {
    const savedUser = localStorage.getItem('user')
    if (savedUser && token.value) {
      user.value = JSON.parse(savedUser)
    }
  }

  function register(userData) {
    const existingUser = users.value.find(u => u.username === userData.username)
    if (existingUser) {
      return { success: false, message: '用户名已存在' }
    }
    
    const newUser = {
      id: Date.now(),
      username: userData.username,
      password: userData.password,
      email: userData.email || '',
      createdAt: new Date().toISOString()
    }
    
    users.value.push(newUser)
    localStorage.setItem('registered_users', JSON.stringify(users.value))
    
    return { success: true, message: '注册成功，请登录' }
  }

  function login(credentials) {
    const foundUser = users.value.find(
      u => u.username === credentials.username && u.password === credentials.password
    )
    
    if (!foundUser) {
      return { success: false, message: '用户名或密码错误' }
    }
    
    const newToken = `token_${Date.now()}_${foundUser.id}`
    token.value = newToken
    user.value = { id: foundUser.id, username: foundUser.username, email: foundUser.email }
    
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(user.value))
    
    return { success: true, message: '登录成功' }
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    user,
    token,
    users,
    isLoggedIn,
    username,
    initUser,
    register,
    login,
    logout
  }
})