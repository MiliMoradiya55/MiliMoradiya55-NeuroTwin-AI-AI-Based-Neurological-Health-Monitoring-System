// src/utils/validators.ts
export const validators = {
  email: (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  },

  password: (password: string): boolean => {
    return password.length >= 6
  },

  name: (name: string): boolean => {
    return name.length >= 2
  },

  age: (age: number): boolean => {
    return age >= 1 && age <= 120
  },

  phone: (phone: string): boolean => {
    const regex = /^[0-9]{10}$/
    return regex.test(phone)
  },
}