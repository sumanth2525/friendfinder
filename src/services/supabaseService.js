// Supabase Service Layer
// Centralized service functions for all Supabase operations

import { supabase } from '../config/supabase'

// ============================================================================
// AUTHENTICATION SERVICE
// ============================================================================
export const authService = {
  /**
   * Sign up a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} metadata - Additional user metadata
   * @returns {Promise<{data, error}>}
   */
  async signUp(email, password, metadata = {}) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { data, error }
  },

  /**
   * Sign in with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{data, error}>}
   */
  async signIn(email, password) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  /**
   * Sign in with phone (OTP)
   * @param {string} phone - User phone number
   * @returns {Promise<{data, error}>}
   */
  async signInWithPhone(phone) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    const { data, error } = await supabase.auth.signInWithOtp({
      phone
    })
    return { data, error }
  },

  /**
   * Verify OTP
   * @param {string} phone - User phone number
   * @param {string} token - OTP token
   * @returns {Promise<{data, error}>}
   */
  async verifyOTP(phone, token) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    })
    return { data, error }
  },

  /**
   * Sign out current user
   * @returns {Promise<{error}>}
   */
  async signOut() {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } }
    }

    const { error } = await supabase.auth.signOut()
    return { error }
  },

  /**
   * Get current authenticated user
   * @returns {Promise<User|null>}
   */
  async getCurrentUser() {
    if (!supabase) return null

    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  /**
   * Subscribe to auth state changes
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  onAuthStateChange(callback) {
    if (!supabase) return () => {}

    return supabase.auth.onAuthStateChange(callback)
  }
}

// ============================================================================
// PROFILE SERVICE
// ============================================================================
export const profileService = {
  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Promise<{data, error}>}
   */
  async getProfile(userId) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    return { data, error }
  },

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Profile updates
   * @returns {Promise<{data, error}>}
   */
  async updateProfile(userId, updates) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)

    return { data, error }
  },

  /**
   * Create user profile
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data
   * @returns {Promise<{data, error}>}
   */
  async createProfile(userId, profileData) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        ...profileData
      })

    return { data, error }
  }
}

// ============================================================================
// MATCH SERVICE
// ============================================================================
export const matchService = {
  /**
   * Get potential matches for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of matches to return
   * @returns {Promise<{data, error}>}
   */
  async getPotentialMatches(userId, limit = 20) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    const { data, error } = await supabase
      .rpc('get_potential_matches', {
        p_user_id: userId,
        p_limit: limit
      })

    return { data, error }
  },

  /**
   * Get all matches for a user
   * @param {string} userId - User ID
   * @returns {Promise<{data, error}>}
   */
  async getMatches(userId) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        user1:users!matches_user1_id_fkey(id, email),
        user2:users!matches_user2_id_fkey(id, email)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('status', 'ACTIVE')
      .order('matched_at', { ascending: false })

    return { data, error }
  },

  /**
   * Calculate match percentage between two users
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {Promise<{data, error}>}
   */
  async calculateMatchPercentage(userId1, userId2) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    const { data, error } = await supabase
      .rpc('calculate_match_percentage', {
        p_user1_id: userId1,
        p_user2_id: userId2
      })

    return { data, error }
  }
}

// ============================================================================
// SWIPE SERVICE
// ============================================================================
export const swipeService = {
  /**
   * Record a swipe action
   * @param {string} fromUserId - User who swiped
   * @param {string} toUserId - User who was swiped on
   * @param {string} action - 'LIKE', 'DISLIKE', or 'SUPERLIKE'
   * @returns {Promise<{data, error}>}
   */
  async swipeProfile(fromUserId, toUserId, action) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    const { data, error } = await supabase
      .from('swipes')
      .insert({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        action: action.toUpperCase()
      })

    return { data, error }
  }
}

// ============================================================================
// MESSAGE SERVICE
// ============================================================================
export const messageService = {
  /**
   * Get messages for a conversation
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<{data, error}>}
   */
  async getMessages(conversationId) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    return { data, error }
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

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content.trim()
      })

    return { data, error }
  },

  /**
   * Get conversations for a user
   * @param {string} userId - User ID
   * @returns {Promise<{data, error}>}
   */
  async getConversations(userId) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        match:matches!conversations_match_id_fkey(*)
      `)
      .or(`match.user1_id.eq.${userId},match.user2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false })

    return { data, error }
  }
}

// ============================================================================
// INTEREST SERVICE
// ============================================================================
export const interestService = {
  /**
   * Get all available interests
   * @returns {Promise<{data, error}>}
   */
  async getInterests() {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    const { data, error } = await supabase
      .from('interests')
      .select('*')
      .order('name', { ascending: true })

    return { data, error }
  },

  /**
   * Get user's interests
   * @param {string} userId - User ID
   * @returns {Promise<{data, error}>}
   */
  async getUserInterests(userId) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    const { data, error } = await supabase
      .from('user_interests')
      .select(`
        *,
        interest:interests(*)
      `)
      .eq('user_id', userId)

    return { data, error }
  },

  /**
   * Add interests to user
   * @param {string} userId - User ID
   * @param {Array<string>} interestIds - Array of interest IDs
   * @returns {Promise<{data, error}>}
   */
  async addUserInterests(userId, interestIds) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    const records = interestIds.map(interestId => ({
      user_id: userId,
      interest_id: interestId
    }))

    const { data, error } = await supabase
      .from('user_interests')
      .insert(records)

    return { data, error }
  }
}

// ============================================================================
// STATS SERVICE
// ============================================================================
export const statsService = {
  /**
   * Get member statistics
   * @returns {Promise<{data, error}>}
   */
  async getMemberStats() {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    const { data, error } = await supabase
      .rpc('get_member_stats')

    return { data, error }
  }
}
