// Admin Service Layer
// Functions for admin panel operations

import { supabase } from '../config/supabase'

export const adminService = {
  /**
   * Check if user has admin access
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async checkAdminAccess(userId) {
    if (!supabase || !userId) return false

    try {
      const { data, error } = await supabase
        .rpc('is_admin', { p_user_id: userId })

      if (error) {
        console.error('Error checking admin access:', error)
        return false
      }

      return data === true
    } catch (error) {
      console.error('Error in checkAdminAccess:', error)
      return false
    }
  },

  /**
   * Track a login attempt
   * @param {Object} attemptData - Login attempt data
   * @returns {Promise<{data, error}>}
   */
  async trackLoginAttempt(attemptData) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    try {
      const { data, error } = await supabase
        .rpc('track_login_attempt', {
          p_email: attemptData.email || null,
          p_phone: attemptData.phone || null,
          p_ip_address: attemptData.ipAddress || null,
          p_user_agent: attemptData.userAgent || null,
          p_success: attemptData.success || false,
          p_failure_reason: attemptData.failureReason || null,
          p_user_id: attemptData.userId || null
        })

      return { data, error }
    } catch (error) {
      console.error('Error tracking login attempt:', error)
      return { data: null, error }
    }
  },

  /**
   * Get login attempts (admin only)
   * @param {Object} options - Query options
   * @returns {Promise<{data, error}>}
   */
  async getLoginAttempts(options = {}) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    try {
      const { data, error } = await supabase
        .rpc('get_login_attempts', {
          p_limit: options.limit || 100,
          p_offset: options.offset || 0,
          p_success: options.success !== undefined ? options.success : null,
          p_email: options.email || null
        })

      return { data, error }
    } catch (error) {
      console.error('Error getting login attempts:', error)
      return { data: null, error }
    }
  },

  /**
   * Get all users (admin only)
   * @returns {Promise<{data, error}>}
   */
  async getAllUsers() {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          profile:profiles(*)
        `)
        .order('created_at', { ascending: false })

      return { data, error }
    } catch (error) {
      console.error('Error getting users:', error)
      return { data: null, error }
    }
  },

  /**
   * Delete user account (admin only)
   * @param {string} userId - User ID to delete
   * @returns {Promise<{data, error}>}
   */
  async deleteUserAccount(userId) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    try {
      const { data, error } = await supabase
        .rpc('delete_user_account', { p_user_id: userId })

      return { data, error }
    } catch (error) {
      console.error('Error deleting user account:', error)
      return { data: null, error }
    }
  },

  /**
   * Get admin statistics
   * @returns {Promise<Object>}
   */
  async getAdminStats() {
    if (!supabase) {
      return {
        totalAttempts: 0,
        successfulLogins: 0,
        failedLogins: 0,
        totalUsers: 0,
        activeUsers: 0
      }
    }

    try {
      // Get login attempts stats
      const { count: totalAttempts } = await supabase
        .from('login_attempts')
        .select('*', { count: 'exact', head: true })

      const { count: successfulLogins } = await supabase
        .from('login_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('success', true)

      const { count: failedLogins } = await supabase
        .from('login_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('success', false)

      // Get user stats
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      return {
        totalAttempts: totalAttempts || 0,
        successfulLogins: successfulLogins || 0,
        failedLogins: failedLogins || 0,
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0
      }
    } catch (error) {
      console.error('Error getting admin stats:', error)
      return {
        totalAttempts: 0,
        successfulLogins: 0,
        failedLogins: 0,
        totalUsers: 0,
        activeUsers: 0
      }
    }
  },

  /**
   * Get all FAQs
   * @returns {Promise<{data, error}>}
   */
  async getFAQs() {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false })

      return { data, error }
    } catch (error) {
      console.error('Error getting FAQs:', error)
      return { data: null, error }
    }
  },

  /**
   * Create FAQ (admin only)
   * @param {Object} faqData - FAQ data
   * @returns {Promise<{data, error}>}
   */
  async createFAQ(faqData) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    try {
      const { data, error } = await supabase
        .from('faqs')
        .insert({
          question: faqData.question,
          answer: faqData.answer,
          category: faqData.category || 'general',
          order_index: faqData.order_index || 0,
          is_active: true
        })
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error creating FAQ:', error)
      return { data: null, error }
    }
  },

  /**
   * Update FAQ (admin only)
   * @param {string} faqId - FAQ ID
   * @param {Object} updates - FAQ updates
   * @returns {Promise<{data, error}>}
   */
  async updateFAQ(faqId, updates) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    try {
      const { data, error } = await supabase
        .from('faqs')
        .update({
          question: updates.question,
          answer: updates.answer,
          category: updates.category,
          order_index: updates.order_index,
          updated_at: new Date().toISOString()
        })
        .eq('id', faqId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error updating FAQ:', error)
      return { data: null, error }
    }
  },

  /**
   * Delete FAQ (admin only)
   * @param {string} faqId - FAQ ID
   * @returns {Promise<{data, error}>}
   */
  async deleteFAQ(faqId) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } }
    }

    try {
      const { data, error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', faqId)

      return { data, error }
    } catch (error) {
      console.error('Error deleting FAQ:', error)
      return { data: null, error }
    }
  },

  /**
   * Get deletion queue (admin only)
   * @returns {Promise<{data, error}>}
   */
  async getDeletionQueue() {
    if (!supabase) {
      // Fallback to localStorage
      try {
        const deletionQueue = JSON.parse(localStorage.getItem('deletion_queue') || '[]')
        return { data: deletionQueue, error: null }
      } catch (error) {
        return { data: null, error }
      }
    }

    try {
      const { data, error } = await supabase
        .from('deletion_queue')
        .select(`
          *,
          user:users(id, email, phone)
        `)
        .order('scheduled_deletion_at', { ascending: true })

      return { data, error }
    } catch (error) {
      console.error('Error getting deletion queue:', error)
      // Fallback to localStorage
      try {
        const deletionQueue = JSON.parse(localStorage.getItem('deletion_queue') || '[]')
        return { data: deletionQueue, error: null }
      } catch (localError) {
        return { data: null, error }
      }
    }
  },

  /**
   * Cancel scheduled deletion (admin only)
   * @param {string} deletionId - Deletion queue entry ID
   * @returns {Promise<{data, error}>}
   */
  async cancelDeletion(deletionId) {
    if (!supabase) {
      // Fallback to localStorage
      try {
        const deletionQueue = JSON.parse(localStorage.getItem('deletion_queue') || '[]')
        const updated = deletionQueue.filter(item => item.id !== deletionId)
        localStorage.setItem('deletion_queue', JSON.stringify(updated))
        return { data: { id: deletionId }, error: null }
      } catch (error) {
        return { data: null, error }
      }
    }

    try {
      const { data, error } = await supabase
        .from('deletion_queue')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', deletionId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error cancelling deletion:', error)
      return { data: null, error }
    }
  }
}
