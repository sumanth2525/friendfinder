import { useState, useEffect, useRef } from 'react'
import { messages } from '../data/datingProfiles'
import { getMatches, blockUser, saveMatches } from '../utils/localStorage'
import { formatLastActive, formatTime } from '../utils/timeUtils'
import { FlagIcon, BanIcon, CheckIcon } from '../components/Icons'

const Messages = ({ selectedMatchId, onBack }) => {
  const [messageText, setMessageText] = useState('')
  const [currentMessages, setCurrentMessages] = useState([])
  const messagesEndRef = useRef(null)

  const [match, setMatch] = useState(null)
  const matchMessages = messages[selectedMatchId] || []
  
  // Mark messages as read when viewing
  useEffect(() => {
    if (match && currentMessages.length > 0) {
      const updatedMessages = currentMessages.map(msg => {
        if (msg.senderId !== 'current' && !msg.read) {
          return { ...msg, read: true, readAt: Date.now() }
        }
        return msg
      })
      setCurrentMessages(updatedMessages)
      
      // Update match unread count
      const savedMatches = getMatches()
      const updatedMatches = savedMatches.map(m => {
        if (m.id === selectedMatchId) {
          return { ...m, unread: 0 }
        }
        return m
      })
      saveMatches(updatedMatches)
    }
  }, [selectedMatchId, match])

  useEffect(() => {
    const savedMatches = getMatches()
    const foundMatch = savedMatches.find(m => m.id === selectedMatchId)
    setMatch(foundMatch)
  }, [selectedMatchId])

  useEffect(() => {
    setCurrentMessages(matchMessages)
  }, [selectedMatchId, matchMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!messageText.trim()) return

    const newMessage = {
      id: currentMessages.length + 1,
      senderId: 'current',
      text: messageText,
      timestamp: Date.now(),
      read: false, // Will be read when they view it
    }

    setCurrentMessages([...currentMessages, newMessage])
    setMessageText('')
  }

  const handleReport = () => {
    const reason = prompt('Why are you reporting this user?')
    if (reason) {
      alert('Thank you for reporting. We will review this profile.')
    }
  }

  const handleBlock = () => {
    if (confirm(`Are you sure you want to block ${match?.profile.name}?`)) {
      blockUser(match.profile.id)
      alert(`${match.profile.name} has been blocked.`)
      if (onBack) onBack()
    }
  }

  if (!match) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Select a match to start messaging</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          background: 'white',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        {onBack && (
          <button
            onClick={onBack}
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
        )}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '16px',
            fontWeight: '700',
            flexShrink: 0,
          }}
        >
          {match.profile.name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {match.profile.name}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {formatLastActive(match.profile.online ? 'Active now' : match.profile.lastActive)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleReport}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              color: 'var(--text-secondary)',
            }}
            title="Report"
          >
            <FlagIcon size={18} />
          </button>
          <button
            onClick={handleBlock}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              color: 'var(--error)',
            }}
            title="Block"
          >
            <BanIcon size={18} />
          </button>
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
        }}
      >
        {currentMessages.map((message) => {
          const isCurrentUser = message.senderId === 'current'
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
                  {message.text}
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '4px',
                    marginTop: '4px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      opacity: 0.7,
                      marginBottom: 0,
                    }}
                  >
                    {formatTime(message.timestamp)}
                  </span>
                  {isCurrentUser && (
                    <CheckIcon
                      size={12}
                      style={{
                        opacity: message.read ? 1 : 0.5,
                        color: message.read ? '#3b82f6' : 'currentColor',
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        style={{
          padding: '16px 20px',
          background: 'white',
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

export default Messages
