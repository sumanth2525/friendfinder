import { useState } from 'react'
import { supabase } from '../config/supabase'

const Settings = ({ user, onClose, onDeleteProfile }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')

  const handleDeleteProfile = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    try {
      // If Supabase is configured, add to deletion queue
      if (supabase) {
        const { error } = await supabase
          .from('deletion_queue')
          .insert({
            user_id: user?.id || null,
            email: user?.email || null,
            phone: user?.phone || null,
            reason: deleteReason || 'No reason provided',
            scheduled_deletion_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
            status: 'pending'
          })

        if (error) {
          console.error('Error adding to deletion queue:', error)
          // Fallback to localStorage
          const deletionQueue = JSON.parse(localStorage.getItem('deletion_queue') || '[]')
          deletionQueue.push({
            userId: user?.id,
            email: user?.email,
            phone: user?.phone,
            reason: deleteReason || 'No reason provided',
            scheduledDeletionAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
            createdAt: new Date().toISOString()
          })
          localStorage.setItem('deletion_queue', JSON.stringify(deletionQueue))
        }
      } else {
        // Fallback to localStorage
        const deletionQueue = JSON.parse(localStorage.getItem('deletion_queue') || '[]')
        deletionQueue.push({
          userId: user?.id,
          email: user?.email,
          phone: user?.phone,
          reason: deleteReason || 'No reason provided',
          scheduledDeletionAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          createdAt: new Date().toISOString()
        })
        localStorage.setItem('deletion_queue', JSON.stringify(deletionQueue))
      }

      alert('Your account will be deleted in 3 days. You can cancel this by logging in again.')
      
      if (onDeleteProfile) {
        onDeleteProfile()
      }
      
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error('Error deleting profile:', error)
      alert('Error scheduling deletion. Please try again.')
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
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: '24px',
          maxWidth: '500px',
          width: '100%',
          position: 'relative',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          padding: '20px', 
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {!showDeleteConfirm ? (
            <>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  Account Settings
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Manage your account settings and preferences.
                </p>
              </div>

              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-light)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#ef4444' }}>
                  Danger Zone
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Once you delete your account, it will be scheduled for deletion in 3 days. You can cancel this by logging in again.
                </p>
                <button
                  onClick={handleDeleteProfile}
                  className="btn"
                  style={{
                    width: '100%',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                  }}
                >
                  Delete Account
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#ef4444' }}>
                  Confirm Account Deletion
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Your account will be scheduled for deletion in 3 days. You can cancel this by logging in again before the deletion date.
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  Reason (Optional)
                </label>
                <textarea
                  className="input"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Tell us why you're leaving..."
                  rows={4}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProfile}
                  className="btn"
                  style={{
                    flex: 2,
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                  }}
                >
                  Confirm Deletion
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings
