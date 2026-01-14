// API Utility Functions
// Handles all API calls to Vercel Serverless Functions

/**
 * Get the API base URL
 * In production, uses the deployed Vercel URL
 * In development, uses relative path (Vercel dev server handles it)
 */
const getApiUrl = () => {
  if (typeof window === 'undefined') return '/api' // SSR fallback
  
  // In production, use full URL if available
  if (import.meta.env.PROD && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Default to relative path (works with Vercel)
  return '/api'
}

const API_URL = getApiUrl()

/**
 * Generic API fetch helper
 */
const apiFetch = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    // In development, if API is not available, log warning but don't crash
    if (import.meta.env.DEV && error.message.includes('Failed to fetch')) {
      console.warn(`API endpoint ${endpoint} not available in development. Using fallback.`)
      // Return mock data structure for development
      return { data: [], source: 'mock', error: 'API not available' }
    }
    console.error(`API Error (${endpoint}):`, error)
    throw error
  }
}

/**
 * Calculate match percentage between two users
 * @param {string} userId - Current user ID
 * @param {string} targetUserId - Target user ID
 * @param {object} user1Data - Optional: User 1 data (if available client-side)
 * @param {object} user2Data - Optional: User 2 data (if available client-side)
 * @returns {Promise<{score: number, compatible: boolean, breakdown?: object}>}
 */
export const calculateMatch = async (userId, targetUserId, user1Data = null, user2Data = null) => {
  return apiFetch('/matching/calculate', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      targetUserId,
      user1Data,
      user2Data,
    }),
  })
}

/**
 * Get member statistics (men count, women count, online count)
 * @returns {Promise<{menCount: number, womenCount: number, onlineCount: number, totalCount: number}>}
 */
export const getMemberStats = async () => {
  return apiFetch('/insights/stats')
}

/**
 * Get online users count
 * @returns {Promise<{onlineCount: number}>}
 */
export const getOnlineUsers = async () => {
  return apiFetch('/users/online')
}

/**
 * Update user's online status
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean}>}
 */
export const updateOnlineStatus = async (userId) => {
  return apiFetch('/users/online', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  })
}

/**
 * Get matches for a user
 * @param {string} userId - User ID
 * @returns {Promise<{data: Array}>}
 */
export const getMatches = async (userId) => {
  return apiFetch(`/matches?userId=${userId}`)
}

/**
 * Create a new match
 * @param {string} user1Id - First user ID
 * @param {string} user2Id - Second user ID
 * @returns {Promise<{data: object}>}
 */
export const createMatch = async (user1Id, user2Id) => {
  return apiFetch('/matches', {
    method: 'POST',
    body: JSON.stringify({ user1Id, user2Id }),
  })
}

/**
 * Get user profile(s)
 * @param {object} options - Query options
 * @param {string} options.userId - Specific user ID (optional)
 * @param {number} options.limit - Limit results (default: 20)
 * @param {string} options.gender - Filter by gender (optional)
 * @param {number} options.minAge - Minimum age (optional)
 * @param {number} options.maxAge - Maximum age (optional)
 * @param {string} options.location - Filter by location (optional)
 * @returns {Promise<{data: Array|object}>}
 */
export const getUsers = async (options = {}) => {
  const params = new URLSearchParams()
  
  if (options.userId) params.append('userId', options.userId)
  if (options.limit) params.append('limit', options.limit.toString())
  if (options.gender) params.append('gender', options.gender)
  if (options.minAge) params.append('minAge', options.minAge.toString())
  if (options.maxAge) params.append('maxAge', options.maxAge.toString())
  if (options.location) params.append('location', options.location)

  const queryString = params.toString()
  return apiFetch(`/users${queryString ? `?${queryString}` : ''}`)
}

/**
 * Example usage:
 * 
 * import { calculateMatch, getMemberStats, getOnlineUsers } from './utils/api'
 * 
 * // Calculate match
 * const { score, compatible, breakdown } = await calculateMatch(userId, targetUserId)
 * 
 * // Get member stats
 * const { menCount, womenCount, onlineCount } = await getMemberStats()
 * 
 * // Get online users
 * const { onlineCount } = await getOnlineUsers()
 * 
 * // Update online status
 * await updateOnlineStatus(userId)
 */
