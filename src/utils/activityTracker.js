// Activity tracking utility
// Tracks user activity for insights generation

const STORAGE_KEY = 'friendfinder_activity'

// Activity types
export const ACTIVITY_TYPES = {
  FAVORITE_ADDED: 'favorite_added',
  FAVORITE_REMOVED: 'favorite_removed',
  DESTINATION_VIEWED: 'destination_viewed',
  CATEGORY_SELECTED: 'category_selected',
  SEARCH_PERFORMED: 'search_performed',
  TAB_SWITCHED: 'tab_switched',
}

// Get all activities
export const getActivities = () => {
  try {
    const activities = localStorage.getItem(STORAGE_KEY)
    return activities ? JSON.parse(activities) : []
  } catch (error) {
    console.error('Error reading activities:', error)
    return []
  }
}

// Save activity
export const trackActivity = (type, data = {}) => {
  try {
    const activities = getActivities()
    const activity = {
      type,
      data,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    }
    activities.push(activity)
    
    // Keep only last 1000 activities to prevent storage bloat
    const recentActivities = activities.slice(-1000)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentActivities))
  } catch (error) {
    console.error('Error tracking activity:', error)
  }
}

// Get insights from activities
export const getInsights = () => {
  const activities = getActivities()
  
  if (activities.length === 0) {
    return {
      totalFavorites: 0,
      totalSearches: 0,
      totalViews: 0,
      favoriteCategories: [],
      mostSearchedTerms: [],
      recentActivity: [],
      activityStreak: 0,
      mostActiveDay: null,
      totalActivityTime: 0,
    }
  }

  // Calculate insights
  const favorites = activities.filter(a => a.type === ACTIVITY_TYPES.FAVORITE_ADDED)
  const searches = activities.filter(a => a.type === ACTIVITY_TYPES.SEARCH_PERFORMED)
  const views = activities.filter(a => a.type === ACTIVITY_TYPES.DESTINATION_VIEWED)
  const categorySelections = activities.filter(a => a.type === ACTIVITY_TYPES.CATEGORY_SELECTED)

  // Favorite categories
  const categoryCounts = {}
  categorySelections.forEach(activity => {
    const category = activity.data.category
    if (category) {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
    }
  })
  const favoriteCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }))

  // Most searched terms
  const searchTerms = {}
  searches.forEach(activity => {
    const term = activity.data.query?.toLowerCase().trim()
    if (term && term.length > 0) {
      searchTerms[term] = (searchTerms[term] || 0) + 1
    }
  })
  const mostSearchedTerms = Object.entries(searchTerms)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([term, count]) => ({ term, count }))

  // Recent activity (last 10)
  const recentActivity = activities
    .slice(-10)
    .reverse()
    .map(activity => ({
      type: activity.type,
      description: getActivityDescription(activity),
      time: getTimeAgo(activity.timestamp),
    }))

  // Activity streak (consecutive days with activity)
  const activityStreak = calculateStreak(activities)

  // Most active day
  const dayCounts = {}
  activities.forEach(activity => {
    const day = new Date(activity.timestamp).toLocaleDateString('en-US', { weekday: 'long' })
    dayCounts[day] = (dayCounts[day] || 0) + 1
  })
  const mostActiveDay = Object.entries(dayCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null

  // Total unique favorites (accounting for adds and removes)
  const favoriteIds = new Set()
  activities.forEach(activity => {
    if (activity.type === ACTIVITY_TYPES.FAVORITE_ADDED && activity.data.id) {
      favoriteIds.add(activity.data.id)
    } else if (activity.type === ACTIVITY_TYPES.FAVORITE_REMOVED && activity.data.id) {
      favoriteIds.delete(activity.data.id)
    }
  })

  return {
    totalFavorites: favoriteIds.size,
    totalSearches: searches.length,
    totalViews: views.length,
    favoriteCategories,
    mostSearchedTerms,
    recentActivity,
    activityStreak,
    mostActiveDay,
    totalActivities: activities.length,
  }
}

// Get human-readable activity description
const getActivityDescription = (activity) => {
  switch (activity.type) {
    case ACTIVITY_TYPES.FAVORITE_ADDED:
      return `Favorited ${activity.data.title || 'destination'}`
    case ACTIVITY_TYPES.FAVORITE_REMOVED:
      return `Removed favorite: ${activity.data.title || 'destination'}`
    case ACTIVITY_TYPES.DESTINATION_VIEWED:
      return `Viewed ${activity.data.title || 'destination'}`
    case ACTIVITY_TYPES.CATEGORY_SELECTED:
      return `Browsed ${activity.data.category || 'category'}`
    case ACTIVITY_TYPES.SEARCH_PERFORMED:
      return `Searched for "${activity.data.query || '...'}"`
    case ACTIVITY_TYPES.TAB_SWITCHED:
      return `Switched to ${activity.data.tab || 'tab'}`
    default:
      return 'Activity'
  }
}

// Get time ago string
const getTimeAgo = (timestamp) => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return new Date(timestamp).toLocaleDateString()
}

// Calculate activity streak
const calculateStreak = (activities) => {
  if (activities.length === 0) return 0

  const dates = new Set()
  activities.forEach(activity => {
    dates.add(activity.date)
  })

  const sortedDates = Array.from(dates).sort().reverse()
  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  // Check if user was active today or yesterday
  if (!sortedDates.includes(today) && !sortedDates.includes(yesterday)) {
    return 0
  }

  let currentDate = sortedDates[0]
  for (let i = 0; i < sortedDates.length; i++) {
    const date = sortedDates[i]
    const expectedDate = new Date(currentDate)
    expectedDate.setDate(expectedDate.getDate() - i)
    const expectedDateStr = expectedDate.toISOString().split('T')[0]

    if (date === expectedDateStr) {
      streak++
    } else {
      break
    }
  }

  return streak
}

// Clear all activities
export const clearActivities = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing activities:', error)
  }
}
