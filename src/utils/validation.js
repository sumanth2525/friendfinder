// Validation utility functions

// Validate phone number format (US format: (XXX) XXX-XXXX)
export const validatePhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length === 10
}

// Validate email format
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate password strength
export const validatePassword = (password) => {
  if (!password) return { valid: false, message: 'Password is required' }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' }
  }
  if (!/[A-Za-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' }
  }
  return { valid: true, message: '' }
}

// Validate name (must have first and last name)
export const validateName = (name) => {
  if (!name || name.trim().length === 0) {
    return { valid: false, message: 'Name is required' }
  }
  const nameParts = name.trim().split(' ').filter(part => part.length > 0)
  if (nameParts.length < 2) {
    return { valid: false, message: 'Please enter your first and last name' }
  }
  if (nameParts.some(part => part.length < 2)) {
    return { valid: false, message: 'Each name part must be at least 2 characters' }
  }
  return { valid: true, message: '' }
}

// Validate age (must be 18+)
export const validateAge = (age) => {
  const ageNum = parseInt(age)
  if (isNaN(ageNum)) {
    return { valid: false, message: 'Age must be a number' }
  }
  if (ageNum < 18) {
    return { valid: false, message: 'You must be at least 18 years old' }
  }
  if (ageNum > 100) {
    return { valid: false, message: 'Please enter a valid age' }
  }
  return { valid: true, message: '' }
}

// Validate location
export const validateLocation = (location) => {
  if (!location || location.trim().length === 0) {
    return { valid: false, message: 'Location is required' }
  }
  if (location.trim().length < 2) {
    return { valid: false, message: 'Location must be at least 2 characters' }
  }
  return { valid: true, message: '' }
}

// Format phone number for display
export const formatPhone = (value) => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 3) return numbers
  if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`
  return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`
}
