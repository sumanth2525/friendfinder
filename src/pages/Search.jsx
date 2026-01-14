import { useState, useEffect } from 'react'
import { SearchIcon, FilterIcon } from '../components/Icons'
import { trackActivity, ACTIVITY_TYPES } from '../utils/activityTracker'
import { datingProfiles } from '../data/datingProfiles'
import { getUser } from '../utils/localStorage'
import ProfilePreview from '../components/ProfilePreview'

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('')
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
  const [filteredProfiles, setFilteredProfiles] = useState([])
  const [showProfilePreview, setShowProfilePreview] = useState(false)
  const [previewProfile, setPreviewProfile] = useState(null)

  // Track search with debounce
  useEffect(() => {
    if (searchQuery && searchQuery.length > 2) {
      const now = Date.now()
      if (now - lastSearchTime > 1000) {
        trackActivity(ACTIVITY_TYPES.SEARCH_PERFORMED, {
          query: searchQuery,
        })
        setLastSearchTime(now)
      }
    }
  }, [searchQuery, lastSearchTime])

  // Apply filters
  useEffect(() => {
    const currentUser = getUser()
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

    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      results = results.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.bio.toLowerCase().includes(query) ||
        p.location.toLowerCase().includes(query) ||
        p.interests.some(i => i.toLowerCase().includes(query))
      )
    }

    setFilteredProfiles(results)
  }, [filters, searchQuery])

  const allInterests = [
    'Travel', 'Photography', 'Coffee', 'Yoga', 'Reading', 'Art', 'Hiking',
    'Music', 'Cooking', 'Fitness', 'Food', 'Dancing', 'Movies', 'Technology',
    'Gaming', 'Anime', 'Writing', 'Theater', 'Wine', 'Meditation', 'Wellness',
    'Nature',
  ]

  const toggleInterest = (interest) => {
    setFilters(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }))
  }

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

      {/* Results */}
      {filteredProfiles.length > 0 ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {filteredProfiles.length} {filteredProfiles.length === 1 ? 'result' : 'results'}
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredProfiles.map((profile) => {
              const currentUser = getUser()
              const isUserVerified = currentUser?.verified !== false
              const canShowPhoto = profile.verified === true && isUserVerified
              
              return (
              <div 
                key={profile.id} 
                className="card"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setPreviewProfile(profile)
                  setShowProfilePreview(true)
                }}
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
                    }}
                  >
                    {/* No photo preview - show placeholder only */}
                    {profile.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <div>
                        <h4 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {profile.name}, {profile.age}
                        </h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {profile.distance} miles away · {profile.location}
                        </p>
                      </div>
                      {profile.verified && (
                        <span style={{ color: 'var(--info)', fontSize: '20px' }}>✓</span>
                      )}
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: '1.4' }}>
                      {profile.bio}
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
              </div>
              )
            })}
          </div>
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
