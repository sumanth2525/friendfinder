// Supabase Matching Algorithm Utilities
// Based on ER Diagram Schema
// Matching Algorithm: Hobbies 60%, Job 5%, Age 10%, Location 10%, Lifestyle 10%, Education 5%

/**
 * MATCHING ALGORITHM WEIGHTS:
 * - Hobbies/Interests: 60%
 * - Job: 5%
 * - Age: 10%
 * - Location: 10%
 * - Lifestyle: 10%
 * - Education: 5%
 */

/**
 * Calculate match percentage client-side (for preview/display)
 * This mirrors the server-side algorithm
 */
export const calculateMatchPercentage = (user1, user2) => {
  let totalScore = 0;

  // 1. HOBBIES SCORE (60%)
  const hobbiesScore = calculateHobbiesScore(user1.interests || [], user2.interests || []);
  totalScore += hobbiesScore * 0.60;

  // 2. JOB SCORE (5%)
  const jobScore = calculateJobScore(user1.job_title || user1.job, user2.job_title || user2.job);
  totalScore += jobScore * 0.05;

  // 3. AGE SCORE (10%)
  const ageScore = calculateAgeScore(user1.age, user2.age);
  totalScore += ageScore * 0.10;

  // 4. LOCATION SCORE (10%)
  const locationScore = calculateLocationScore(user1.location, user2.location);
  totalScore += locationScore * 0.10;

  // 5. LIFESTYLE SCORE (10%)
  const lifestyleScore = calculateLifestyleScore(user1.lifestyle || {}, user2.lifestyle || {});
  totalScore += lifestyleScore * 0.10;

  // 6. EDUCATION SCORE (5%)
  const educationScore = calculateEducationScore(user1.education, user2.education);
  totalScore += educationScore * 0.05;

  // Round and clamp between 0-100
  return Math.min(100, Math.max(0, Math.round(totalScore)));
};

/**
 * Calculate hobbies/interests compatibility (0-100 scale)
 */
const calculateHobbiesScore = (interests1, interests2) => {
  if (!interests1.length && !interests2.length) return 50; // Neutral if both empty
  if (!interests1.length || !interests2.length) return 0;

  // Handle both array of strings and array of objects
  const set1 = new Set(
    interests1.map(i => 
      typeof i === 'string' ? i.toLowerCase().trim() : i.name?.toLowerCase().trim() || ''
    ).filter(Boolean)
  );
  const set2 = new Set(
    interests2.map(i => 
      typeof i === 'string' ? i.toLowerCase().trim() : i.name?.toLowerCase().trim() || ''
    ).filter(Boolean)
  );

  // Count common interests
  const common = [...set1].filter(i => set2.has(i)).length;
  
  // Total unique interests
  const total = new Set([...set1, ...set2]).size;

  // Return percentage (0-100)
  return total > 0 ? (common / total) * 100 : 0;
};

/**
 * Calculate job compatibility (0-100 scale)
 */
const calculateJobScore = (job1, job2) => {
  if (!job1 && !job2) return 50; // Neutral if both empty
  if (!job1 || !job2) return 0;

  const j1 = job1.toLowerCase().trim();
  const j2 = job2.toLowerCase().trim();

  if (j1 === j2) return 100; // Exact match

  // Partial match (same keywords)
  if (j1.includes(j2) || j2.includes(j1)) return 50;

  // Check for similar industries
  const industries = {
    tech: ['software', 'developer', 'engineer', 'programmer', 'it', 'technology'],
    healthcare: ['doctor', 'nurse', 'medical', 'health', 'hospital'],
    education: ['teacher', 'professor', 'educator', 'school'],
    finance: ['banker', 'accountant', 'financial', 'finance', 'investment'],
    marketing: ['marketing', 'advertising', 'brand', 'pr', 'public relations'],
    design: ['designer', 'graphic', 'ui', 'ux', 'creative'],
  };

  for (const [industry, keywords] of Object.entries(industries)) {
    const match1 = keywords.some(k => j1.includes(k));
    const match2 = keywords.some(k => j2.includes(k));
    if (match1 && match2) return 50;
  }

  return 0;
};

/**
 * Calculate age compatibility (0-100 scale)
 */
const calculateAgeScore = (age1, age2) => {
  if (!age1 || !age2) return 50; // Neutral if missing

  const ageDiff = Math.abs(age1 - age2);

  if (ageDiff === 0) return 100;
  if (ageDiff <= 2) return 80;
  if (ageDiff <= 5) return 60;
  if (ageDiff <= 10) return 40;
  if (ageDiff <= 15) return 20;
  return 10;
};

/**
 * Calculate location compatibility (0-100 scale)
 */
const calculateLocationScore = (location1, location2) => {
  if (!location1 && !location2) return 50;
  if (!location1 || !location2) return 0;

  const loc1 = location1.toLowerCase().trim();
  const loc2 = location2.toLowerCase().trim();

  if (loc1 === loc2) return 100; // Exact match

  // Same city, different state
  const city1 = loc1.split(',')[0].trim();
  const city2 = loc2.split(',')[0].trim();
  if (city1 === city2) return 70;

  // Same state
  const state1 = loc1.split(',')[1]?.trim();
  const state2 = loc2.split(',')[1]?.trim();
  if (state1 && state2 && state1 === state2) return 50;

  return 30; // Different locations
};

/**
 * Calculate lifestyle compatibility (0-100 scale)
 */
const calculateLifestyleScore = (lifestyle1, lifestyle2) => {
  let matches = 0;
  let total = 0;

  const factors = ['drinking', 'smoking', 'exercise', 'pets'];

  factors.forEach(factor => {
    if (lifestyle1[factor] && lifestyle2[factor]) {
      total++;
      if (lifestyle1[factor].toLowerCase() === lifestyle2[factor].toLowerCase()) {
        matches++;
      }
    }
  });

  if (total === 0) return 50; // Neutral if no data

  return (matches / total) * 100;
};

/**
 * Calculate education compatibility (0-100 scale)
 */
const calculateEducationScore = (edu1, edu2) => {
  if (!edu1 && !edu2) return 50;
  if (!edu1 || !edu2) return 0;

  const e1 = edu1.toLowerCase().trim();
  const e2 = edu2.toLowerCase().trim();

  if (e1 === e2) return 100; // Exact match

  // Similar education level
  const higherEd = ['university', 'college', 'bachelor', 'master', 'phd', 'doctorate'];
  const hasHigher1 = higherEd.some(term => e1.includes(term));
  const hasHigher2 = higherEd.some(term => e2.includes(term));

  if (hasHigher1 && hasHigher2) return 60;
  if (!hasHigher1 && !hasHigher2) return 60; // Both non-higher ed

  return 20;
};

/**
 * Supabase query helpers
 */
export const supabaseQueries = {
  // Get potential matches for a user
  getPotentialMatches: async (supabase, userId, limit = 20) => {
    const { data, error } = await supabase.rpc('get_potential_matches', {
      p_user_id: userId,
      p_limit: limit
    });
    return { data, error };
  },

  // Calculate match percentage between two users
  calculateMatchPercentage: async (supabase, user1Id, user2Id) => {
    const { data, error } = await supabase.rpc('calculate_match_percentage', {
      p_user1_id: user1Id,
      p_user2_id: user2Id
    });
    return { data, error };
  },

  // Swipe on a profile
  swipeProfile: async (supabase, fromUserId, toUserId, action = 'LIKE') => {
    const { data, error } = await supabase
      .from('swipes')
      .insert({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        action: action.toUpperCase() // LIKE, DISLIKE, SUPERLIKE
      })
      .select()
      .single();
    return { data, error };
  },

  // Get matches for a user
  getMatches: async (supabase, userId) => {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        user1:users!matches_user1_id_fkey(id, profiles(*)),
        user2:users!matches_user2_id_fkey(id, profiles(*))
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('status', 'ACTIVE')
      .order('matched_at', { ascending: false });
    return { data, error };
  },

  // Get conversations for a user
  getConversations: async (supabase, userId) => {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        match:matches!conversations_match_id_fkey(
          *,
          user1:users!matches_user1_id_fkey(id, profiles(*)),
          user2:users!matches_user2_id_fkey(id, profiles(*))
        )
      `)
      .or(`match.user1_id.eq.${userId},match.user2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });
    return { data, error };
  },

  // Get messages for a conversation
  getMessages: async (supabase, conversationId, limit = 50) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, profiles(display_name))
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);
    return { data, error };
  },

  // Send a message
  sendMessage: async (supabase, conversationId, senderId, content) => {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content.trim()
      })
      .select()
      .single();
    return { data, error };
  },

  // Get user interests
  getUserInterests: async (supabase, userId) => {
    const { data, error } = await supabase
      .from('user_interests')
      .select(`
        interest:interests(*)
      `)
      .eq('user_id', userId);
    return { data, error };
  },

  // Add interests to user
  addInterests: async (supabase, userId, interestIds) => {
    const interestRecords = interestIds.map(interestId => ({
      user_id: userId,
      interest_id: interestId
    }));

    const { data, error } = await supabase
      .from('user_interests')
      .upsert(interestRecords, { onConflict: 'user_id,interest_id' });
    return { data, error };
  },

  // Block a user
  blockUser: async (supabase, blockerUserId, blockedUserId) => {
    const { data, error } = await supabase
      .from('blocks')
      .insert({
        blocker_user_id: blockerUserId,
        blocked_user_id: blockedUserId
      })
      .select()
      .single();
    return { data, error };
  },

  // Report a user
  reportUser: async (supabase, reporterUserId, reportedUserId, reason, details = '') => {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_user_id: reporterUserId,
        reported_user_id: reportedUserId,
        reason: reason,
        details: details
      })
      .select()
      .single();
    return { data, error };
  },

  // Get notifications
  getNotifications: async (supabase, userId, unreadOnly = false) => {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId);
    
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
  },

  // Mark notification as read
  markNotificationRead: async (supabase, notificationId) => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();
    return { data, error };
  }
};

/**
 * Example usage in React component:
 * 
 * import { createClient } from '@supabase/supabase-js'
 * import { supabaseQueries, calculateMatchPercentage } from './utils/supabaseMatching'
 * 
 * const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
 * 
 * // Get potential matches
 * const { data: matches } = await supabaseQueries.getPotentialMatches(supabase, userId, 20)
 * 
 * // Swipe right (like)
 * await supabaseQueries.swipeProfile(supabase, currentUserId, profileUserId, 'LIKE')
 * 
 * // Swipe up (super like)
 * await supabaseQueries.swipeProfile(supabase, currentUserId, profileUserId, 'SUPERLIKE')
 * 
 * // Swipe left (dislike)
 * await supabaseQueries.swipeProfile(supabase, currentUserId, profileUserId, 'DISLIKE')
 * 
 * // Get matches
 * const { data: matches } = await supabaseQueries.getMatches(supabase, userId)
 * 
 * // Send message
 * await supabaseQueries.sendMessage(supabase, conversationId, userId, 'Hello!')
 */
