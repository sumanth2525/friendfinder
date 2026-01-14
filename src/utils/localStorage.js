// LocalStorage utility functions
// 
// NOTE: This is a temporary solution for data persistence.
// In the next version, this will be replaced with Supabase for:
// - User authentication and sessions
// - Real-time data synchronization
// - Server-side data storage
// - Multi-device support
//
// The function names and structure are designed to make the migration easier.

const STORAGE_KEYS = {
  USER: 'friendfinder_user',
  AUTH: 'friendfinder_auth',
  FAVORITES: 'friendfinder_favorites',
  PREFERENCES: 'friendfinder_preferences',
  ACTIVE_TAB: 'friendfinder_active_tab',
  MATCHES: 'friendfinder_matches',
  THEME: 'friendfinder_theme',
  FAVORITE_PROFILES: 'friendfinder_favorite_profiles',
  BLOCKED_USERS: 'friendfinder_blocked_users',
  LIKES_SENT: 'friendfinder_likes_sent',
  LIKES_RECEIVED: 'friendfinder_likes_received',
}

// User & Authentication
export const saveUser = (user) => {
  try {
    // Ensure verified status is preserved
    const userToSave = {
      ...user,
      verified: user.verified !== undefined ? user.verified : true, // Default to true for existing users
    }
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userToSave))
    localStorage.setItem(STORAGE_KEYS.AUTH, 'true')
  } catch (error) {
    console.error('Error saving user to localStorage:', error)
  }
}

export const getUser = () => {
  try {
    const userData = localStorage.getItem(STORAGE_KEYS.USER)
    return userData ? JSON.parse(userData) : null
  } catch (error) {
    console.error('Error reading user from localStorage:', error)
    return null
  }
}

export const isAuthenticated = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true'
  } catch (error) {
    console.error('Error checking authentication:', error)
    return false
  }
}

export const clearAuth = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER)
    localStorage.removeItem(STORAGE_KEYS.AUTH)
    localStorage.removeItem(STORAGE_KEYS.FAVORITES)
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB)
    localStorage.removeItem(STORAGE_KEYS.PREFERENCES)
    // Note: Activities are kept for insights even after logout
    // Use clearAllData() if you want to clear everything
  } catch (error) {
    console.error('Error clearing auth from localStorage:', error)
  }
}

// Favorites
export const saveFavorites = (favorites) => {
  try {
    // Convert Set to Array for storage
    const favoritesArray = Array.from(favorites)
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favoritesArray))
  } catch (error) {
    console.error('Error saving favorites to localStorage:', error)
  }
}

export const getFavorites = () => {
  try {
    const favoritesData = localStorage.getItem(STORAGE_KEYS.FAVORITES)
    if (favoritesData) {
      const favoritesArray = JSON.parse(favoritesData)
      return new Set(favoritesArray)
    }
    return new Set()
  } catch (error) {
    console.error('Error reading favorites from localStorage:', error)
    return new Set()
  }
}

// Preferences
export const savePreferences = (preferences) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences))
  } catch (error) {
    console.error('Error saving preferences to localStorage:', error)
  }
}

export const getPreferences = () => {
  try {
    const preferencesData = localStorage.getItem(STORAGE_KEYS.PREFERENCES)
    return preferencesData ? JSON.parse(preferencesData) : {}
  } catch (error) {
    console.error('Error reading preferences from localStorage:', error)
    return {}
  }
}

// Active Tab
export const saveActiveTab = (tab) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, tab)
  } catch (error) {
    console.error('Error saving active tab to localStorage:', error)
  }
}

export const getActiveTab = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB) || 'home'
  } catch (error) {
    console.error('Error reading active tab from localStorage:', error)
    return 'home'
  }
}

// Matches
export const saveMatches = (matches) => {
  try {
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches))
  } catch (error) {
    console.error('Error saving matches to localStorage:', error)
  }
}

export const getMatches = () => {
  try {
    const matchesData = localStorage.getItem(STORAGE_KEYS.MATCHES)
    return matchesData ? JSON.parse(matchesData) : []
  } catch (error) {
    console.error('Error reading matches from localStorage:', error)
    return []
  }
}

// Theme
export const saveTheme = (theme) => {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme)
  } catch (error) {
    console.error('Error saving theme to localStorage:', error)
  }
}

