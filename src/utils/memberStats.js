// Member Statistics Utility
// Fetches real-time member counts from Supabase or uses mock data

import { datingProfiles } from '../data/datingProfiles'

/**
 * Get member statistics from mock data (fallback)
 * Returns: { menCount, womenCount, onlineCount }
 */
const getMemberStatsMock = async () => {
  try {
    const menCount = datingProfiles.filter(p => p.gender === 'Male').length
    const womenCount = datingProfiles.filter(p => p.gender === 'Female').length
    const onlineCount = datingProfiles.filter(p => p.online === true).length

    // Ensure we have real counts, not fake "20+"
    // If online count is 0, show actual count (0) instead of fake number
    const finalOnlineCount = onlineCount

    return {
      menCount: menCount || 0,
      womenCount: womenCount || 0,
      onlineCount: finalOnlineCount,
      error: false
    }
  } catch (error) {
    console.error('Error in getMemberStatsMock:', error)
    return {
      menCount: 0,
      womenCount: 0,
      onlineCount: 0,
      error: true
    }
  }
}

/**
 * Get stats using RPC function (most efficient) or fallback to mock data
 */
export const getMemberStatsOptimized = async (supabase) => {
  // If no Supabase, use mock data
  if (!supabase) {
    return await getMemberStatsMock()
  }

  try {
    // Try RPC function first (most efficient)
    try {
      const { data, error } = await supabase.rpc('get_member_stats')
      
      if (!error && data) {
        return {
          menCount: data.men_count || 0,
          womenCount: data.women_count || 0,
          onlineCount: data.online_count || 0,
          error: false
        }
      }
    } catch (rpcError) {
      console.log('RPC function not available, using direct queries')
    }

    // Fallback: Direct queries
    // Get count of men
    const { count: menCount, error: menError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('gender', 'Male')

    // Get count of women
    const { count: womenCount, error: womenError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('gender', 'Female')

    // Get online users (active in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { count: onlineCount, error: onlineError } = await supabase
      .from('login_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('last_active_at', fiveMinutesAgo)

    if (menError || womenError) {
      console.error('Error fetching member stats:', { menError, womenError, onlineError })
      // Fallback to mock data on error
      return await getMemberStatsMock()
    }

    return {
      menCount: menCount || 0,
      womenCount: womenCount || 0,
      onlineCount: onlineCount || 0,
      error: false
    }
  } catch (error) {
    console.error('Error in getMemberStatsOptimized:', error)
    // Fallback to mock data on error
    return await getMemberStatsMock()
  }
}

