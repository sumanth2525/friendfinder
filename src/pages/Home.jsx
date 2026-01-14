import { useState, useEffect, useRef } from 'react'
import { datingProfiles, matches as defaultMatches } from '../data/datingProfiles'
import { trackActivity, ACTIVITY_TYPES } from '../utils/activityTracker'
import { HeartIcon, StarIcon, UndoIcon } from '../components/Icons'
import { saveMatches, getMatches, getUser, addFavoriteProfile, isFavoriteProfile, removeFavoriteProfile, addLikeSent, addLikeReceived } from '../utils/localStorage'
import ProfilePreview from '../components/ProfilePreview'

const Home = ({ onNavigateToMatches }) => {
  const [profiles, setProfiles] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipeDirection, setSwipeDirection] = useState(null)
  const [startX, setStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startTime, setStartTime] = useState(0)
  const [velocity, setVelocity] = useState(0)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [swipeHistory, setSwipeHistory] = useState([])
  const [photoStartX, setPhotoStartX] = useState(0)
  const [photoCurrentX, setPhotoCurrentX] = useState(0)
  const [isPhotoDragging, setIsPhotoDragging] = useState(false)
  const [showMatchAnimation, setShowMatchAnimation] = useState(false)
  const [matchedProfile, setMatchedProfile] = useState(null)
  const [isSuperLikeMatch, setIsSuperLikeMatch] = useState(false)
  const [favoriteState, setFavoriteState] = useState({})
  const [showProfilePreview, setShowProfilePreview] = useState(false)
  const [previewProfile, setPreviewProfile] = useState(null)
  const cardRef = useRef(null)
  const user = getUser()

  // Initialize default matches if none exist
  useEffect(() => {
    const currentMatches = getMatches()
    if (currentMatches.length === 0) {
      saveMatches(defaultMatches)
    }
  }, [])

  useEffect(() => {
    // Initialize default matches if none exist
    const currentMatches = getMatches()
    if (currentMatches.length === 0 && defaultMatches) {
      saveMatches(defaultMatches)
    }
  }, [])

  // Keyboard shortcuts for faster swiping
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (currentIndex >= profiles.length) return
      
      // Arrow keys or A/D for faster swiping
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        handleSwipe('left')
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        handleSwipe('right')
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, profiles.length])

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load profiles that haven't been matched or passed
    // Safety: Only show verified profiles to verified users
    setIsLoading(true)
    const passedProfiles = getPassedProfiles()
    const currentMatches = getMatches()
    const matchedProfiles = currentMatches.map(m => m.profile?.id || m.id)
    const isUserVerified = user?.verified !== false // Default to true if not set
    const availableProfiles = datingProfiles.filter(
      p => !passedProfiles.includes(p.id) && !matchedProfiles.includes(p.id) && (isUserVerified ? p.verified === true : true)
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
  }, [currentIndex])

  const getPassedProfiles = () => {
    try {
      const passed = localStorage.getItem('friendfinder_passed')
      return passed ? JSON.parse(passed) : []
    } catch {
      return []
    }
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

  const handleSwipe = (direction, isSuperLike = false) => {
    if (currentIndex >= profiles.length) return

    const profile = profiles[currentIndex]
    
    // Save to history for undo
    setSwipeHistory(prev => [...prev, {
      profile,
      direction,
      isSuperLike,
      index: currentIndex,
    }])
    
    if (direction === 'right') {
      // Like or Super Like
      trackActivity(ACTIVITY_TYPES.FAVORITE_ADDED, {
        id: profile.id,
        title: profile.name,
        isSuperLike,
      })
      
      // Save like sent
      addLikeSent(profile.id, profile)
      
      // Simulate receiving a like back (for demo - 20% chance)
      if (Math.random() > 0.8) {
        addLikeReceived(profile.id, profile)
      }
      
      // Check if it's a match (simplified - in real app, check if they liked you)
      const isMatch = Math.random() > 0.7 // 30% match rate for demo
      if (isMatch) {
        const newMatch = {
          id: Date.now(),
          profile: profile,
          matchedAt: new Date().toISOString().split('T')[0],
          lastMessage: isSuperLike ? '⭐ Super Like! You matched!' : 'You matched! Start a conversation',
          lastMessageTime: 'Just now',
          unread: 1,
          isSuperLike,
        }
        const currentMatches = getMatches()
        saveMatches([...currentMatches, newMatch])
        
        // Show match celebration animation
        setMatchedProfile(profile)
        setIsSuperLikeMatch(isSuperLike)
        setShowMatchAnimation(true)
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
          setShowMatchAnimation(false)
        }, 3000)
      }
    } else {
      // Pass
      savePassedProfile(profile.id)
      trackActivity(ACTIVITY_TYPES.FAVORITE_REMOVED, {
        id: profile.id,
        title: profile.name,
      })
    }

    setSwipeDirection(direction)
    setPhotoIndex(0) // Reset photo index
    // Faster animation - reduced from 300ms to 150ms
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
      setSwipeDirection(null)
      setCurrentX(0)
      setVelocity(0)
    }, 150)
  }

  const handleUndo = () => {
    if (swipeHistory.length === 0) return
    
    const lastSwipe = swipeHistory[swipeHistory.length - 1]
    setSwipeHistory(prev => prev.slice(0, -1))
    
    // Restore profile
    setCurrentIndex(lastSwipe.index)
    setCurrentX(0)
    setPhotoIndex(0)
    
    // Remove from passed/matches if needed
    if (lastSwipe.direction === 'right') {
      const currentMatches = getMatches()
      const filteredMatches = currentMatches.filter(m => 
        (m.profile?.id || m.id) !== lastSwipe.profile.id
      )
      saveMatches(filteredMatches)
    } else {
      const passed = getPassedProfiles()
      const filteredPassed = passed.filter(id => id !== lastSwipe.profile.id)
      localStorage.setItem('friendfinder_passed', JSON.stringify(filteredPassed))
    }
  }

  // Photo gallery swipe handlers
  const handlePhotoTouchStart = (e) => {
    e.stopPropagation()
    setIsPhotoDragging(true)
    setPhotoStartX(e.touches[0].clientX)
  }

  const handlePhotoTouchMove = (e) => {
    if (!isPhotoDragging) return
    e.stopPropagation()
    setPhotoCurrentX(e.touches[0].clientX - photoStartX)
  }

  const handlePhotoTouchEnd = (e) => {
    e.stopPropagation()
    if (!isPhotoDragging) return
    setIsPhotoDragging(false)
    
    const threshold = 50
    const photos = currentProfile?.photos || []
    
    if (Math.abs(photoCurrentX) > threshold) {
      if (photoCurrentX > 0 && photoIndex > 0) {
        setPhotoIndex(prev => prev - 1)
      } else if (photoCurrentX < 0 && photoIndex < photos.length - 1) {
        setPhotoIndex(prev => prev + 1)
      }
    }
    setPhotoCurrentX(0)
  }

  const handlePhotoMouseDown = (e) => {
    e.stopPropagation()
    setIsPhotoDragging(true)
    setPhotoStartX(e.clientX)
  }

  const handlePhotoMouseMove = (e) => {
    if (!isPhotoDragging) return
    e.stopPropagation()
    setPhotoCurrentX(e.clientX - photoStartX)
  }

  const handlePhotoMouseUp = (e) => {
    e.stopPropagation()
    if (!isPhotoDragging) return
    setIsPhotoDragging(false)
    
    const threshold = 50
    const photos = currentProfile?.photos || []
    
    if (Math.abs(photoCurrentX) > threshold) {
      if (photoCurrentX > 0 && photoIndex > 0) {
        setPhotoIndex(prev => prev - 1)
      } else if (photoCurrentX < 0 && photoIndex < photos.length - 1) {
        setPhotoIndex(prev => prev + 1)
      }
    }
    setPhotoCurrentX(0)
  }

  const handleTouchStart = (e) => {
    // Don't start card drag if we're interacting with photo gallery
    if (e.target.closest('[data-photo-gallery]')) return
    
    setIsDragging(true)
    const touchX = e.touches[0].clientX
    setStartX(touchX)
    setStartTime(Date.now())
    setVelocity(0)
  }

  const handleTouchMove = (e) => {
    if (!isDragging) return
    // Don't move card if we're interacting with photo gallery
    if (e.target.closest('[data-photo-gallery]')) {
      setIsDragging(false)
      return
    }
    
    const x = e.touches[0].clientX
    const deltaX = x - startX
    const deltaTime = Date.now() - startTime
    const currentVelocity = Math.abs(deltaX / deltaTime) * 1000 // pixels per second
    
    setCurrentX(deltaX)
    setVelocity(currentVelocity)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    // Reduced threshold from 100px to 60px for faster swiping
    // Also check velocity - fast swipes trigger even with less distance
    const threshold = 60
    const velocityThreshold = 500 // pixels per second
    
    if (Math.abs(currentX) > threshold || Math.abs(velocity) > velocityThreshold) {
      handleSwipe(currentX > 0 ? 'right' : 'left')
    } else {
      // Snap back faster
      setCurrentX(0)
    }
    setVelocity(0)
  }

  const handleMouseDown = (e) => {
    setIsDragging(true)
    const mouseX = e.clientX
    setStartX(mouseX)
    setStartTime(Date.now())
    setVelocity(0)
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    const deltaX = e.clientX - startX
    const deltaTime = Date.now() - startTime
    const currentVelocity = Math.abs(deltaX / deltaTime) * 1000 // pixels per second
    
    setCurrentX(deltaX)
    setVelocity(currentVelocity)
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)

    // Reduced threshold and velocity-based detection
    const threshold = 60
    const velocityThreshold = 500
    
    if (Math.abs(currentX) > threshold || Math.abs(velocity) > velocityThreshold) {
      handleSwipe(currentX > 0 ? 'right' : 'left')
    } else {
      setCurrentX(0)
    }
    setVelocity(0)
  }

  if (currentIndex >= profiles.length) {
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
          {swipeHistory.length > 0 && (
            <button
              className="btn"
              onClick={handleUndo}
              style={{
                background: 'white',
                color: 'var(--text-primary)',
                border: '2px solid var(--border)',
              }}
            >
              <UndoIcon size={18} style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }} />
              Undo Last Swipe
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={() => {
              setCurrentIndex(0)
              setPhotoIndex(0)
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

  const currentProfile = profiles[currentIndex]
  if (!currentProfile) return null

  // More responsive rotation and opacity
  const rotation = currentX * 0.15 // Increased rotation for better feedback
  const opacity = Math.max(0.3, 1 - Math.abs(currentX) / 200) // Faster fade
  const compatibility = calculateCompatibility(currentProfile)
  const isUserVerified = user?.verified !== false
  // Safety: Only show photos if profile is verified
  const canShowPhotos = currentProfile.verified === true && isUserVerified
  const photos = canShowPhotos ? (currentProfile.photos || []) : []
  // Show only first photo if multiple exist
  const displayPhoto = photos.length > 0 ? photos[0] : null
  const currentPhoto = displayPhoto

  const handleProfileClick = () => {
    setPreviewProfile(currentProfile)
    setShowProfilePreview(true)
  }

  const handlePreviewLike = () => {
    handleSwipe('right', false)
    setShowProfilePreview(false)
  }

  const handlePreviewSuperLike = () => {
    handleSwipe('right', true)
    setShowProfilePreview(false)
  }

  const handlePreviewPass = () => {
    handleSwipe('left')
    setShowProfilePreview(false)
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

              {/* Matched Profile Photo */}
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: matchedProfile.photos?.[0] 
                    ? `url(${matchedProfile.photos[0]}) center/cover`
                    : 'rgba(255, 255, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  fontWeight: '700',
                  border: '4px solid white',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  animation: 'bounceIn 0.6s ease 0.3s both',
                  color: matchedProfile.photos?.[0] ? 'transparent' : 'white',
                }}
              >
                {!matchedProfile.photos?.[0] && matchedProfile.name.charAt(0)}
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

      <div style={{ position: 'relative', height: 'calc(100vh - 200px)', minHeight: '600px' }}>
      {/* Undo Button */}
      {swipeHistory.length > 0 && (
        <button
          onClick={handleUndo}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 20,
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            transition: 'transform 0.1s',
            WebkitTapHighlightColor: 'transparent',
            backdropFilter: 'blur(10px)',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <UndoIcon size={20} />
        </button>
      )}

      {/* Action Buttons */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '12px',
          zIndex: 10,
          alignItems: 'center',
        }}
      >
        <button
          onClick={() => handleSwipe('left')}
          onTouchStart={(e) => {
            e.preventDefault()
            handleSwipe('left')
          }}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: 'white',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '24px',
            transition: 'transform 0.1s',
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          ✕
        </button>
        <button
          onClick={() => handleSwipe('right', true)}
          onTouchStart={(e) => {
            e.preventDefault()
            handleSwipe('right', true)
          }}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white',
            transition: 'transform 0.1s',
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title="Super Like"
        >
          <StarIcon size={22} filled={true} />
        </button>
        <button
          onClick={() => handleSwipe('right')}
          onTouchStart={(e) => {
            e.preventDefault()
            handleSwipe('right')
          }}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: 'var(--gradient-primary)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white',
            transition: 'transform 0.1s',
            WebkitTapHighlightColor: 'transparent',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <HeartIcon size={28} filled={true} />
        </button>
      </div>

      {/* Profile Card */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          position: 'absolute',
          width: '100%',
          maxWidth: '100%',
          height: 'calc(100vh - 250px)',
          maxHeight: '700px',
          transform: `translateX(${currentX}px) rotate(${rotation}deg) scale(${isDragging ? 0.98 : 1})`,
          opacity: opacity,
          transition: swipeDirection ? 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)' : 'transform 0.1s, opacity 0.1s',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          willChange: 'transform',
          touchAction: 'pan-y',
        }}
      >
        <div
          className="card"
          style={{
            height: '100%',
            padding: 0,
            overflow: 'hidden',
            position: 'relative',
            background: 'var(--gradient-card)',
          }}
        >
          {/* Photo Gallery - Hidden until click, show placeholder */}
          <div
            data-photo-gallery
            style={{
              width: '100%',
              height: '70%',
              position: 'relative',
              overflow: 'hidden',
              background: 'var(--gradient-card)',
              cursor: 'pointer',
            }}
            onClick={handleProfileClick}
          >
            {/* Show placeholder initially - no images until user clicks */}
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                color: 'white',
                background: 'var(--gradient-card)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '64px',
                  fontWeight: '700',
                  marginBottom: '16px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                }}
              >
                {currentProfile.name.charAt(0)}
              </div>
              <p style={{ fontSize: '16px', opacity: 0.9, fontWeight: '500' }}>
                {currentProfile.name}, {currentProfile.age}
              </p>
              <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '8px' }}>
                Tap to view profile
              </p>
              {!canShowPhotos && (
                <p style={{ fontSize: '12px', opacity: 0.6, marginTop: '8px', fontStyle: 'italic' }}>
                  Verification pending
                </p>
              )}
            </div>

            {/* Photo Indicators - Hidden since we show placeholder */}

            {/* Compatibility Score */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow)',
                zIndex: 5,
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {compatibility}% Match
              </span>
            </div>

            {/* Favorite Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                const isFav = favoriteState[currentProfile.id] || isFavoriteProfile(currentProfile.id)
                if (isFav) {
                  removeFavoriteProfile(currentProfile.id)
                  setFavoriteState(prev => ({ ...prev, [currentProfile.id]: false }))
                } else {
                  addFavoriteProfile(currentProfile)
                  setFavoriteState(prev => ({ ...prev, [currentProfile.id]: true }))
                }
              }}
              style={{
                position: 'absolute',
                top: '16px',
                left: '60px',
                zIndex: 5,
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                background: (favoriteState[currentProfile.id] || isFavoriteProfile(currentProfile.id))
                  ? 'rgba(255, 215, 0, 0.95)' 
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow)',
                transition: 'transform 0.2s',
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              title={(favoriteState[currentProfile.id] || isFavoriteProfile(currentProfile.id)) ? 'Remove from favorites' : 'Add to favorites'}
            >
              <StarIcon 
                size={20} 
                filled={favoriteState[currentProfile.id] || isFavoriteProfile(currentProfile.id)}
                style={{ color: (favoriteState[currentProfile.id] || isFavoriteProfile(currentProfile.id)) ? '#ff6b6b' : 'var(--text-primary)' }}
              />
            </button>

            {/* Verified Badge */}
            {currentProfile.verified && (
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  background: 'var(--info)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow)',
                  zIndex: 5,
                }}
              >
                <span style={{ color: 'white', fontSize: '18px', fontWeight: '700' }}>✓</span>
              </div>
            )}

            {/* Online Status */}
            {currentProfile.online && (
              <div
                style={{
                  position: 'absolute',
                  top: currentProfile.verified ? '56px' : '16px',
                  left: '16px',
                  background: 'var(--success)',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: '600',
                  boxShadow: 'var(--shadow)',
                  zIndex: 5,
                }}
              >
                Online
              </div>
            )}
          </div>

          {/* Info */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
              padding: '24px 20px',
              color: 'white',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>
                  {currentProfile.name}, {currentProfile.age}
                </h2>
                <p style={{ fontSize: '14px', opacity: 0.9 }}>
                  {currentProfile.distance} miles away · {currentProfile.location}
                </p>
              </div>
            </div>
            <p style={{ fontSize: '15px', marginBottom: '12px', lineHeight: '1.4' }}>
              {currentProfile.bio}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {currentProfile.interests.slice(0, 4).map((interest, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>

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
