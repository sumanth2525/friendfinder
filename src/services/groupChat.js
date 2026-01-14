// Group Chat Service using Supabase Realtime
// Handles real-time group messaging based on hobbies/interests

import { supabase } from '../config/supabase'

/**
 * Group Chat Service
 * Provides real-time group messaging functionality using Supabase Realtime
 */
export const groupChatService = {
  /**
   * Get or create a group for a hobby/interest
   * @param {string} hobby - Hobby/interest name
   * @returns {Promise<{data, error}>}
   */
  async getOrCreateGroup(hobby) {
    if (!supabase) {
      // Fallback: return mock group data
      return {
        data: {
          id: `group_${hobby.toLowerCase().replace(/\s+/g, '_')}`,
          name: hobby,
          hobby: hobby,
          created_at: new Date().toISOString(),
        },
        error: null,
      }
    }

    try {
      // Check if group exists
      const { data: existing } = await supabase
        .from('groups')
        .select('*')
        .eq('hobby', hobby)
        .single()

      if (existing) {
        return { data: existing, error: null }
      }

      // Create new group
      const { data, error } = await supabase
        .from('groups')
        .insert({
          name: `${hobby} Enthusiasts`,
          hobby: hobby,
          description: `Connect with people who love ${hobby}`,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      return { data, error }
    } catch (error) {
      // Fallback for errors
      return {
        data: {
          id: `group_${hobby.toLowerCase().replace(/\s+/g, '_')}`,
          name: hobby,
          hobby: hobby,
          created_at: new Date().toISOString(),
        },
        error: null,
      }
    }
  },

  /**
   * Join a group
   * @param {string} groupId - Group ID
   * @param {string} userId - User ID
   * @returns {Promise<{data, error}>}
   */
  async joinGroup(groupId, userId) {
    if (!supabase) {
      return { data: { id: Date.now(), group_id: groupId, user_id: userId }, error: null }
    }

    try {
      // Check if already a member
      const { data: existing } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single()

      if (existing) {
        return { data: existing, error: null }
      }

      // Join group
      const { data, error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          joined_at: new Date().toISOString(),
        })
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  /**
   * Get groups for user's interests
   * @param {Array<string>} interests - User interests
   * @returns {Promise<{data, error}>}
   */
  async getGroupsForInterests(interests) {
    if (!supabase || !interests || interests.length === 0) {
      // Return mock groups based on interests
      return {
        data: interests.map(hobby => ({
          id: `group_${hobby.toLowerCase().replace(/\s+/g, '_')}`,
          name: `${hobby} Enthusiasts`,
          hobby: hobby,
          description: `Connect with people who love ${hobby}`,
          member_count: Math.floor(Math.random() * 50) + 10,
          created_at: new Date().toISOString(),
        })),
        error: null,
      }
    }

    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*, group_members(count)')
        .in('hobby', interests)

      if (error) throw error

      // Format data
      const formatted = (data || []).map(group => ({
        ...group,
        member_count: group.group_members?.[0]?.count || 0,
      }))

      return { data: formatted, error: null }
    } catch (error) {
      // Fallback
      return {
        data: interests.map(hobby => ({
          id: `group_${hobby.toLowerCase().replace(/\s+/g, '_')}`,
          name: `${hobby} Enthusiasts`,
          hobby: hobby,
          description: `Connect with people who love ${hobby}`,
          member_count: Math.floor(Math.random() * 50) + 10,
          created_at: new Date().toISOString(),
        })),
        error: null,
      }
    }
  },

  /**
   * Subscribe to group messages
   * @param {string} groupId - Group ID
   * @param {Function} callback - Callback function for new messages
   * @returns {Function} Unsubscribe function
   */
  subscribeToGroupMessages(groupId, callback) {
    if (!supabase) {
      console.warn('Supabase not configured, real-time group chat unavailable')
      return () => {}
    }

    const channel = supabase
      .channel(`group_messages:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          callback(payload.new)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },

  /**
   * Send a message to a group
   * @param {string} groupId - Group ID
   * @param {string} senderId - Sender user ID
   * @param {string} senderName - Sender name
   * @param {string} content - Message content
   * @returns {Promise<{data, error}>}
   */
  async sendGroupMessage(groupId, senderId, senderName, content) {
    if (!supabase) {
      // Mock message for fallback
      return {
        data: {
          id: Date.now(),
          group_id: groupId,
          sender_id: senderId,
          sender_name: senderName,
          content: content.trim(),
          created_at: new Date().toISOString(),
        },
        error: null,
      }
    }

    try {
      const { data, error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          sender_id: senderId,
          sender_name: senderName,
          content: content.trim(),
        })
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  /**
   * Get messages for a group
   * @param {string} groupId - Group ID
   * @param {number} limit - Number of messages to fetch
   * @returns {Promise<{data, error}>}
   */
  async getGroupMessages(groupId, limit = 100) {
    if (!supabase) {
      return { data: [], error: null }
    }

    try {
      const { data, error } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(limit)

      return { data: data || [], error }
    } catch (error) {
      return { data: [], error }
    }
  },
}
