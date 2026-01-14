import { useState, useEffect } from 'react'
import { savePreferences, getUser, saveUser } from '../utils/localStorage'
import ImageUpload from './ImageUpload'

const EditProfile = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    age: user?.age || '',
    location: user?.location || '',
    job: user?.job || '',
    education: user?.education || '',
    height: user?.height || '',
    lookingFor: user?.lookingFor || 'Relationship',
    interests: user?.interests || [],
    lifestyle: user?.lifestyle || {
      drinking: 'Socially',
      smoking: 'Never',
      exercise: 'Regularly',
      pets: 'Dog lover',
    },
  })

  const availableInterests = [
    'Travel', 'Photography', 'Music', 'Sports', 'Reading', 'Cooking', 
    'Yoga', 'Gaming', 'Art', 'Movies', 'Coffee', 'Fitness', 'Dancing', 
    'Hiking', 'Writing', 'Anime', 'Books', 'Nature', 'Technology', 'Food'
  ]

  const lookingForOptions = ['Relationship', 'Friends & Dating', 'Casual', 'Not Sure Yet']

  useEffect(() => {
    // Initialize form data from user prop
    if (user) {
      setFormData({
        name: user?.name || '',
        bio: user?.bio || '',
        age: user?.age || '',
        location: user?.location || '',
        job: user?.job || '',
        education: user?.education || '',
        height: user?.height || '',
        lookingFor: user?.lookingFor || 'Relationship',
        interests: user?.interests || [],
        photos: user?.photos || [],
        lifestyle: user?.lifestyle || {
          drinking: 'Socially',
          smoking: 'Never',
          exercise: 'Regularly',
          pets: 'Dog lover',
        },
      })
    }
  }, [user])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleInterestToggle = (interest) => {
    setFormData(prev => {
      const interests = prev.interests || []
      if (interests.includes(interest)) {
        return { ...prev, interests: interests.filter(i => i !== interest) }
      } else if (interests.length < 6) {
        return { ...prev, interests: [...interests, interest] }
      }
      return prev
    })
  }

  const handleSave = () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.name.trim()) {
        alert('Please enter your name')
        return
      }
      
      if (!formData.age || formData.age < 18 || formData.age > 100) {
        alert('Please enter a valid age (18-100)')
        return
      }
      
      // Save to localStorage
      const updatedUser = { 
        ...user, 
        ...formData,
        // Ensure all fields are saved
        name: formData.name.trim(),
        age: parseInt(formData.age) || formData.age,
        photos: formData.photos || [],
      }
      
      saveUser(updatedUser)
      savePreferences(formData)
      
      // Call onSave callback with updated data
      if (onSave) {
        onSave(updatedUser)
      }
      
      // Close modal
      if (onClose) {
        onClose()
      }
      
      // Show success message
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
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
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '0',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: '24px 24px 0 0',
          width: '100%',
          maxWidth: '428px',
          minHeight: '90vh',
          marginTop: '10vh',
          position: 'relative',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky */}
        <div style={{ 
          padding: '20px', 
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--surface)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          borderRadius: '24px 24px 0 0',
        }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              borderRadius: '50%',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '0',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(0, 0, 0, 0.1)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(0, 0, 0, 0.05)'}
          >
            ×
          </button>
        </div>

        {/* Form - Scrollable */}
        <div style={{ 
          padding: '20px',
          flex: 1,
          overflowY: 'auto',
          paddingBottom: '100px', // Space for buttons
        }}>
          {/* Name */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              Name
            </label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Bio */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontSize: '15px', 
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              About Me
            </label>
            <textarea
              className="input"
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="Tell others about yourself..."
              rows={5}
              maxLength={500}
              style={{ 
                width: '100%', 
                resize: 'vertical',
                padding: '14px 16px',
                fontSize: '16px',
                lineHeight: '1.5',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ 
              fontSize: '12px', 
              color: 'var(--text-tertiary)', 
              marginTop: '6px',
              textAlign: 'right'
            }}>
              {formData.bio?.length || 0}/500
            </div>
          </div>

          {/* Photo Upload */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '10px', 
              fontSize: '15px', 
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              Profile Photos (up to 6)
            </label>
            <ImageUpload
              maxImages={6}
              existingImages={formData.photos || []}
              userId={user?.id}
              onUploadComplete={(images) => {
                handleChange('photos', images)
              }}
              onError={(error) => {
                console.error('Image upload error:', error)
                alert('Failed to upload image. Please try again.')
              }}
            />
          </div>

          {/* Age & Location */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '10px', 
                fontSize: '15px', 
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Age
              </label>
              <input
                type="number"
                className="input"
                value={formData.age}
                onChange={(e) => handleChange('age', e.target.value)}
                min="18"
                max="100"
                placeholder="Age"
                style={{ 
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                }}
              />
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '10px', 
                fontSize: '15px', 
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Location
              </label>
              <input
                type="text"
                className="input"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="City, State"
                style={{ 
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                }}
              />
            </div>
          </div>

          {/* Job & Education */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '10px', 
                fontSize: '15px', 
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Job
              </label>
              <input
                type="text"
                className="input"
                value={formData.job}
                onChange={(e) => handleChange('job', e.target.value)}
                placeholder="Your profession"
                style={{ 
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                }}
              />
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '10px', 
                fontSize: '15px', 
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Education
              </label>
              <input
                type="text"
                className="input"
                value={formData.education}
                onChange={(e) => handleChange('education', e.target.value)}
                placeholder="Education level"
                style={{ 
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                }}
              />
            </div>
          </div>

          {/* Height & Looking For */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '10px', 
                fontSize: '15px', 
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Height
              </label>
              <input
                type="text"
                className="input"
                value={formData.height}
                onChange={(e) => handleChange('height', e.target.value)}
                placeholder="5'10"
                style={{ 
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                }}
              />
            </div>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '10px', 
                fontSize: '15px', 
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Looking For
              </label>
              <select
                className="input"
                value={formData.lookingFor}
                onChange={(e) => handleChange('lookingFor', e.target.value)}
                style={{ 
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '16px',
                }}
              >
                {lookingForOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Interests (Max 6) */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '12px', 
              fontSize: '15px', 
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              Interests <span style={{ color: 'var(--text-secondary)', fontWeight: '400' }}>({formData.interests.length}/6)</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {availableInterests.map(interest => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  disabled={!formData.interests.includes(interest) && formData.interests.length >= 6}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '24px',
                    border: formData.interests.includes(interest)
                      ? '2px solid var(--primary-color)'
                      : '2px solid var(--border-color)',
                    background: formData.interests.includes(interest)
                      ? 'var(--primary-100)'
                      : 'var(--surface)',
                    color: formData.interests.includes(interest)
                      ? 'var(--primary-color)'
                      : 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: (!formData.interests.includes(interest) && formData.interests.length >= 6) 
                      ? 'not-allowed' 
                      : 'pointer',
                    opacity: (!formData.interests.includes(interest) && formData.interests.length >= 6) ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!(!formData.interests.includes(interest) && formData.interests.length >= 6)) {
                      e.target.style.transform = 'scale(1.05)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)'
                  }}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Lifestyle */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '14px', 
              fontSize: '15px', 
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              Lifestyle
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', fontWeight: '500' }}>
                  Drinking
                </label>
                <select
                  className="input"
                  value={formData.lifestyle.drinking}
                  onChange={(e) => handleChange('lifestyle', { ...formData.lifestyle, drinking: e.target.value })}
                  style={{ 
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '16px',
                  }}
                >
                  <option value="Never">Never</option>
                  <option value="Socially">Socially</option>
                  <option value="Regularly">Regularly</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', fontWeight: '500' }}>
                  Smoking
                </label>
                <select
                  className="input"
                  value={formData.lifestyle.smoking}
                  onChange={(e) => handleChange('lifestyle', { ...formData.lifestyle, smoking: e.target.value })}
                  style={{ 
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '16px',
                  }}
                >
                  <option value="Never">Never</option>
                  <option value="Occasionally">Occasionally</option>
                  <option value="Regularly">Regularly</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', fontWeight: '500' }}>
                  Exercise
                </label>
                <select
                  className="input"
                  value={formData.lifestyle.exercise}
                  onChange={(e) => handleChange('lifestyle', { ...formData.lifestyle, exercise: e.target.value })}
                  style={{ 
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '16px',
                  }}
                >
                  <option value="Never">Never</option>
                  <option value="Sometimes">Sometimes</option>
                  <option value="Regularly">Regularly</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block', fontWeight: '500' }}>
                  Pets
                </label>
                <select
                  className="input"
                  value={formData.lifestyle.pets}
                  onChange={(e) => handleChange('lifestyle', { ...formData.lifestyle, pets: e.target.value })}
                  style={{ 
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: '16px',
                  }}
                >
                  <option value="Dog lover">Dog lover</option>
                  <option value="Cat person">Cat person</option>
                  <option value="No pets">No pets</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Actions - Sticky Footer */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          padding: '20px',
          background: 'var(--surface)',
          borderTop: '1px solid var(--border-light)',
          position: 'sticky',
          bottom: 0,
          zIndex: 10,
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
        }}>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ 
              flex: 1,
              padding: '16px',
              fontSize: '16px',
              fontWeight: '600',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            style={{ 
              flex: 2,
              padding: '16px',
              fontSize: '16px',
              fontWeight: '600',
              background: 'var(--gradient-primary)',
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditProfile
