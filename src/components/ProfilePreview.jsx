import { useState } from 'react'
import { getUser } from '../utils/localStorage'
import { HeartIcon, StarIcon } from './Icons'

const ProfilePreview = ({ profile, onClose, onLike, onSuperLike, onPass }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const currentUser = getUser()
  const isCurrentUserVerified = currentUser?.verified !== false // Default to true if not set
  
  // Safety: Only show photos if profile is verified
  const canShowPhotos = profile?.verified === true && isCurrentUserVerified
  const photos = canShowPhotos ? (profile?.photos || []) : []
  const currentPhoto = photos[currentPhotoIndex] || photos[0]
  
  // Show only first photo if multiple exist
  const displayPhoto = photos.length > 0 ? photos[0] : null

  const handlePreviousPhoto = () => {
    if (photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
    }
  }

  const handleNextPhoto = () => {
    if (photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: '24px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 10,
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
          }}
        >
          ×
        </button>

        {/* Avatar Section */}
        <div
          style={{
            width: '100%',
            height: '400px',
            position: 'relative',
            background: 'var(--gradient-primary)',
            borderRadius: '24px 24px 0 0',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: 'white',
          }}
        >
          <div
            style={{
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '72px',
              fontWeight: '700',
              marginBottom: '16px',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            }}
          >
            {profile?.name?.charAt(0) || '?'}
          </div>

          {/* Verified Badge */}
          {profile?.verified && (
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                background: 'var(--info)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              }}
            >
              <span style={{ color: 'white', fontSize: '20px', fontWeight: '700' }}>✓</span>
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
              {profile?.name || 'Unknown'}, {profile?.age || '?'}
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              {profile?.location || 'Location not set'}
            </p>
            {profile?.distance && (
              <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
                {profile.distance} miles away
              </p>
            )}
          </div>

          {/* Bio */}
          {profile?.bio && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                {profile.bio}
              </p>
            </div>
          )}

          {/* Details */}
          <div style={{ marginBottom: '20px' }}>
            {profile?.job && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Job</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {profile.job}
                </span>
              </div>
            )}
            {profile?.education && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Education</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {profile.education}
                </span>
              </div>
            )}
            {profile?.height && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Height</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {profile.height}
                </span>
              </div>
            )}
            {profile?.lookingFor && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Looking For</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary-color)' }}>
                  {profile.lookingFor}
                </span>
              </div>
            )}
          </div>

          {/* Interests */}
          {profile?.interests && profile.interests.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                Interests
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {profile.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '8px 14px',
                      background: 'var(--primary-100)',
                      color: 'var(--primary-color)',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '600',
                    }}
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Lifestyle */}
          {profile?.lifestyle && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                Lifestyle
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {profile.lifestyle.drinking && (
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Drinking</span>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '4px' }}>
                      {profile.lifestyle.drinking}
                    </div>
                  </div>
                )}
                {profile.lifestyle.exercise && (
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Exercise</span>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '4px' }}>
                      {profile.lifestyle.exercise}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (onPass) onPass()
              }}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '12px',
                border: '2px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Pass
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (onSuperLike) onSuperLike()
              }}
              style={{
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                width: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <StarIcon size={24} filled />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (onLike) onLike()
              }}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: 'var(--gradient-primary)',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Like
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePreview
