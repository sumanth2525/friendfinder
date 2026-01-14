import { useState, useEffect, useMemo, useCallback } from 'react'
import { SearchIcon, FilterIcon } from '../components/Icons'
import { trackActivity, ACTIVITY_TYPES } from '../utils/activityTracker'
import { datingProfiles } from '../data/datingProfiles'
import { getUser } from '../utils/localStorage'
import ProfilePreview from '../components/ProfilePreview'

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [lastSearchTime, setLastSearchTime] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    ageMin: 18,
    ageMax: 35,
    distance: 50,
    lookingFor: 'all',
    interests: [],
    verified: false,
    online: false,
    gender: 'all', // 'all', 'Male', 'Female'
  })
  const [showProfilePreview, setShowProfilePreview] = useState(false)
  const [previewProfile, setPreviewProfile] = useState(null)
  const [sortBy, setSortBy] = useState('relevance') // 'relevance', 'distance', 'age', 'newest'
  const [viewMode, setViewMode] = useState('list') // 'list', 'grid', 'card'

  // Cache user data
  const currentUser = useMemo(() => getUser(), [])

  // Debounce search query for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Track search with debounce
  useEffect(() => {
    if (debouncedSearchQuery && debouncedSearchQuery.length > 2) {
      const now = Date.now()
      if (now - lastSearchTime > 1000) {
        trackActivity(ACTIVITY_TYPES.SEARCH_PERFORMED, {
          query: debouncedSearchQuery,
        })
        setLastSearchTime(now)
      }
    }
  }, [debouncedSearchQuery, lastSearchTime])

  // Memoize filtered profiles to avoid re-filtering on every render
  const filteredProfiles = useMemo(() => {
    const isUserVerified = currentUser?.verified !== false
    let results = [...datingProfiles]

    // Safety: Only show verified profiles to verified users
    if (isUserVerified) {
      results = results.filter(p => p.verified === true)
    }

    // Age filter
    results = results.filter(p => p.age >= filters.ageMin && p.age <= filters.ageMax)

    // Distance filter
    results = results.filter(p => p.distance <= filters.distance)

    // Looking for filter
    if (filters.lookingFor !== 'all') {
      results = results.filter(p => p.lookingFor === filters.lookingFor)
    }

    // Interests filter
    if (filters.interests.length > 0) {
      results = results.filter(p =>
        filters.interests.some(interest => p.interests.includes(interest))
      )
    }

    // Verified filter
    if (filters.verified) {
      results = results.filter(p => p.verified)
    }

    // Online filter
    if (filters.online) {
      results = results.filter(p => p.online)
    }

    // Gender filter
    if (filters.gender !== 'all') {
      results = results.filter(p => p.gender === filters.gender)
    }

    // Search query filter (using debounced query)
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase()
      results = results.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.bio.toLowerCase().includes(query) ||
        p.location.toLowerCase().includes(query) ||
        p.interests.some(i => i.toLowerCase().includes(query))
      )
    }

    // Sort results
    results = [...results].sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return a.distance - b.distance
        case 'age':
          return a.age - b.age
        case 'newest':
          // Assuming profiles have createdAt or similar
          return (b.id || 0) - (a.id || 0)
        case 'relevance':
        default:
          // Sort by match score (common interests, verified, online)
          const scoreA = calculateRelevanceScore(a)
          const scoreB = calculateRelevanceScore(b)
          return scoreB - scoreA
      }
    })

    return results
  }, [filters, debouncedSearchQuery, currentUser, sortBy])

  // Calculate relevance score for sorting
  const calculateRelevanceScore = useCallback((profile) => {
    let score = 0
    
    // Common interests boost
    if (currentUser?.interests) {
      const commonInterests = currentUser.interests.filter(i => 
        profile.interests.includes(i)
      ).length
      score += commonInterests * 10
    }
    
    // Verified profiles get boost
    if (profile.verified) score += 20
    
    // Online users get boost
    if (profile.online) score += 15
    
    // Closer distance gets boost
    score += Math.max(0, 50 - profile.distance)
    
    return score
  }, [currentUser])

  const allInterests = [
    'Travel', 'Photography', 'Coffee', 'Yoga', 'Reading', 'Art', 'Hiking',
    'Music', 'Cooking', 'Fitness', 'Food', 'Dancing', 'Movies', 'Technology',
    'Gaming', 'Anime', 'Writing', 'Theater', 'Wine', 'Meditation', 'Wellness',
    'Nature',
  ]

  // Memoize toggle interest handler
  const toggleInterest = useCallback((interest) => {
    setFilters(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }))
  }, [])

  // Calculate relevance score for sorting
  const calculateRelevanceScore = useCallback((profile) => {
    let score = 0
    
    // Common interests boost
    if (currentUser?.interests) {
      const commonInterests = currentUser.interests.filter(i => 
        profile.interests.includes(i)
      ).length
      score += commonInterests * 10
    }
    
    // Verified profiles get boost
    if (profile.verified) score += 20
    
    // Online users get boost
    if (profile.online) score += 15
    
    // Closer distance gets boost
    score += Math.max(0, 50 - profile.distance)
    
    return score
  }, [currentUser])

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Discover
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary"
            style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FilterIcon size={18} />
            Filters
          </button>
        </div>
        <input
          type="text"
          className="input"
          placeholder="Search by name, location, or interests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ marginBottom: '20px' }}
        />
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>
            Filters
          </h3>

          {/* Age Range */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
              Age: {filters.ageMin} - {filters.ageMax}
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="range"
                min="18"
                max="50"
                value={filters.ageMin}
                onChange={(e) => setFilters(prev => ({ ...prev, ageMin: parseInt(e.target.value) }))}
                style={{ flex: 1 }}
              />
              <input
                type="range"
                min="18"
                max="50"
                value={filters.ageMax}
                onChange={(e) => setFilters(prev => ({ ...prev, ageMax: parseInt(e.target.value) }))}
                style={{ flex: 1 }}
              />
            </div>
          </div>

          {/* Distance */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
              Distance: {filters.distance} miles
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={filters.distance}
              onChange={(e) => setFilters(prev => ({ ...prev, distance: parseInt(e.target.value) }))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Looking For */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
              Looking For
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['all', 'Relationship', 'Friends & Dating', 'Casual'].map((option) => (
                <button
                  key={option}
                  onClick={() => setFilters(prev => ({ ...prev, lookingFor: option }))}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    background: filters.lookingFor === option ? 'var(--gradient-primary)' : 'var(--surface)',
                    color: filters.lookingFor === option ? 'white' : 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: filters.lookingFor === option ? 'none' : '1px solid var(--border-light)',
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
              Interests
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {allInterests.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '16px',
                    background: filters.interests.includes(interest) ? 'var(--primary-100)' : 'var(--surface)',
                    color: filters.interests.includes(interest) ? 'var(--primary-color)' : 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: filters.interests.includes(interest) ? '1px solid var(--primary-color)' : '1px solid var(--border-light)',
                  }}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Filters */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filters.verified}
                onChange={(e) => setFilters(prev => ({ ...prev, verified: e.target.checked }))}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Verified only</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filters.online}
                onChange={(e) => setFilters(prev => ({ ...prev, online: e.target.checked }))}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Online now</span>
            </label>
          </div>

          {/* Reset Filters */}
          <button
            onClick={() => {
              setFilters({
                ageMin: 18,
                ageMax: 35,
                distance: 50,
                lookingFor: 'all',
                interests: [],
                verified: false,
                online: false,
                gender: 'all',
              })
            }}
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: '16px' }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Results Header with Sort and View Options */}
      {filteredProfiles.length > 0 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {filteredProfiles.length} {filteredProfiles.length === 1 ? 'result' : 'results'}
          </h3>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              <option value="relevance">Most Relevant</option>
              <option value="distance">Nearest First</option>
              <option value="age">Age</option>
              <option value="newest">Newest</option>
            </select>

            {/* View Mode Toggle */}
            <div style={{ 
              display: 'flex', 
              gap: '4px',
              background: 'var(--surface)',
              padding: '4px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: viewMode === 'list' ? 'var(--primary-color)' : 'transparent',
                  color: viewMode === 'list' ? 'white' : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: viewMode === 'grid' ? 'var(--primary-color)' : 'transparent',
                  color: viewMode === 'grid' ? 'white' : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('card')}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: viewMode === 'card' ? 'var(--primary-color)' : 'transparent',
                  color: viewMode === 'card' ? 'white' : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cards
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {filteredProfiles.length > 0 ? (
        <div>
          {/* List View */}
          {viewMode === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredProfiles.map((profile) => {
                const relevanceScore = calculateRelevanceScore(profile)
                
                return (
                <div 
                  key={profile.id} 
                  className="card"
                  style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                  onClick={() => {
                    setPreviewProfile(profile)
                    setShowProfilePreview(true)
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'var(--gradient-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '32px',
                        fontWeight: '700',
                        flexShrink: 0,
                        position: 'relative',
                        overflow: 'hidden',
                        border: '3px solid var(--border-light)'
                      }}
                    >
                      {profile.name.charAt(0)}
                      {profile.online && (
                        <div style={{
                          position: 'absolute',
                          bottom: '2px',
                          right: '2px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: 'var(--success)',
                          border: '2px solid white'
                        }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <h4 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                              {profile.name}, {profile.age}
                            </h4>
                            {profile.verified && (
                              <span style={{ color: 'var(--info)', fontSize: '16px' }} title="Verified">✓</span>
                            )}
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            📍 {profile.distance} miles away · {profile.location}
                          </p>
                        </div>
                        {sortBy === 'relevance' && (
                          <div style={{
                            padding: '4px 8px',
                            background: 'var(--primary-50)',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: 'var(--primary-color)'
                          }}>
                            {relevanceScore}% match
                          </div>
                        )}
                      </div>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: '1.4' }}>
                        {profile.bio}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {profile.interests.slice(0, 4).map((interest, idx) => (
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
                        {profile.interests.length > 4 && (
                          <span style={{
                            padding: '4px 10px',
                            background: 'var(--surface)',
                            color: 'var(--text-secondary)',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '500',
                          }}>
                            +{profile.interests.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
              gap: '16px' 
            }}>
              {filteredProfiles.map((profile) => {
                return (
                  <div
                    key={profile.id}
                    className="card"
                    style={{
                      padding: 0,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'transform 0.2s'
                    }}
                    onClick={() => {
                      setPreviewProfile(profile)
                      setShowProfilePreview(true)
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div style={{
                      width: '100%',
                      paddingBottom: '100%',
                      position: 'relative',
                      background: 'var(--gradient-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '48px',
                      fontWeight: '700',
                      color: 'white'
                    }}>
                      {profile.name.charAt(0)}
                      {profile.verified && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'var(--info)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '14px'
                        }}>✓</div>
                      )}
                    </div>
                    <div style={{ padding: '12px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>
                        {profile.name}, {profile.age}
                      </h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {profile.distance} mi away
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Card View */}
          {viewMode === 'card' && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '20px' 
            }}>
              {filteredProfiles.map((profile) => {
                const relevanceScore = calculateRelevanceScore(profile)
                
                return (
                  <div
                    key={profile.id}
                    className="card"
                    style={{
                      padding: 0,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s'
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
                      {sortBy === 'relevance' && (
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
                          {relevanceScore}% Match
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
                        {profile.bio.substring(0, 100)}{profile.bio.length > 100 ? '...' : ''}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {profile.interests.slice(0, 3).map((interest, idx) => (
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
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon" style={{
            display: 'flex',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            opacity: 0.5
          }}>
            <SearchIcon size={64} />
          </div>
          <div className="empty-state-text">No results found</div>
          <div className="empty-state-subtext">Try adjusting your filters</div>
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
        />
      )}
    </div>
  )
}

export default Search
