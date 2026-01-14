import { useState, useEffect, useRef, useCallback } from 'react'
import { messages } from '../data/datingProfiles'
import { getMatches, blockUser, saveMatches, getUser } from '../utils/localStorage'
import { formatLastActive, formatTime } from '../utils/timeUtils'
import { FlagIcon, BanIcon, CheckIcon } from '../components/Icons'
import { realtimeChatService } from '../services/realtimeChat'
import { supabase } from '../config/supabase'

const Messages = ({ selectedMatchId, onBack }) => {
  const currentUser = getUser()
  const [messageText, setMessageText] = useState('')
  const [currentMessages, setCurrentMessages] = useState([])
  const messagesEndRef = useRef(null)
  const [conversationId, setConversationId] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const typingTimeoutRef = useRef(null)
  const unsubscribeMessagesRef = useRef(null)
  const unsubscribeTypingRef = useRef(null)
  const [useRealtime, setUseRealtime] = useState(false)

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
    // Use prop match if provided, otherwise find from localStorage
    const foundMatch = propMatch || getMatches().find(m => m.id === selectedMatchId)
    setMatch(foundMatch)
    
    // Check if we should use real-time (if Supabase is configured and match has real ID)
    if (supabase && foundMatch?.id && currentUser?.id) {
      setUseRealtime(true)
      initRealtimeChat(foundMatch.id)
    } else {
      setUseRealtime(false)
      setCurrentMessages(matchMessages)
    }
  }, [selectedMatchId, currentUser?.id, propMatch])

  // Initialize real-time chat
  const initRealtimeChat = async (matchId) => {
    if (!supabase || !currentUser?.id) return

    try {
      // Get or create conversation
      const { data: conversation, error } = await realtimeChatService.getOrCreateConversation(matchId)
      
      if (error) {
        console.error('Error getting conversation:', error)
        setUseRealtime(false)
        setCurrentMessages(matchMessages)
        return
      }

      setConversationId(conversation.id)

      // Load existing messages
      const { data: existingMessages } = await realtimeChatService.getMessages(conversation.id, 100)
      if (existingMessages) {
        setCurrentMessages(existingMessages)
      }

      // Subscribe to new messages
      unsubscribeMessagesRef.current = realtimeChatService.subscribeToMessages(
        conversation.id,
        (newMessage) => {
          setCurrentMessages(prev => {
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev
            }
            return [...prev, newMessage]
          })
        }
      )

      // Subscribe to typing indicators
      unsubscribeTypingRef.current = realtimeChatService.subscribeToTyping(
        conversation.id,
        currentUser.id,
        (payload) => {
          setOtherUserTyping(payload.isTyping)
          setTimeout(() => setOtherUserTyping(false), 3000)
        }
      )

      // Mark messages as read
      realtimeChatService.markAsRead(conversation.id, currentUser.id)
    } catch (error) {
      console.error('Error initializing real-time chat:', error)
      setUseRealtime(false)
      setCurrentMessages(matchMessages)
    }
  }

  // Cleanup subscriptions
  useEffect(() => {
    return () => {
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current()
      }
      if (unsubscribeTypingRef.current) {
        unsubscribeTypingRef.current()
      }
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages])

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!conversationId || !currentUser?.id || !useRealtime) return

    setIsTyping(true)
    realtimeChatService.sendTypingIndicator(conversationId, currentUser.id, true)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      realtimeChatService.sendTypingIndicator(conversationId, currentUser.id, false)
    }, 2000)
  }, [conversationId, currentUser?.id, useRealtime])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!messageText.trim()) return

    const content = messageText.trim()
    setMessageText('')

    // Stop typing indicator
    if (useRealtime) {
      setIsTyping(false)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (conversationId && currentUser?.id) {
        realtimeChatService.sendTypingIndicator(conversationId, currentUser.id, false)
      }
    }

    // Use real-time if available
    if (useRealtime && conversationId && currentUser?.id) {
      const { error } = await realtimeChatService.sendMessage(
        conversationId,
        currentUser.id,
        content
      )

      if (error) {
        console.error('Error sending message:', error)
        alert('Failed to send message. Please try again.')
        setMessageText(content) // Restore message text
      }
    } else {
      // Fallback to localStorage
      const newMessage = {
        id: currentMessages.length + 1,
        senderId: 'current',
        text: content,
        timestamp: Date.now(),
        read: false,
      }
      setCurrentMessages([...currentMessages, newMessage])
    }
  }

  const handleReport = () => {
    const reason = prompt('Why are you reporting this user?')
    if (reason) {
      alert('Thank you for reporting. We will review this profile.')
    }
  }

  const handleBlock = () => {
    if (!match?.profile) {
      alert('Unable to block user: Invalid profile')
      return
    }
    
    const profileName = match.profile.name || 'this user'
    const profileId = match.profile.id
    
    if (!profileId) {
      alert('Unable to block user: Invalid profile ID')
      return
    }
    
    if (confirm(`Are you sure you want to block ${profileName}?`)) {
      blockUser(profileId)
      alert(`${profileName} has been blocked.`)
      if (onBack) onBack()
    }
  }

  if (!match || !match.profile) {
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
          {match.profile?.name?.charAt(0) || '?'}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {match.profile?.name || 'Unknown'}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {otherUserTyping ? (
              <span style={{ color: 'var(--primary-color)', fontStyle: 'italic' }}>typing...</span>
            ) : match.profile?.online ? (
              'Active now'
            ) : (
              formatLastActive(match.profile?.lastActive || '')
            )}
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
        {currentMessages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            color: 'var(--text-secondary)'
          }}>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          currentMessages.map((message) => {
            // Handle both real-time (Supabase) and localStorage formats
            const isCurrentUser = useRealtime 
              ? message.sender_id === currentUser?.id
              : message.senderId === 'current'
            const messageText = useRealtime ? message.content : message.text
            const messageTimestamp = useRealtime 
              ? new Date(message.created_at).getTime()
              : message.timestamp
            const isRead = useRealtime 
              ? message.read_at !== null
              : message.read

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
                    {messageText}
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
                      {formatTime(messageTimestamp)}
                    </span>
                    {isCurrentUser && (
                      <CheckIcon
                        size={12}
                        style={{
                          opacity: isRead ? 1 : 0.5,
                          color: isRead ? '#3b82f6' : 'currentColor',
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        
        {/* Typing Indicator */}
        {otherUserTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '18px',
                background: 'var(--surface)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontStyle: 'italic',
              }}
            >
              typing...
            </div>
          </div>
        )}
        
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
          disabled={!messageText.trim() || (useRealtime && !conversationId)}
        >
          Send
        </button>
      </form>
    </div>
  )
}

export default Messages
