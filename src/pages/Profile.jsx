import { useEffect, useState } from 'react'
import { getPreferences, savePreferences } from '../utils/localStorage'
import { getInsights } from '../utils/activityTracker'
import { MailIcon, PhoneIcon, ShareIcon, HeartIcon } from '../components/Icons'

const Profile = ({ user: loggedInUser, onLogout, onNavigateToFavorites }) => {
  const getUsername = () => {
    if (loggedInUser?.email) {
      return `@${loggedInUser.email.split('@')[0]}`
    }
    if (loggedInUser?.phone) {
      return `@${loggedInUser.phone.replace(/\D/g, '').slice(-4)}`
    }
    return '@yourusername'
  }

  // Load saved preferences
  const savedPrefs = getPreferences()
  
  const user = {
    name: loggedInUser?.name || 'Your Name',
    username: getUsername(),
    email: loggedInUser?.email,
    phone: loggedInUser?.phone,
    age: savedPrefs.age || loggedInUser?.age || 28,
    location: savedPrefs.location || loggedInUser?.location || 'New York, NY',
    bio: savedPrefs.bio || loggedInUser?.bio || 'Passionate about connecting with amazing people!',
    avatar: loggedInUser?.avatar || loggedInUser?.name?.substring(0, 2).toUpperCase() || 'YN',
    job: savedPrefs.job || loggedInUser?.job || 'Software Developer',
    education: savedPrefs.education || loggedInUser?.education || 'University',
    height: savedPrefs.height || loggedInUser?.height || "5'10\"",
    lookingFor: savedPrefs.lookingFor || loggedInUser?.lookingFor || 'Relationship',
    stats: [
      { label: 'Matches', value: savedPrefs.matches || '12' },
      { label: 'Likes', value: savedPrefs.likes || '48' },
      { label: 'Messages', value: savedPrefs.messages || '23' },
    ],
    interests: savedPrefs.interests || loggedInUser?.interests || ['Music', 'Travel', 'Photography', 'Coffee', 'Reading'],
    lifestyle: savedPrefs.lifestyle || {
      drinking: 'Socially',
      smoking: 'Never',
      exercise: 'Regularly',
      pets: 'Dog lover',
    },
  }

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
          {user.avatar}
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-primary)' }}>
          {user.name}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>{user.username}</p>
        {user.email && (
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
            {user.email}
          </p>
        )}
        {user.phone && (
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
            {user.phone}
          </p>
        )}
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '300px', margin: '0 auto', marginBottom: '8px' }}>
          {user.bio}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {user.age} years old
          </span>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>•</span>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {user.location}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>•</span>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {user.height}
          </span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 0' }}>
          {user.stats.map((stat, idx) => (
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
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{user.job}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Education</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{user.education}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Looking For</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary-color)' }}>{user.lookingFor}</span>
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
              {user.lifestyle.drinking}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Smoking</span>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '4px' }}>
              {user.lifestyle.smoking}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Exercise</span>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '4px' }}>
              {user.lifestyle.exercise}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pets</span>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '4px' }}>
              {user.lifestyle.pets}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
          Interests
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {user.interests.map((interest, idx) => (
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
            const profileUrl = `${window.location.origin}${window.location.pathname}?profile=${user.username}`
            if (navigator.share) {
              navigator.share({
                title: `${user.name}'s Profile`,
                text: `Check out ${user.name}'s profile on FriendFinder!`,
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
        <button className="btn btn-primary" style={{ width: '100%' }}>
          Edit Profile
        </button>
        <button className="btn btn-secondary" style={{ width: '100%' }}>
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
    </div>
  )
}

export default Profile
