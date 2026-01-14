import { useState, useEffect } from 'react'
import { MenuIcon, MoonIcon, SunIcon } from './Icons'
import { getInsights } from '../utils/activityTracker'
import { getMemberStatsOptimized } from '../utils/memberStats'
import { adminService } from '../services/adminService'

const Header = ({ user, onLogout, theme, onThemeChange, onNavigateToProfile, onNavigateToAdmin, onNavigateToHome, supabase }) => {
  const [showMenu, setShowMenu] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [insightsLastUpdated, setInsightsLastUpdated] = useState(null)
  const [cachedInsights, setCachedInsights] = useState(null)
    const [memberStats, setMemberStats] = useState({
      menCount: 0,
      womenCount: 0,
      onlineCount: 0, // Show real count, not fake "20+"
      isLoading: true,
      hasLoadedRealData: false
    })
  
  // Load insights with 6-hour cache
  useEffect(() => {
    const loadInsights = () => {
      const lastUpdated = localStorage.getItem('insights_last_updated')
      const cached = localStorage.getItem('insights_cache')
      const now = Date.now()
      const sixHours = 6 * 60 * 60 * 1000 // 6 hours in milliseconds
      
      if (lastUpdated && cached && (now - parseInt(lastUpdated)) < sixHours) {
        // Use cached insights
        setCachedInsights(JSON.parse(cached))
        setInsightsLastUpdated(new Date(parseInt(lastUpdated)))
      } else {
        // Refresh insights
        const freshInsights = getInsights()
        setCachedInsights(freshInsights)
        setInsightsLastUpdated(new Date())
        localStorage.setItem('insights_cache', JSON.stringify(freshInsights))
        localStorage.setItem('insights_last_updated', now.toString())
      }
    }
    
    loadInsights()
    
    // Check every hour if we need to refresh
    const interval = setInterval(() => {
      loadInsights()
    }, 60 * 60 * 1000) // Check every hour
    
    return () => clearInterval(interval)
  }, [])
  
  const getAvatarInitials = () => {
    if (user?.avatar) return user.avatar
    if (user?.name) {
      const nameParts = user.name.trim().split(' ').filter(part => part.length > 0)
      if (nameParts.length >= 2) {
        // First letter of first name + first letter of last name
        const first = nameParts[0]?.[0] || ''
        const last = nameParts[nameParts.length - 1]?.[0] || ''
        if (first && last) {
          return (first + last).toUpperCase()
        }
      } else if (nameParts.length === 1 && nameParts[0]?.length >= 2) {
        // If only one name, use first two letters
        return nameParts[0].substring(0, 2).toUpperCase()
      } else if (nameParts.length === 1 && nameParts[0]?.length === 1) {
        return nameParts[0].toUpperCase()
      }
    }
    return 'U'
  }

  const insights = cachedInsights || getInsights()
  
  const formatLastUpdated = () => {
    if (!insightsLastUpdated) return 'Never'
    const now = Date.now()
    const updated = insightsLastUpdated.getTime()
    const diff = now - updated
    const hours = Math.floor(diff / (60 * 60 * 1000))
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000))
    
    if (hours < 1) {
      return `${minutes} minutes ago`
    } else if (hours < 24) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else {
      return insightsLastUpdated.toLocaleDateString()
    }
  }

  const handleMenuToggle = () => {
    setShowMenu(!showMenu)
  }

  const handleInsightsClick = () => {
    setShowInsights(true)
    setShowMenu(false)
  }

  const handleCloseInsights = () => {
    setShowInsights(false)
  }

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id || !supabase) {
        setIsAdmin(false)
        return
      }

      try {
        const isAdminUser = await adminService.checkAdminAccess(user.id)
        setIsAdmin(isAdminUser)
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      }
    }

    checkAdminStatus()
  }, [user?.id, supabase])

  // Fetch member stats on mount and every 30 seconds
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await getMemberStatsOptimized(supabase)
        if (!stats.error) {
          setMemberStats(prev => {
            // Always show real counts, never fake "20+"
            return {
              menCount: stats.menCount || 0,
              womenCount: stats.womenCount || 0,
              onlineCount: stats.onlineCount || 0,
              isLoading: false,
              hasLoadedRealData: true
            }
          })
        } else {
          // If error, show 0 instead of fake numbers
          setMemberStats(prev => ({
            ...prev,
            menCount: 0,
            womenCount: 0,
            onlineCount: 0,
            isLoading: false,
            hasLoadedRealData: true
          }))
        }
      } catch (error) {
        console.error('Error fetching member stats:', error)
        setMemberStats(prev => ({
          ...prev,
          menCount: 0,
          womenCount: 0,
          onlineCount: 0,
          isLoading: false,
          hasLoadedRealData: true
        }))
      }
    }

    // Fetch immediately, no fake delay
    fetchStats()

    // Then update every 30 seconds
    const interval = setInterval(() => {
      fetchStats()
    }, 30000)

    return () => {
      clearInterval(interval)
    }
  }, [supabase])

  return (
    <>
      <header className="app-header">
        <div className="header-content" style={{ color: 'var(--text-primary)' }}>
          <button
            onClick={handleMenuToggle}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MenuIcon size={24} />
          </button>
        <h1 
          className="header-title" 
          style={{ 
            color: 'var(--text-primary)', 
            fontSize: '20px',
            cursor: 'pointer',
            userSelect: 'none'
          }}
          onClick={() => onNavigateToHome && onNavigateToHome()}
        >
          Discover
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onThemeChange && (
            <button
              onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                borderRadius: '8px',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-50)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <MoonIcon size={20} /> : <SunIcon size={20} />}
            </button>
          )}
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '700',
              fontSize: '16px',
              cursor: 'pointer',
              position: 'relative',
            }}
            onClick={onNavigateToProfile}
            title="Profile"
          >
            {getAvatarInitials()}
          </div>
        </div>
      </div>
    </header>

    {/* Burger Menu */}
    {showMenu && (
      <div
        style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
        }}
        onClick={() => setShowMenu(false)}
      >
        <div
          style={{
            width: '280px',
            height: '100%',
            background: 'var(--surface)',
            boxShadow: 'var(--shadow-xl)',
            padding: '20px',
            overflowY: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>Menu</h2>
              <button
                onClick={() => setShowMenu(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                }}
              >
                ×
              </button>
            </div>

            {/* Member Stats */}
            <div style={{
              background: 'var(--gradient-primary)',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '20px',
              color: 'white',
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', opacity: 0.9 }}>
                Community Stats
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>
                    {memberStats.isLoading ? '...' : memberStats.menCount.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.9 }}>Men</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>
                    {memberStats.isLoading ? '...' : memberStats.womenCount.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.9 }}>Women</div>
                </div>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center',
                backdropFilter: 'blur(10px)',
              }}>
                <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981',
                    display: 'inline-block',
                    animation: 'pulse 2s infinite',
                    boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
                  }}></span>
                  {memberStats.isLoading ? '...' : memberStats.onlineCount.toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.9 }}>Online Now</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleInsightsClick}
                style={{
                  padding: '12px 16px',
                  background: 'var(--primary-50)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'var(--primary-color)',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span style={{ fontSize: '20px' }}>📊</span>
                Insights
              </button>
              <button
                onClick={onNavigateToProfile}
                style={{
                  padding: '12px 16px',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span style={{ fontSize: '20px' }}>👤</span>
                Profile
              </button>
              {isAdmin && onNavigateToAdmin && (
                <button
                  onClick={onNavigateToAdmin}
                  style={{
                    padding: '12px 16px',
                    background: 'transparent',
                    border: '1px solid var(--warning)',
                    borderRadius: '12px',
                    color: 'var(--warning)',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>🛡️</span>
                  Admin Panel
                </button>
              )}
              <button
                onClick={onLogout}
                style={{
                  padding: '12px 16px',
                  background: 'transparent',
                  border: '1px solid var(--error)',
                  borderRadius: '12px',
                  color: '#ef4444',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span style={{ fontSize: '20px' }}>🚪</span>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Insights Modal */}
    {showInsights && (
      <div
        style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
        onClick={handleCloseInsights}
      >
        <div
          className="card"
          style={{
            maxWidth: '400px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            background: 'var(--surface)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Your Activity Insights
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Last updated: {formatLastUpdated()}
              </p>
            </div>
            <button
              onClick={handleCloseInsights}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
              }}
            >
              ×
            </button>
          </div>

          {insights && (
            <>
              {/* Stats Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div style={{
                  padding: '16px',
                  background: 'var(--primary-50)',
                  borderRadius: '12px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '4px' }}>
                    {insights.totalFavorites || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                    Favorites
                  </div>
                </div>
                <div style={{
                  padding: '16px',
                  background: 'var(--info-light)',
                  borderRadius: '12px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--info)', marginBottom: '4px' }}>
                    {insights.totalSearches || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                    Searches
                  </div>
                </div>
                <div style={{
                  padding: '16px',
                  background: 'var(--success-light)',
                  borderRadius: '12px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--success)', marginBottom: '4px' }}>
                    {insights.totalViews || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                    Views
                  </div>
                </div>
                <div style={{
                  padding: '16px',
                  background: 'var(--warning-light)',
                  borderRadius: '12px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--warning)', marginBottom: '4px' }}>
                    {insights.activityStreak || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                    Day Streak
                  </div>
                </div>
              </div>

              {/* Favorite Categories */}
              {insights.favoriteCategories && insights.favoriteCategories.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                    Favorite Categories
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {insights.favoriteCategories.map((item, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '8px 12px',
                          background: 'var(--primary-100)',
                          color: 'var(--primary-color)',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {item.category}
                        <span style={{ 
                          background: 'var(--primary-color)', 
                          color: 'white',
                          borderRadius: '10px',
                          padding: '2px 6px',
                          fontSize: '10px',
                        }}>
                          {item.count}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Most Searched Terms */}
              {insights.mostSearchedTerms && insights.mostSearchedTerms.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                    Top Searches
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {insights.mostSearchedTerms.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 12px',
                          background: 'var(--background)',
                          borderRadius: '8px',
                        }}
                      >
                        <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>
                          "{item.term}"
                        </span>
                        <span style={{ 
                          fontSize: '12px', 
                          color: 'var(--text-secondary)',
                          fontWeight: '600',
                        }}>
                          {item.count}x
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              {insights.recentActivity && insights.recentActivity.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                    Recent Activity
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {insights.recentActivity.slice(0, 5).map((activity, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 12px',
                          background: 'var(--background)',
                          borderRadius: '8px',
                        }}
                      >
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {activity.description}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                          {activity.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Most Active Day */}
              {insights.mostActiveDay && (
                <div style={{ 
                  marginTop: '20px',
                  padding: '12px',
                  background: 'var(--gradient-primary-subtle)',
                  borderRadius: '12px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Most Active Day
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary-color)' }}>
                    {insights.mostActiveDay}
                  </div>
                </div>
              )}
            </>
          )}

          {!insights && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                No insights available yet. Start using the app to see your activity!
              </p>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  )
}

export default Header
