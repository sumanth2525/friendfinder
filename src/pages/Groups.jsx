import { useState, useEffect, useRef } from 'react'
import { getUser } from '../utils/localStorage'
import { formatTime } from '../utils/timeUtils'
import { groupChatService } from '../services/groupChat'

const Groups = () => {
  const currentUser = getUser()
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [groups, setGroups] = useState([])
  const [messages, setMessages] = useState({})
  const [messageText, setMessageText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const unsubscribeRefs = useRef({})

  // Default hobby groups
  const defaultHobbies = [
    'Music', 'Travel', 'Photography', 'Coffee', 'Reading', 'Art', 'Hiking',
    'Cooking', 'Fitness', 'Gaming', 'Movies', 'Yoga', 'Writing', 'Technology',
    'Dancing', 'Anime', 'Theater', 'Wine', 'Meditation', 'Wellness', 'Nature',
  ]

  // Load groups based on user interests
  useEffect(() => {
    const loadGroups = async () => {
      setIsLoading(true)
      const userInterests = currentUser?.interests || defaultHobbies.slice(0, 6)
      
      const { data } = await groupChatService.getGroupsForInterests(userInterests)
      setGroups(data || [])
      setIsLoading(false)
    }

    loadGroups()
  }, [currentUser])

  // Load messages when group is selected
  useEffect(() => {
    if (!selectedGroup) return

    const loadMessages = async () => {
      const { data } = await groupChatService.getGroupMessages(selectedGroup.id)
      setMessages(prev => ({
        ...prev,
        [selectedGroup.id]: data || [],
      }))
    }

    loadMessages()

    // Subscribe to new messages
    const unsubscribe = groupChatService.subscribeToGroupMessages(
      selectedGroup.id,
      (newMessage) => {
        setMessages(prev => ({
          ...prev,
          [selectedGroup.id]: [...(prev[selectedGroup.id] || []), newMessage],
        }))
      }
    )

    unsubscribeRefs.current[selectedGroup.id] = unsubscribe

    return () => {
      if (unsubscribeRefs.current[selectedGroup.id]) {
        unsubscribeRefs.current[selectedGroup.id]()
      }
    }
  }, [selectedGroup])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, selectedGroup])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!messageText.trim() || !selectedGroup || !currentUser?.id) return

    const content = messageText.trim()
    setMessageText('')

    await groupChatService.sendGroupMessage(
      selectedGroup.id,
      currentUser.id,
      currentUser.name || 'Anonymous',
      content
    )
  }

  const handleJoinGroup = async (group) => {
    if (!currentUser?.id) return

    await groupChatService.joinGroup(group.id, currentUser.id)
    setSelectedGroup(group)
  }

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 'calc(100vh - 200px)',
        color: 'var(--text-secondary)'
      }}>
        <div>Loading groups...</div>
      </div>
    )
  }

  // Show group chat view
  if (selectedGroup) {
    const groupMessages = messages[selectedGroup.id] || []

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <button
            onClick={() => setSelectedGroup(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: '700',
              flexShrink: 0,
            }}
          >
            {selectedGroup.hobby?.charAt(0) || 'G'}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {selectedGroup.name || selectedGroup.hobby}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {selectedGroup.member_count || 0} members
            </p>
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: 'var(--background)',
          }}
        >
          {groupMessages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              color: 'var(--text-secondary)'
            }}>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            groupMessages.map((message) => {
              const isCurrentUser = message.sender_id === currentUser?.id
              
              return (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '75%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {!isCurrentUser && (
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '0 8px' }}>
                        {message.sender_name || 'Anonymous'}
                      </span>
                    )}
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: '18px',
                        background: isCurrentUser
                          ? 'var(--gradient-primary)'
                          : 'var(--surface)',
                        color: isCurrentUser ? 'white' : 'var(--text-primary)',
                        boxShadow: 'var(--shadow-sm)',
                        border: isCurrentUser ? 'none' : '1px solid var(--border-light)',
                      }}
                    >
                      <p style={{ fontSize: '15px', lineHeight: '1.4', margin: 0 }}>
                        {message.content}
                      </p>
                      <span
                        style={{
                          fontSize: '11px',
                          opacity: 0.7,
                          marginTop: '4px',
                          display: 'block',
                        }}
                      >
                        {formatTime(new Date(message.created_at).getTime())}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSendMessage}
          style={{
            padding: '16px 20px',
            background: 'var(--surface)',
            borderTop: '1px solid var(--border-light)',
            display: 'flex',
            gap: '12px',
          }}
        >
          <input
            type="text"
            className="input"
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            style={{ flex: 1, margin: 0 }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '12px 24px', minWidth: 'auto' }}
            disabled={!messageText.trim()}
          >
            Send
          </button>
        </form>
      </div>
    )
  }

  // Show groups list
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
          Groups
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Join groups based on your hobbies and interests
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <div className="empty-state-text">No groups found</div>
          <div className="empty-state-subtext">Add interests to your profile to see groups</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '80px' }}>
          {groups.map((group) => (
            <div
              key={group.id}
              className="card"
              style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
              onClick={() => handleJoinGroup(group)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '16px',
                    background: 'var(--gradient-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: '700',
                    flexShrink: 0,
                  }}
                >
                  {group.hobby?.charAt(0) || 'G'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>
                    {group.name || group.hobby}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    {group.description || `Connect with people who love ${group.hobby}`}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      👥 {group.member_count || 0} members
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--primary-color)', fontWeight: '600' }}>
                      Join →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Groups
