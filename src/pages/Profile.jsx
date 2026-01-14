import { useEffect, useState, useMemo } from 'react'
import { getPreferences, savePreferences, getUser, saveUser } from '../utils/localStorage'
import { getInsights } from '../utils/activityTracker'
import { MailIcon, PhoneIcon, ShareIcon, HeartIcon } from '../components/Icons'
import { calculateProfileCompletion, getCompletionStatus, getMissingFields } from '../utils/profileCompletion'
import EditProfile from '../components/EditProfile'
import Settings from '../components/Settings'

const Profile = ({ user: loggedInUser, onLogout, onNavigateToFavorites }) => {
  // Local user state (synced with prop)
  const [user, setUser] = useState(loggedInUser)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0) // Force re-render when data changes
  
  const getUsername = () => {
    if (loggedInUser?.email) {
      return `@${loggedInUser.email.split('@')[0]}`
    }
    if (loggedInUser?.phone) {
      return `@${loggedInUser.phone.replace(/\D/g, '').slice(-4)}`
    }
    return '@yourusername'
  }

  // Get current preferences (reload when refreshKey changes)
  const savedPrefs = useMemo(() => getPreferences(), [refreshKey])
  const currentPrefs = useMemo(() => getPreferences(), [refreshKey])
  const currentUser = useMemo(() => getUser() || loggedInUser, [refreshKey, loggedInUser])
  
  // Update user state when loggedInUser changes or when preferences are updated
  useEffect(() => {
    const currentUserData = getUser() || loggedInUser
    setUser(currentUserData)
  }, [loggedInUser, refreshKey])
  
  // Refresh when edit profile closes to show updated data
  useEffect(() => {
    if (!showEditProfile) {
      // Force re-render to show updated data
      const updatedUser = getUser()
      if (updatedUser) {
        setUser(updatedUser)
        setRefreshKey(prev => prev + 1)
      }
    }
  }, [showEditProfile])
  
  const profileData = useMemo(() => ({
    name: currentUser?.name || savedPrefs.name || loggedInUser?.name || 'Your Name',
    username: getUsername(),
    email: loggedInUser?.email,
    phone: loggedInUser?.phone,
    age: currentPrefs.age || savedPrefs.age || currentUser?.age || loggedInUser?.age || 28,
    gender: currentPrefs.gender || savedPrefs.gender || currentUser?.gender || loggedInUser?.gender || null,
    location: currentPrefs.location || savedPrefs.location || currentUser?.location || loggedInUser?.location || 'New York, NY',
    bio: currentPrefs.bio || savedPrefs.bio || currentUser?.bio || loggedInUser?.bio || 'Passionate about connecting with amazing people!',
    avatar: currentUser?.avatar || loggedInUser?.avatar || (currentUser?.name || loggedInUser?.name)?.substring(0, 2).toUpperCase() || 'YN',
    job: currentPrefs.job || savedPrefs.job || currentUser?.job || loggedInUser?.job || 'Software Developer',
    education: currentPrefs.education || savedPrefs.education || currentUser?.education || loggedInUser?.education || 'University',
    height: currentPrefs.height || savedPrefs.height || currentUser?.height || loggedInUser?.height || "5'10\"",
    lookingFor: currentPrefs.lookingFor || savedPrefs.lookingFor || currentUser?.lookingFor || loggedInUser?.lookingFor || 'Relationship',
    stats: [
      { label: 'Matches', value: savedPrefs.matches || '12' },
      { label: 'Likes', value: savedPrefs.likes || '48' },
      { label: 'Messages', value: savedPrefs.messages || '23' },
    ],
    interests: currentPrefs.interests || savedPrefs.interests || currentUser?.interests || loggedInUser?.interests || ['Music', 'Travel', 'Photography', 'Coffee', 'Reading'],
    lifestyle: currentPrefs.lifestyle || savedPrefs.lifestyle || currentUser?.lifestyle || {
      drinking: 'Socially',
      smoking: 'Never',
      exercise: 'Regularly',
      pets: 'Dog lover',
    },
  }), [currentPrefs, savedPrefs, currentUser, loggedInUser, refreshKey])

  // Save preferences when component mounts (if user has custom preferences)
  useEffect(() => {
    if (loggedInUser && Object.keys(savedPrefs).length > 0) {
      savePreferences(savedPrefs)
    }
  }, [])

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '36px',
            fontWeight: '700',
            margin: '0 auto 16px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {profileData.avatar}
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-primary)' }}>
          {profileData.name}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{profileData.username}</p>
        {profileData.email && (
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '13px', 
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <MailIcon size={14} />
            {profileData.email}
          </p>
        )}
        {profileData.phone && (
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '13px', 
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <PhoneIcon size={14} />
            {profileData.phone}
          </p>
        )}
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '300px', margin: '0 auto', marginBottom: '8px' }}>
          {profileData.bio}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {profileData.age} years old
          </span>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>•</span>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {profileData.location}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>•</span>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {profileData.height}
          </span>
        </div>
      </div>

      {/* Profile Completion */}
      {(() => {
        const completionPercentage = calculateProfileCompletion(profileData)
        const status = getCompletionStatus(completionPercentage)
        const missingFields = getMissingFields(profileData)
        
        return (
          <div className="card" style={{ marginBottom: '20px', background: 'var(--gradient-primary-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Profile Completion
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {status}
                </div>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-color)' }}>
                {completionPercentage}%
              </div>
            </div>
            
            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '8px',
              background: 'var(--border-light)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '8px',
            }}>
              <div style={{
                width: `${completionPercentage}%`,
                height: '100%',
                background: completionPercentage >= 75 
                  ? 'var(--success)' 
                  : completionPercentage >= 50 
                    ? 'var(--primary-color)' 
                    : 'var(--warning)',
                borderRadius: '4px',
                transition: 'width 0.5s ease',
              }} />
            </div>
            
            {missingFields.length > 0 && (
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Missing: {missingFields.slice(0, 3).join(', ')}
                {missingFields.length > 3 && ` +${missingFields.length - 3} more`}
              </div>
            )}
          </div>
        )
      })()}

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 0' }}>
          {profileData.stats.map((stat, idx) => (
            <div key={idx} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Dating Info */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
          About Me
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Job</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{profileData.job}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Education</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{profileData.education}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Looking For</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary-color)' }}>{profileData.lookingFor}</span>
          </div>
        </div>
      </div>

      {/* Lifestyle */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
          Lifestyle
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Drinking</span>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '4px' }}>
              {profileData.lifestyle.drinking}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Smoking</span>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '4px' }}>
              {profileData.lifestyle.smoking}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Exercise</span>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '4px' }}>
              {profileData.lifestyle.exercise}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pets</span>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '4px' }}>
              {profileData.lifestyle.pets}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
          Interests
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {profileData.interests.map((interest, idx) => (
            <span
              key={idx}
              style={{
                padding: '10px 16px',
                background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                color: 'white',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              {interest}
            </span>
          ))}
        </div>
      </div>

      {/* Insights removed - now available in burger menu */}

      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button 
          className="btn btn-primary" 
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          onClick={() => {
            const profileUrl = `${window.location.origin}${window.location.pathname}?profile=${profileData.username}`
            if (navigator.share) {
              navigator.share({
                title: `${profileData.name}'s Profile`,
                text: `Check out ${profileData.name}'s profile on FriendFinder!`,
                url: profileUrl,
              }).catch(() => {
                // Fallback to copy
                navigator.clipboard.writeText(profileUrl)
                alert('Profile link copied to clipboard!')
              })
            } else {
              navigator.clipboard.writeText(profileUrl)
              alert('Profile link copied to clipboard!')
            }
          }}
        >
          <ShareIcon size={18} />
          Share Profile
        </button>
        {onNavigateToFavorites && (
          <button 
            className="btn btn-secondary" 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={() => onNavigateToFavorites()}
          >
            <HeartIcon size={18} />
            View Favorites
          </button>
        )}
        <button 
          className="btn btn-primary" 
          style={{ width: '100%' }}
          onClick={() => setShowEditProfile(true)}
        >
          Edit Profile
        </button>
        <button 
          className="btn btn-secondary" 
          style={{ width: '100%' }}
          onClick={() => setShowSettings(true)}
        >
          Settings
        </button>
        <button 
          className="btn btn-secondary" 
          style={{ width: '100%', color: '#ef4444', borderColor: '#ef4444' }}
          onClick={onLogout}
        >
          Logout
        </button>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfile
          user={profileData}
          onClose={() => setShowEditProfile(false)}
          onSave={(updatedUser) => {
            // Update local state
            setUser(updatedUser)
            // Close modal
            setShowEditProfile(false)
            // Force refresh to show updated data
            setRefreshKey(prev => prev + 1)
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          user={user}
          onClose={() => setShowSettings(false)}
          onDeleteProfile={() => {
            onLogout()
          }}
        />
      )}
    </div>
  )
}

export default Profile
