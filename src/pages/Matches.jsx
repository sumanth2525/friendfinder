import { useState, useEffect } from 'react'
import { getMatches, blockUser, isBlocked, getLikesSent, getLikesReceived } from '../utils/localStorage'
import { formatLastActive } from '../utils/timeUtils'
import { FlagIcon, BanIcon } from '../components/Icons'

const Matches = ({ onSelectMatch }) => {
  const [activeTab, setActiveTab] = useState('matches') // 'likesSent', 'likesReceived', 'matches'
  const [searchQuery, setSearchQuery] = useState('')
  const [matches, setMatches] = useState([])
  const [likesSent, setLikesSent] = useState([])
  const [likesReceived, setLikesReceived] = useState([])

  useEffect(() => {
    const savedMatches = getMatches()
    // Filter out blocked users
    const filtered = savedMatches.filter(m => !isBlocked(m.profile.id))
    setMatches(filtered)
  }, [])

  const getCurrentList = () => {
    if (activeTab === 'likesSent') return likesSent
    if (activeTab === 'likesReceived') return likesReceived
    return matches
  }

  const filteredList = getCurrentList().filter(item => {
    const name = activeTab === 'matches' 
      ? item.profile?.name || item.name || ''
      : item.profile?.name || ''
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const formatTime = (timeStr) => {
    return timeStr
  }

  const handleReport = (match, e) => {
    e.stopPropagation()
    const reason = prompt('Why are you reporting this user?')
    if (reason) {
      alert('Thank you for reporting. We will review this profile.')
      // In real app, send to backend
    }
  }

  const handleBlock = (match, e) => {
    e.stopPropagation()
    if (confirm(`Are you sure you want to block ${match.profile.name}?`)) {
      blockUser(match.profile.id)
      // Remove from matches
      const updatedMatches = matches.filter(m => m.id !== match.id)
      setMatches(updatedMatches)
      alert(`${match.profile.name} has been blocked.`)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>
          Matches
        </h2>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '20px',
          background: 'var(--background)',
          padding: '4px',
          borderRadius: '12px'
        }}>
          <button
            onClick={() => setActiveTab('likesSent')}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'likesSent' ? 'var(--gradient-primary)' : 'transparent',
              color: activeTab === 'likesSent' ? 'white' : 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Likes Sent
          </button>
          <button
            onClick={() => setActiveTab('likesReceived')}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'likesReceived' ? 'var(--gradient-primary)' : 'transparent',
              color: activeTab === 'likesReceived' ? 'white' : 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Likes Received
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'matches' ? 'var(--gradient-primary)' : 'transparent',
              color: activeTab === 'matches' ? 'white' : 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Matches
          </button>
        </div>

        <input
          type="text"
          className="input"
          placeholder={`Search ${activeTab === 'likesSent' ? 'likes sent' : activeTab === 'likesReceived' ? 'likes received' : 'matches'}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ marginBottom: '20px' }}
        />
      </div>

      {filteredList.length === 0 ? (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>
              {activeTab === 'likesSent' ? '❤️' : activeTab === 'likesReceived' ? '💌' : '💕'}
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
              {activeTab === 'likesSent' 
                ? 'No likes sent yet' 
                : activeTab === 'likesReceived' 
                ? 'No likes received yet' 
                : 'No matches yet'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              {activeTab === 'likesSent' 
                ? 'Start swiping right to send likes!' 
                : activeTab === 'likesReceived' 
                ? 'Keep swiping to receive likes!' 
                : 'Start swiping to find your match!'}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeTab === 'matches' ? (
            filteredList.map((match) => (
              <div
                key={match.id}
                className="card"
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectMatch && onSelectMatch(match)}
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '50%',
                        background: `var(--gradient-primary)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '24px',
                        fontWeight: '700',
                        flexShrink: 0,
                        overflow: 'hidden',
                      }}
                    >
                      {match.profile?.name?.charAt(0) || match.name?.charAt(0) || '?'}
                    </div>
                    {match.profile?.online && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '2px',
                          right: '2px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: 'var(--success)',
                          border: '2px solid white',
                        }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {match.profile?.name || match.name}, {match.profile?.age || match.age}
                      </h3>
                      {match.unread > 0 && (
                        <span
                          style={{
                            background: 'var(--primary-color)',
                            color: 'white',
                            borderRadius: '12px',
                            padding: '2px 8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            minWidth: '20px',
                            textAlign: 'center',
                          }}
                        >
                          {match.unread}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      {match.lastMessage || 'Start a conversation'}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        {formatTime(match.lastMessageTime || match.matchedAt || '')}
                      </p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={(e) => handleReport(match, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            color: 'var(--text-secondary)',
                          }}
                          title="Report"
                        >
                          <FlagIcon size={16} />
                        </button>
                        <button
                          onClick={(e) => handleBlock(match, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            color: 'var(--error)',
                          }}
                          title="Block"
                        >
                          <BanIcon size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            filteredList.map((item) => {
              const profile = item.profile || item
              return (
                <div
                  key={item.profileId || item.id || Date.now()}
                  className="card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => profile && onSelectMatch && onSelectMatch({ id: item.profileId || item.id, profile })}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <div
                        style={{
                          width: '70px',
                          height: '70px',
                          borderRadius: '50%',
                          background: `var(--gradient-primary)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '24px',
                          fontWeight: '700',
                          flexShrink: 0,
                          overflow: 'hidden',
                        }}
                      >
                        {profile?.name?.charAt(0) || '?'}
                      </div>
                      {profile?.online && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '2px',
                            right: '2px',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: 'var(--success)',
                            border: '2px solid white',
                          }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {profile?.name || 'Unknown'}, {profile?.age || '?'}
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        {profile?.bio || 'No bio available'}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Recently'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default Matches