export const getTheme = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light'
  } catch (error) {
    console.error('Error reading theme from localStorage:', error)
    return 'light'
  }
}

// Favorite Profiles
export const saveFavoriteProfiles = (profiles) => {
  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITE_PROFILES, JSON.stringify(profiles))
  } catch (error) {
    console.error('Error saving favorite profiles to localStorage:', error)
  }
}

export const getFavoriteProfiles = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.FAVORITE_PROFILES)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error reading favorite profiles from localStorage:', error)
    return []
  }
}

export const addFavoriteProfile = (profile) => {
  try {
    const favorites = getFavoriteProfiles()
    if (!favorites.find(p => p.id === profile.id)) {
      favorites.push({ ...profile, favoritedAt: Date.now() })
      saveFavoriteProfiles(favorites)
    }
  } catch (error) {
    console.error('Error adding favorite profile:', error)
  }
}

export const removeFavoriteProfile = (profileId) => {
  try {
    const favorites = getFavoriteProfiles()
    const filtered = favorites.filter(p => p.id !== profileId)
    saveFavoriteProfiles(filtered)
  } catch (error) {
    console.error('Error removing favorite profile:', error)
  }
}

export const isFavoriteProfile = (profileId) => {
  try {
    const favorites = getFavoriteProfiles()
    return favorites.some(p => p.id === profileId)
  } catch (error) {
    return false
  }
}

// Blocked Users
export const saveBlockedUsers = (userIds) => {
  try {
    localStorage.setItem(STORAGE_KEYS.BLOCKED_USERS, JSON.stringify(userIds))
  } catch (error) {
    console.error('Error saving blocked users to localStorage:', error)
  }
}

export const getBlockedUsers = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BLOCKED_USERS)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error reading blocked users from localStorage:', error)
    return []
  }
}

export const blockUser = (userId) => {
  try {
    const blocked = getBlockedUsers()
    if (!blocked.includes(userId)) {
      blocked.push(userId)
      saveBlockedUsers(blocked)
    }
  } catch (error) {
    console.error('Error blocking user:', error)
  }
}

export const unblockUser = (userId) => {
  try {
    const blocked = getBlockedUsers()
    const filtered = blocked.filter(id => id !== userId)
    saveBlockedUsers(filtered)
  } catch (error) {
    console.error('Error unblocking user:', error)
  }
}

export const isBlocked = (userId) => {
  try {
    const blocked = getBlockedUsers()
    return blocked.includes(userId)
  } catch (error) {
    return false
  }
}

// Likes Sent
export const saveLikesSent = (likes) => {
  try {
    localStorage.setItem(STORAGE_KEYS.LIKES_SENT, JSON.stringify(likes))
  } catch (error) {
    console.error('Error saving likes sent to localStorage:', error)
  }
}

export const getLikesSent = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LIKES_SENT)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error reading likes sent from localStorage:', error)
    return []
  }
}

export const addLikeSent = (profileId, profile) => {
  try {
    const likes = getLikesSent()
    if (!likes.find(l => l.profileId === profileId)) {
      likes.push({
        profileId,
        profile,
        timestamp: Date.now(),
      })
      saveLikesSent(likes)
    }
  } catch (error) {
    console.error('Error adding like sent:', error)
  }
}

// Likes Received
export const saveLikesReceived = (likes) => {
  try {
    localStorage.setItem(STORAGE_KEYS.LIKES_RECEIVED, JSON.stringify(likes))
  } catch (error) {
    console.error('Error saving likes received to localStorage:', error)
  }
}

export const getLikesReceived = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LIKES_RECEIVED)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error reading likes received from localStorage:', error)
    return []
  }
}

export const addLikeReceived = (profileId, profile) => {
  try {
    const likes = getLikesReceived()
    if (!likes.find(l => l.profileId === profileId)) {
      likes.push({
        profileId,
        profile,
        timestamp: Date.now(),
      })
      saveLikesReceived(likes)
    }
  } catch (error) {
    console.error('Error adding like received:', error)
  }
}

// Clear all app data (for logout)
export const clearAllData = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      if (key !== STORAGE_KEYS.THEME) { // Keep theme preference
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.error('Error clearing all data from localStorage:', error)
  }
}
