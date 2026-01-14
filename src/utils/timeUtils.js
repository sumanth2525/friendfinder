// Utility functions for time formatting

export const formatLastActive = (lastActive) => {
  if (!lastActive) return 'Offline'
  if (lastActive === 'Active now' || lastActive === 'Online') return 'Active now'
  
  // If it's a timestamp
  if (typeof lastActive === 'number') {
    const now = Date.now()
    const diff = now - lastActive
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'Active now'
    if (minutes < 60) return `Active ${minutes}m ago`
    if (hours < 24) return `Active ${hours}h ago`
    if (days < 7) return `Active ${days}d ago`
    return 'Offline'
  }
  
  // If it's a string like "Active 5 minutes ago"
  if (typeof lastActive === 'string' && lastActive.includes('Active')) {
    return lastActive
  }
  
  return lastActive
}

export const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return date.toLocaleDateString()
}
