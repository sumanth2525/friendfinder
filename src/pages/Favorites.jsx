import { useState, useEffect } from 'react'
import { getFavoriteProfiles, removeFavoriteProfile } from '../utils/localStorage'
import { HeartIcon } from '../components/Icons'

const Favorites = () => {
  const [favorites, setFavorites] = useState([])

  useEffect(() => {
    const savedFavorites = getFavoriteProfiles()
    setFavorites(savedFavorites)
  }, [])

  const handleRemoveFavorite = (profileId) => {
    removeFavoriteProfile(profileId)
    setFavorites(prev => prev.filter(p => p.id !== profileId))
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>
          Favorite Profiles
        </h2>
      </div>

      {favorites.length === 0 ? (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <HeartIcon size={64} style={{ opacity: 0.3, marginBottom: '16px', color: 'var(--text-secondary)' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
              No favorites yet
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Tap the star icon on profiles to add them to favorites
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {favorites.map((profile) => (
            <div
              key={profile.id}
              className="card"
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    background: profile.photos?.[0] 
                      ? `url(${profile.photos[0]}) center/cover`
                      : 'var(--gradient-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: profile.photos?.[0] ? 'transparent' : 'white',
                    fontSize: '24px',
                    fontWeight: '700',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {!profile.photos?.[0] && profile.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {profile.name}, {profile.age}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    {profile.location} • {profile.distance} miles away
                  </p>
                  {profile.bio && (
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                      {profile.bio.substring(0, 60)}...
                    </p>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
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
                </div>
                <button
                  onClick={() => handleRemoveFavorite(profile.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    color: '#ff6b6b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Remove from favorites"
                >
                  <HeartIcon size={20} filled={true} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Favorites
