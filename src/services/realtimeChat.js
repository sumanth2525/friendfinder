// Real-time Chat Service using Supabase Realtime
// Handles real-time messaging between matched users

import { supabase } from '../config/supabase'

/**
 * Real-time Chat Service
 * Provides real-time messaging functionality using Supabase Realtime
 */
export const realtimeChatService = {
  /**
   * Subscribe to messages in a conversation
   * @param {string} conversationId - Conversation ID
   * @param {Function} callback - Callback function for new messages
   * @returns {Function} Unsubscribe function
   */
  subscribeToMessages(conversationId, callback) {
    if (!supabase) {
      console.warn('Supabase not configured, real-time chat unavailable')
      return () => {}
    }

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(payload.new)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(payload.new, 'update')
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },

  /**
   * Subscribe to typing indicators
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - Current user ID
   * @param {Function} callback - Callback for typing events
   * @returns {Function} Unsubscribe function
   */
  subscribeToTyping(conversationId, userId, callback) {
    if (!supabase) return () => {}

    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        // Don't show typing indicator for own messages
        if (payload.payload.userId !== userId) {
          callback(payload.payload)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },

  /**
   * Send typing indicator
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID who is typing
   * @param {boolean} isTyping - Whether user is typing
   */
  async sendTypingIndicator(conversationId, userId, isTyping) {
    if (!supabase) return

    const channel = supabase.channel(`typing:${conversationId}`)
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId,
        isTyping,
        timestamp: new Date().toISOString(),
      },
    })
  },

  /**
   * Send a message
   * @param {string} conversationId - Conversation ID
   * @param {string} senderId - Sender user ID
   * @param {string} content - Message content
   * @returns {Promise<{data, error}>}
   */
  async sendMessage(conversationId, senderId, content) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    // Insert message
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content.trim(),
      })
      .select()
      .single()

    if (error) {
      return { data: null, error }
    }

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)

    return { data, error: null }
  },

  /**
   * Mark messages as read
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID marking as read
   * @returns {Promise<{error}>}
   */
  async markAsRead(conversationId, userId) {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } }
    }

    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId) // Don't mark own messages as read
      .is('read_at', null)

    return { error }
  },

  /**
   * Get or create conversation for a match
   * @param {string} matchId - Match ID
   * @returns {Promise<{data, error}>}
   */
  async getOrCreateConversation(matchId) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    // Check if conversation exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('match_id', matchId)
      .single()

    if (existing) {
      return { data: existing, error: null }
    }

    // Create new conversation
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        match_id: matchId,
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single()

    return { data, error }
  },

  /**
   * Get messages for a conversation
   * @param {string} conversationId - Conversation ID
   * @param {number} limit - Number of messages to fetch
   * @returns {Promise<{data, error}>}
   */
  async getMessages(conversationId, limit = 50) {
    if (!supabase) {
      return { data: [], error: null }
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit)

    return { data: data || [], error }
  },

  /**
   * Get unread message count for a conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} userId - User ID
   * @returns {Promise<number>}
   */
  async getUnreadCount(conversationId, userId) {
    if (!supabase) return 0

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .is('read_at', null)

    return count || 0
  },
}
