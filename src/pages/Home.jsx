import { useState, useEffect } from 'react'
import { datingProfiles, matches as defaultMatches } from '../data/datingProfiles'
import { trackActivity, ACTIVITY_TYPES } from '../utils/activityTracker'
import { HeartIcon, StarIcon, GroupsIcon } from '../components/Icons'
import { saveMatches, getMatches, getUser, addFavoriteProfile, isFavoriteProfile, removeFavoriteProfile, addLikeSent, addLikeReceived } from '../utils/localStorage'
import ProfilePreview from '../components/ProfilePreview'
import { groupChatService } from '../services/groupChat'

const Home = ({ onNavigateToMatches, onNavigateToGroups }) => {
  const [profiles, setProfiles] = useState([])
  const [showMatchAnimation, setShowMatchAnimation] = useState(false)
  const [matchedProfile, setMatchedProfile] = useState(null)
  const [isSuperLikeMatch, setIsSuperLikeMatch] = useState(false)
  const [favoriteState, setFavoriteState] = useState({})
  const [showProfilePreview, setShowProfilePreview] = useState(false)
  const [previewProfile, setPreviewProfile] = useState(null)
  const [viewMode, setViewMode] = useState('browse') // 'browse', 'matches', or 'groups'
  const user = getUser()
  const [matchedProfiles, setMatchedProfiles] = useState([])
  const [groups, setGroups] = useState([])

  // Initialize default matches if none exist
  useEffect(() => {
    const currentMatches = getMatches()
    if (currentMatches.length === 0 && defaultMatches) {
      saveMatches(defaultMatches)
    }
  }, [])


  const [isLoading, setIsLoading] = useState(true)

  // Cache localStorage reads to avoid repeated I/O
  const [cachedPassedProfiles] = useState(() => {
    try {
      const passed = localStorage.getItem('friendfinder_passed')
      return passed ? JSON.parse(passed) : []
    } catch {
      return []
    }
  })

  const [cachedMatches] = useState(() => getMatches())

  useEffect(() => {
    // Load matched profiles
    const matches = getMatches()
    const matchedProfileList = matches.map(m => m.profile || m).filter(Boolean)
    setMatchedProfiles(matchedProfileList)
    
    // Load profiles that haven't been matched or passed
    // Safety: Only show verified profiles to verified users
    setIsLoading(true)
    const matchedProfileIds = cachedMatches.map(m => m.profile?.id || m.id)
    const isUserVerified = user?.verified !== false // Default to true if not set
    const availableProfiles = datingProfiles.filter(
      p => !cachedPassedProfiles.includes(p.id) && !matchedProfileIds.includes(p.id) && (isUserVerified ? p.verified === true : true)
    )
    // Simulate loading delay for better UX
    setTimeout(() => {
      setProfiles(availableProfiles)
      setIsLoading(false)
      // Update favorite state
      const favState = {}
      availableProfiles.forEach(p => {
        favState[p.id] = isFavoriteProfile(p.id)
      })
      setFavoriteState(favState)
    }, 300)

    // Load groups
    const loadGroups = async () => {
      const userInterests = user?.interests || ['Music', 'Travel', 'Photography', 'Coffee', 'Reading', 'Art']
      const { data } = await groupChatService.getGroupsForInterests(userInterests.slice(0, 6))
      setGroups(data || [])
    }
    loadGroups()
  }, [cachedPassedProfiles, cachedMatches, user?.verified, user?.interests])

  const getPassedProfiles = () => {
    return cachedPassedProfiles
  }

  const savePassedProfile = (id) => {
    try {
      const passed = getPassedProfiles()
      passed.push(id)
      localStorage.setItem('friendfinder_passed', JSON.stringify(passed))
    } catch (error) {
      console.error('Error saving passed profile:', error)
    }
  }

  // Calculate compatibility score
  const calculateCompatibility = (profile) => {
    if (!user || !user.interests) return Math.floor(Math.random() * 20 + 70) // 70-90% default
    
    const userInterests = user.interests || []
    const profileInterests = profile.interests || []
    const commonInterests = userInterests.filter(i => profileInterests.includes(i))
    const totalInterests = new Set([...userInterests, ...profileInterests]).size
    const compatibility = Math.round((commonInterests.length / totalInterests) * 100)
    return Math.max(60, Math.min(99, compatibility)) // Clamp between 60-99%
  }

  const handleSwipe = (direction, isSuperLike = false, profile = null) => {
    const targetProfile = profile || profiles[0]
    if (!targetProfile) return
    
    if (direction === 'right') {
      // Like or Super Like
      trackActivity(ACTIVITY_TYPES.FAVORITE_ADDED, {
        id: targetProfile.id,
        title: targetProfile.name,
        isSuperLike,
      })
      
      // Save like sent
      addLikeSent(targetProfile.id, targetProfile)
      
      // Simulate receiving a like back (for demo - 20% chance)
      if (Math.random() > 0.8) {
        addLikeReceived(targetProfile.id, targetProfile)
      }
      
      // Check if it's a match (simplified - in real app, check if they liked you)
      const isMatch = Math.random() > 0.7 // 30% match rate for demo
      if (isMatch) {
        const newMatch = {
          id: Date.now(),
          profile: targetProfile,
          matchedAt: new Date().toISOString().split('T')[0],
          lastMessage: isSuperLike ? '⭐ Super Like! You matched!' : 'You matched! Start a conversation',
          lastMessageTime: 'Just now',
          unread: 1,
          isSuperLike,
        }
        const currentMatches = getMatches()
        saveMatches([...currentMatches, newMatch])
        
        // Show match celebration animation
        setMatchedProfile(targetProfile)
        setIsSuperLikeMatch(isSuperLike)
        setShowMatchAnimation(true)
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
          setShowMatchAnimation(false)
        }, 3000)
      }
    } else {
      // Pass
      savePassedProfile(targetProfile.id)
      trackActivity(ACTIVITY_TYPES.FAVORITE_REMOVED, {
        id: targetProfile.id,
        title: targetProfile.name,
      })
    }

    // Remove from list
    setProfiles(prev => prev.filter(p => p.id !== targetProfile.id))
  }

  if (profiles.length === 0 && !isLoading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '80px 20px',
        background: 'var(--gradient-card)',
        borderRadius: '24px',
        margin: '20px 0',
      }}>
        <div style={{ 
          width: '120px', 
          height: '120px', 
          margin: '0 auto 24px',
          background: 'var(--gradient-primary)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
          boxShadow: 'var(--shadow-lg)',
        }}>
          ✨
        </div>
        <h2 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          marginBottom: '12px', 
          color: 'var(--text-primary)',
          fontFamily: 'Poppins, sans-serif',
        }}>
          You're all caught up!
        </h2>
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: '16px', 
          marginBottom: '32px',
          lineHeight: '1.6',
          maxWidth: '300px',
          margin: '0 auto 32px',
        }}>
          You've seen everyone in your area. Check back later for new profiles!
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => {
              const passedProfiles = getPassedProfiles()
              const currentMatches = getMatches()
              const matchedProfiles = currentMatches.map(m => m.profile?.id || m.id)
              const availableProfiles = datingProfiles.filter(
                p => !passedProfiles.includes(p.id) && !matchedProfiles.includes(p.id)
              )
              setProfiles(availableProfiles)
            }}
          >
            Refresh Profiles
          </button>
        </div>
      </div>
    )
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div style={{ position: 'relative', height: 'calc(100vh - 200px)', minHeight: '600px' }}>
        <div
          className="card"
          style={{
            height: '100%',
            padding: 0,
            overflow: 'hidden',
            position: 'relative',
            background: 'var(--gradient-card)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '70%',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
              padding: '24px 20px',
            }}
          >
            <div
              style={{
                height: '28px',
                width: '200px',
                background: 'rgba(255,255,255,0.3)',
                borderRadius: '8px',
                marginBottom: '12px',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <div
              style={{
                height: '16px',
                width: '150px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '8px',
                marginBottom: '16px',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  style={{
                    height: '24px',
                    width: '60px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handlePreviewLike = () => {
    if (previewProfile) {
      handleSwipe('right', false, previewProfile)
      setShowProfilePreview(false)
    }
  }

  const handlePreviewSuperLike = () => {
    if (previewProfile) {
      handleSwipe('right', true, previewProfile)
      setShowProfilePreview(false)
    }
  }

  const handlePreviewPass = () => {
    if (previewProfile) {
      handleSwipe('left', false, previewProfile)
      setShowProfilePreview(false)
    }
  }

  return (
    <>
      {/* Match Celebration Animation */}
      {showMatchAnimation && matchedProfile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.3s ease',
          }}
          onClick={() => setShowMatchAnimation(false)}
        >
          {/* Confetti/Hearts Animation Container */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              overflow: 'hidden',
            }}
          >
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${Math.random() * 100}%`,
                  top: '-10px',
                  fontSize: '24px',
                  animation: `confettiFall ${2 + Math.random() * 2}s ease-in forwards`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  opacity: 0.8,
                }}
              >
                {['💖', '✨', '🎉', '⭐', '💕'][Math.floor(Math.random() * 5)]}
              </div>
            ))}
          </div>

          {/* Match Card */}
          <div
            style={{
              background: 'var(--gradient-primary)',
              borderRadius: '32px',
              padding: '40px 32px',
              maxWidth: '90%',
              width: '400px',
              textAlign: 'center',
              color: 'white',
              boxShadow: 'var(--shadow-xl)',
              animation: 'matchPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
              position: 'relative',
              zIndex: 1,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sparkle Effect */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                fontSize: '32px',
                animation: 'spin 2s linear infinite',
              }}
            >
              ✨
            </div>
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                fontSize: '32px',
                animation: 'spin 2s linear infinite reverse',
              }}
            >
              ⭐
            </div>

            {/* Match Icon */}
            <div
              style={{
                fontSize: '80px',
                marginBottom: '16px',
                animation: 'heartBeat 0.6s ease-in-out 0.3s',
              }}
            >
              {isSuperLikeMatch ? '⭐' : '💖'}
            </div>

            {/* Match Text */}
            <h2
              style={{
                fontSize: '32px',
                fontWeight: '800',
                marginBottom: '12px',
                fontFamily: 'Poppins, sans-serif',
                textShadow: '0 2px 10px rgba(0,0,0,0.2)',
              }}
            >
              {isSuperLikeMatch ? 'Super Like Match!' : "It's a Match!"}
            </h2>

            <p
              style={{
                fontSize: '18px',
                marginBottom: '24px',
                opacity: 0.95,
                fontWeight: '500',
              }}
            >
              You and {matchedProfile.name} liked each other
            </p>

            {/* Profile Photos */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              {/* User Avatar */}
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  fontWeight: '700',
                  border: '4px solid white',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  animation: 'bounceIn 0.6s ease 0.2s both',
                }}
              >
                {user?.name?.charAt(0) || 'U'}
              </div>

              {/* Heart Icon */}
              <div
                style={{
                  fontSize: '40px',
                  animation: 'heartBeat 0.6s ease-in-out 0.4s',
                }}
              >
                💖
              </div>

              {/* Matched Profile Avatar */}
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  fontWeight: '700',
                  border: '4px solid white',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  animation: 'bounceIn 0.6s ease 0.3s both',
                  color: 'white',
                }}
              >
                {matchedProfile.name.charAt(0)}
              </div>
            </div>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
              }}
            >
              <button
                className="btn"
                onClick={() => setShowMatchAnimation(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                Keep Swiping
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowMatchAnimation(false)
                  if (onNavigateToMatches) {
                    onNavigateToMatches()
                  }
                }}
                style={{
                  background: 'white',
                  color: 'var(--primary-color)',
                  fontWeight: '600',
                }}
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Toggle */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        marginBottom: '16px',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setViewMode('browse')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: viewMode === 'browse' ? 'var(--gradient-primary)' : 'var(--border-light)',
            color: viewMode === 'browse' ? 'white' : 'var(--text-primary)',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Browse
        </button>
        <button
          onClick={() => setViewMode('groups')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: viewMode === 'groups' ? 'var(--gradient-primary)' : 'var(--border-light)',
            color: viewMode === 'groups' ? 'white' : 'var(--text-primary)',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <GroupsIcon size={16} />
          Groups
        </button>
        <button
          onClick={() => setViewMode('matches')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: viewMode === 'matches' ? 'var(--gradient-primary)' : 'var(--border-light)',
            color: viewMode === 'matches' ? 'white' : 'var(--text-primary)',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            position: 'relative'
          }}
        >
          Matches
          {matchedProfiles.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: 'var(--error)',
              color: 'white',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700'
            }}>
              {matchedProfiles.length}
            </span>
          )}
        </button>
      </div>

      {/* Browse Mode - Grid View */}
      {viewMode === 'browse' && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
          gap: '16px',
          paddingBottom: '80px'
        }}>
          {profiles.slice(0, 20).map((profile) => {
            const isFav = favoriteState[profile.id] || isFavoriteProfile(profile.id)
            const compatibility = calculateCompatibility(profile)

            return (
              <div
                key={profile.id}
                className="card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                }}
                onClick={() => {
                  setPreviewProfile(profile)
                  setShowProfilePreview(true)
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: '100%',
                    height: '200px',
                    background: 'var(--gradient-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px',
                    fontWeight: '700',
                    color: 'white',
                    position: 'relative',
                  }}
                >
                  {profile.name.charAt(0)}
                  
                  {/* Compatibility Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '12px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: 'var(--primary-color)',
                    }}
                  >
                    {compatibility}%
                  </div>

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isFav) {
                        removeFavoriteProfile(profile.id)
                        setFavoriteState(prev => ({ ...prev, [profile.id]: false }))
                      } else {
                        addFavoriteProfile(profile)
                        setFavoriteState(prev => ({ ...prev, [profile.id]: true }))
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <StarIcon size={16} filled={isFav} />
                  </button>
                </div>

                {/* Info */}
                <div style={{ padding: '12px' }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    marginBottom: '4px',
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {profile.name}, {profile.age}
                  </h3>
                  <p style={{ 
                    fontSize: '12px', 
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {profile.location}
                  </p>
                </div>

                {/* Action Buttons */}
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  padding: '0 12px 12px 12px'
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSwipe('left', false, profile)
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      background: 'white',
                      color: 'var(--text-primary)',
                      fontSize: '20px',
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSwipe('right', false, profile)
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'var(--gradient-primary)',
                      color: 'white',
                      fontSize: '20px',
                      cursor: 'pointer',
                    }}
                  >
                    ❤️
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Matches View */}
      {viewMode === 'matches' && (
        <div>
          {matchedProfiles.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '20px',
              paddingBottom: '80px'
            }}>
              {matchedProfiles.map((profile) => {
                const compatibility = calculateCompatibility(profile)
                const match = cachedMatches.find(m => (m.profile?.id || m.id) === profile.id)
                
                return (
                  <div
                    key={profile.id}
                    className="card"
                    style={{
                      padding: 0,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      border: '2px solid var(--primary-color)'
                    }}
                    onClick={() => {
                      setPreviewProfile(profile)
                      setShowProfilePreview(true)
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'var(--shadow)'
                    }}
                  >
                    <div style={{
                      width: '100%',
                      height: '300px',
                      position: 'relative',
                      background: 'var(--gradient-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '64px',
                      fontWeight: '700',
                      color: 'white'
                    }}>
                      {profile.name.charAt(0)}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        display: 'flex',
                        gap: '8px'
                      }}>
                        {profile.verified && (
                          <div style={{
                            padding: '4px 8px',
                            background: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'var(--info)'
                          }}>✓ Verified</div>
                        )}
                        {profile.online && (
                          <div style={{
                            padding: '4px 8px',
                            background: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'var(--success)'
                          }}>🟢 Online</div>
                        )}
                      </div>
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        padding: '6px 12px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: 'var(--primary-color)'
                      }}>
                        {compatibility}% Match
                      </div>
                      {match?.isSuperLike && (
                        <div style={{
                          position: 'absolute',
                          bottom: '12px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          padding: '6px 12px',
                          background: 'rgba(255, 215, 0, 0.95)',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'var(--text-primary)'
                        }}>
                          ⭐ Super Like Match!
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '16px' }}>
                      <h4 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>
                        {profile.name}, {profile.age}
                      </h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        📍 {profile.distance} miles away · {profile.location}
                      </p>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
                        {profile.bio?.substring(0, 100)}{profile.bio?.length > 100 ? '...' : ''}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                        {profile.interests?.slice(0, 3).map((interest, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '4px 10px',
                              background: 'var(--primary-50)',
                              color: 'var(--primary-color)',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '500',
                            }}
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                      <button
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onNavigateToMatches) {
                            onNavigateToMatches()
                          }
                        }}
                      >
                        Send Message
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '80px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>💔</div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>
                No Matches Yet
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '24px' }}>
                Start browsing to find your perfect match!
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setViewMode('browse')}
              >
                Start Browsing
              </button>
            </div>
          )}
        </div>
      )}

      {/* Groups View */}
      {viewMode === 'groups' && (
        <div>
          {groups.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '20px',
              paddingBottom: '80px'
            }}>
              {groups.slice(0, 6).map((group) => (
                <div
                  key={group.id}
                  className="card"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onClick={() => {
                    if (onNavigateToGroups) {
                      onNavigateToGroups()
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'var(--shadow)'
                  }}
                >
                  <div style={{
                    width: '100%',
                    height: '200px',
                    position: 'relative',
                    background: 'var(--gradient-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '64px',
                    fontWeight: '700',
                    color: 'white'
                  }}>
                    {group.hobby?.charAt(0) || 'G'}
                  </div>
                  <div style={{ padding: '16px' }}>
                    <h4 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>
                      {group.name || group.hobby}
                    </h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      {group.description || `Connect with people who love ${group.hobby}`}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        👥 {group.member_count || 0} members
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--primary-color)', fontWeight: '600' }}>
                        Join Chat →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '80px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>💬</div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>
                No Groups Yet
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '24px' }}>
                Add interests to your profile to see groups!
              </p>
            </div>
          )}
        </div>
      )}


      {/* Profile Preview Modal */}
      {showProfilePreview && previewProfile && (
        <ProfilePreview
          profile={previewProfile}
          onClose={() => {
            setShowProfilePreview(false)
            setPreviewProfile(null)
          }}
          onLike={handlePreviewLike}
          onSuperLike={handlePreviewSuperLike}
          onPass={handlePreviewPass}
        />
      )}
    </>
  )
}

export default Home
