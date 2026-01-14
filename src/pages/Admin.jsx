import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { adminService } from '../services/adminService'

const Admin = ({ user, onLogout }) => {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('faq') // 'faq', 'login-attempts', 'users', or 'deletion-queue'
  const [loginAttempts, setLoginAttempts] = useState([])
  const [users, setUsers] = useState([])
  const [faqs, setFaqs] = useState([])
  const [deletionQueue, setDeletionQueue] = useState([])
  const [stats, setStats] = useState({
    totalAttempts: 0,
    successfulLogins: 0,
    failedLogins: 0,
    totalUsers: 0,
    activeUsers: 0
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSuccess, setFilterSuccess] = useState(null) // null, true, false
  const [showAddFAQ, setShowAddFAQ] = useState(false)
  const [editingFAQ, setEditingFAQ] = useState(null)
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'general',
    order_index: 0
  })

  // Check if user is admin
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!supabase || !user?.id) {
        setIsAuthorized(false)
        setIsLoading(false)
        return
      }

      try {
        const isAdmin = await adminService.checkAdminAccess(user.id)
        setIsAuthorized(isAdmin)
      } catch (error) {
        console.error('Error checking admin access:', error)
        setIsAuthorized(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminAccess()
  }, [user])

  // Load login attempts
  useEffect(() => {
    if (isAuthorized && activeTab === 'login-attempts') {
      loadLoginAttempts()
    }
  }, [isAuthorized, activeTab, filterSuccess, searchQuery])

  // Load users
  useEffect(() => {
    if (isAuthorized && activeTab === 'users') {
      loadUsers()
    }
  }, [isAuthorized, activeTab])

  // Load FAQs
  useEffect(() => {
    if (isAuthorized && activeTab === 'faq') {
      loadFAQs()
    }
  }, [isAuthorized, activeTab])

  // Load deletion queue
  useEffect(() => {
    if (isAuthorized && activeTab === 'deletion-queue') {
      loadDeletionQueue()
    }
  }, [isAuthorized, activeTab])

  // Load stats
  useEffect(() => {
    if (isAuthorized) {
      loadStats()
    }
  }, [isAuthorized])

  const loadLoginAttempts = async () => {
    try {
      const { data, error } = await adminService.getLoginAttempts({
        limit: 100,
        success: filterSuccess,
        email: searchQuery || null
      })
      if (!error && data) {
        setLoginAttempts(data)
      }
    } catch (error) {
      console.error('Error loading login attempts:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const { data, error } = await adminService.getAllUsers()
      if (!error && data) {
        setUsers(data)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await adminService.getAdminStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadFAQs = async () => {
    try {
      const { data, error } = await adminService.getFAQs()
      if (!error && data) {
        setFaqs(data.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)))
      }
    } catch (error) {
      console.error('Error loading FAQs:', error)
    }
  }

  const handleSaveFAQ = async () => {
    try {
      if (editingFAQ) {
        const { error } = await adminService.updateFAQ(editingFAQ.id, faqForm)
        if (error) {
          alert('Error updating FAQ: ' + error.message)
        } else {
          alert('FAQ updated successfully!')
          setShowAddFAQ(false)
          setEditingFAQ(null)
          setFaqForm({ question: '', answer: '', category: 'general', order_index: 0 })
          loadFAQs()
        }
      } else {
        const { error } = await adminService.createFAQ(faqForm)
        if (error) {
          alert('Error creating FAQ: ' + error.message)
        } else {
          alert('FAQ created successfully!')
          setShowAddFAQ(false)
          setFaqForm({ question: '', answer: '', category: 'general', order_index: 0 })
          loadFAQs()
        }
      }
    } catch (error) {
      alert('Error saving FAQ: ' + error.message)
    }
  }

  const handleDeleteFAQ = async (faqId) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return
    
    try {
      const { error } = await adminService.deleteFAQ(faqId)
      if (error) {
        alert('Error deleting FAQ: ' + error.message)
      } else {
        alert('FAQ deleted successfully!')
        loadFAQs()
      }
    } catch (error) {
      alert('Error deleting FAQ: ' + error.message)
    }
  }

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete ${userName}'s account? This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await adminService.deleteUserAccount(userId)
      if (error) {
        alert('Error deleting user: ' + error.message)
      } else {
        alert('User account deleted successfully')
        loadUsers()
        loadStats()
      }
    } catch (error) {
      alert('Error deleting user: ' + error.message)
    }
  }

  const loadDeletionQueue = async () => {
    try {
      const { data, error } = await adminService.getDeletionQueue()
      if (!error && data) {
        setDeletionQueue(data)
      }
    } catch (error) {
      console.error('Error loading deletion queue:', error)
    }
  }

  const handleCancelDeletion = async (deletionId) => {
    if (!confirm('Are you sure you want to cancel this scheduled deletion?')) {
      return
    }

    try {
      const { error } = await adminService.cancelDeletion(deletionId)
      if (error) {
        alert('Error cancelling deletion: ' + error.message)
      } else {
        alert('Deletion cancelled successfully')
        loadDeletionQueue()
      }
    } catch (error) {
      alert('Error cancelling deletion: ' + error.message)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getIPInfo = (ip) => {
    if (!ip) return 'N/A'
    return ip
  }

  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>
          Checking admin access...
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--error)', marginBottom: '16px' }}>
          Access Denied
        </div>
        <div style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          You do not have admin privileges to access this panel.
        </div>
        <button className="btn btn-primary" onClick={onLogout}>
          Logout
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Admin Panel
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Monitor login attempts and manage user accounts
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div className="card">
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Login Attempts</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-color)' }}>
            {stats.totalAttempts}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Successful Logins</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--success)' }}>
            {stats.successfulLogins}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Failed Logins</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--error)' }}>
            {stats.failedLogins}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Users</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--info)' }}>
            {stats.totalUsers}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Active Users</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--success)' }}>
            {stats.activeUsers}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '20px',
        borderBottom: '2px solid var(--border-color)',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveTab('faq')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'faq' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'faq' ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'faq' ? '600' : '400',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          FAQ Management
        </button>
        <button
          onClick={() => setActiveTab('login-attempts')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'login-attempts' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'login-attempts' ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'login-attempts' ? '600' : '400',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Login Attempts
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'users' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'users' ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'users' ? '600' : '400',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('deletion-queue')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'deletion-queue' ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === 'deletion-queue' ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'deletion-queue' ? '600' : '400',
            cursor: 'pointer',
            fontSize: '16px',
            position: 'relative'
          }}
        >
          Deletion Queue
          {deletionQueue.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
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
              {deletionQueue.length}
            </span>
          )}
        </button>
      </div>

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Frequently Asked Questions
            </h2>
            <button
              onClick={() => {
                setEditingFAQ(null)
                setFaqForm({ question: '', answer: '', category: 'general', order_index: 0 })
                setShowAddFAQ(true)
              }}
              className="btn btn-primary"
            >
              + Add FAQ
            </button>
          </div>

          {/* FAQ List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {faqs.length === 0 ? (
              <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No FAQs found. Click "Add FAQ" to create one.
              </div>
            ) : (
              faqs.map((faq) => (
                <div key={faq.id} className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: 'var(--primary-100)',
                        color: 'var(--primary-color)',
                        marginBottom: '8px'
                      }}>
                        {faq.category}
                      </div>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                        {faq.question}
                      </h3>
                      <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {faq.answer}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                      <button
                        onClick={() => {
                          setEditingFAQ(faq)
                          setFaqForm({
                            question: faq.question,
                            answer: faq.answer,
                            category: faq.category,
                            order_index: faq.order_index || 0
                          })
                          setShowAddFAQ(true)
                        }}
                        className="btn"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteFAQ(faq.id)}
                        className="btn"
                        style={{ 
                          padding: '6px 12px', 
                          fontSize: '12px',
                          background: 'var(--error-light)',
                          color: 'var(--error)',
                          border: '1px solid var(--error)'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {!faq.is_active && (
                    <div style={{ fontSize: '12px', color: 'var(--warning)', fontStyle: 'italic' }}>
                      (Inactive)
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add/Edit FAQ Modal */}
          {showAddFAQ && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '20px'
            }} onClick={() => setShowAddFAQ(false)}>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '30px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto'
              }} onClick={(e) => e.stopPropagation()}>
                <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px', color: 'var(--text-primary)' }}>
                  {editingFAQ ? 'Edit FAQ' : 'Add FAQ'}
                </h2>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    Question
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={faqForm.question}
                    onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                    placeholder="Enter question..."
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    Answer
                  </label>
                  <textarea
                    className="input"
                    value={faqForm.answer}
                    onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                    placeholder="Enter answer..."
                    rows={6}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      Category
                    </label>
                    <select
                      className="input"
                      value={faqForm.category}
                      onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                      style={{ width: '100%' }}
                    >
                      <option value="general">General</option>
                      <option value="account">Account</option>
                      <option value="matching">Matching</option>
                      <option value="messaging">Messaging</option>
                      <option value="safety">Safety</option>
                      <option value="billing">Billing</option>
                      <option value="technical">Technical</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      Order Index
                    </label>
                    <input
                      type="number"
                      className="input"
                      value={faqForm.order_index}
                      onChange={(e) => setFaqForm({ ...faqForm, order_index: parseInt(e.target.value) || 0 })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowAddFAQ(false)
                      setEditingFAQ(null)
                      setFaqForm({ question: '', answer: '', category: 'general', order_index: 0 })
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveFAQ}
                    className="btn btn-primary"
                    disabled={!faqForm.question.trim() || !faqForm.answer.trim()}
                  >
                    {editingFAQ ? 'Update' : 'Create'} FAQ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Login Attempts Tab */}
      {activeTab === 'login-attempts' && (
        <div>
          {/* Filters */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <input
              type="text"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: '1',
                minWidth: '200px',
                padding: '10px 16px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
            <select
              value={filterSuccess === null ? 'all' : filterSuccess.toString()}
              onChange={(e) => {
                const value = e.target.value
                setFilterSuccess(value === 'all' ? null : value === 'true')
              }}
              style={{
                padding: '10px 16px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              <option value="all">All Attempts</option>
              <option value="true">Successful Only</option>
              <option value="false">Failed Only</option>
            </select>
            <button
              onClick={loadLoginAttempts}
              className="btn btn-primary"
              style={{ padding: '10px 20px' }}
            >
              Refresh
            </button>
          </div>

          {/* Login Attempts Table */}
          <div className="card" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Time</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Email/Phone</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>IP Address</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Reason</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>User</th>
                </tr>
              </thead>
              <tbody>
                {loginAttempts.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No login attempts found
                    </td>
                  </tr>
                ) : (
                  loginAttempts.map((attempt) => (
                    <tr key={attempt.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {formatDate(attempt.attempted_at)}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-primary)' }}>
                        {attempt.email || attempt.phone || 'N/A'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                        {getIPInfo(attempt.ip_address)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: attempt.success ? 'var(--success-light)' : 'var(--error-light)',
                          color: attempt.success ? 'var(--success)' : 'var(--error)',
                        }}>
                          {attempt.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {attempt.failure_reason || '-'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {attempt.user_email || attempt.user_phone || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="card" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Phone</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Created</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>
                        {user.profile?.display_name || 'N/A'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {user.email || '-'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {user.phone || '-'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: user.status === 'active' ? 'var(--success-light)' : 'var(--error-light)',
                          color: user.status === 'active' ? 'var(--success)' : 'var(--error)',
                        }}>
                          {user.status || 'active'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {formatDate(user.created_at)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.profile?.display_name || user.email || 'User')}
                          className="btn"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            background: 'var(--error-light)',
                            color: 'var(--error)',
                            border: '1px solid var(--error)',
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deletion Queue Tab */}
      {activeTab === 'deletion-queue' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Scheduled Account Deletions
            </h2>
            <button
              onClick={loadDeletionQueue}
              className="btn btn-primary"
              style={{ padding: '10px 20px' }}
            >
              Refresh
            </button>
          </div>

          <div className="card" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Email/Phone</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Reason</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Scheduled For</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Created</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deletionQueue.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No scheduled deletions
                    </td>
                  </tr>
                ) : (
                  deletionQueue.map((item) => {
                    const scheduledDate = new Date(item.scheduled_deletion_at || item.scheduledDeletionAt)
                    const daysUntil = Math.ceil((scheduledDate - new Date()) / (1000 * 60 * 60 * 24))
                    const isOverdue = daysUntil < 0
                    
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>
                          {item.user?.email || item.email || 'N/A'}
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {item.email || item.phone || '-'}
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {item.reason || 'User requested'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: item.status === 'pending' 
                              ? (isOverdue ? 'var(--error-light)' : 'var(--warning-light)')
                              : item.status === 'cancelled' 
                                ? 'var(--success-light)' 
                                : 'var(--error-light)',
                            color: item.status === 'pending' 
                              ? (isOverdue ? 'var(--error)' : 'var(--warning)')
                              : item.status === 'cancelled' 
                                ? 'var(--success)' 
                                : 'var(--error)',
                          }}>
                            {item.status || 'pending'} {isOverdue && item.status === 'pending' ? '(Overdue)' : ''}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {formatDate(item.scheduled_deletion_at || item.scheduledDeletionAt)}
                          {daysUntil >= 0 && (
                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                              {daysUntil === 0 ? 'Today' : `${daysUntil} day${daysUntil === 1 ? '' : 's'} remaining`}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {formatDate(item.created_at || item.createdAt)}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {item.status === 'pending' && (
                            <button
                              onClick={() => handleCancelDeletion(item.id)}
                              className="btn"
                              style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                background: 'var(--success-light)',
                                color: 'var(--success)',
                                border: '1px solid var(--success)',
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin
