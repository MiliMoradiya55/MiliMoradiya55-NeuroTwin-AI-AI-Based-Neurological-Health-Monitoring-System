// src/utils/storage.ts
const TOKEN_KEY = 'neurotwin_token'
const USER_KEY = 'neurotwin_user'
const THEME_KEY = 'neurotwin_theme'

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export const getUser = <T>(): T | null => {
  const user = localStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}

export const setUser = <T>(user: T): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const getTheme = (): string => {
  return localStorage.getItem(THEME_KEY) || 'light'
}

export const setTheme = (theme: string): void => {
  localStorage.setItem(THEME_KEY, theme)
}