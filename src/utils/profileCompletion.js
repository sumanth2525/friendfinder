// Profile Completion Utility
// Calculates how complete a user's profile is

/**
 * Calculate profile completion percentage
 * @param {Object} user - User object with profile data
 * @returns {number} Completion percentage (0-100)
 */
export const calculateProfileCompletion = (user) => {
  if (!user) return 0

  // Helper to check if value is not default/placeholder
  const isNotDefault = (value, defaults = []) => {
    if (!value) return false
    const strValue = String(value).trim()
    if (strValue === '') return false
    return !defaults.some(def => strValue === String(def))
  }

  const fields = {
    // Required fields (must have)
    name: isNotDefault(user.name, ['Your Name', '']),
    age: user.age && user.age > 0 && user.age <= 100,
    emailOrPhone: !!(user.email || user.phone),
    
    // Important fields
    bio: isNotDefault(user.bio, ['Passionate about connecting with amazing people!', '']),
    location: isNotDefault(user.location, ['New York, NY', '']),
    gender: user.gender && ['Male', 'Female', 'Other', 'Prefer not to say'].includes(user.gender),
    
    // Profile details
    job: isNotDefault(user.job, ['Software Developer', '']),
    education: isNotDefault(user.education, ['University', '']),
    height: isNotDefault(user.height, ['']),
    lookingFor: isNotDefault(user.lookingFor, ['']),
    
    // Interests (at least 3)
    interests: user.interests && Array.isArray(user.interests) && user.interests.length >= 3,
    
    // Lifestyle (all 4 fields filled, even if "Prefer not to say")
    lifestyle: user.lifestyle && 
      user.lifestyle.drinking && 
      user.lifestyle.smoking && 
      user.lifestyle.exercise && 
      user.lifestyle.pets,
  }

  // Calculate weighted completion
  // Required fields: 30% (10% each)
  // Important fields: 30% (10% each)
  // Profile details: 25% (5% each)
  // Interests: 10%
  // Lifestyle: 5%

  let completion = 0

  // Required fields (30%)
  if (fields.name) completion += 10
  if (fields.age) completion += 10
  if (fields.emailOrPhone) completion += 10

  // Important fields (30%)
  if (fields.bio) completion += 10
  if (fields.location) completion += 10
  if (fields.gender) completion += 10

  // Profile details (25%)
  if (fields.job) completion += 5
  if (fields.education) completion += 5
  if (fields.height) completion += 5
  if (fields.lookingFor) completion += 5
  if (fields.interests) completion += 5

  // Lifestyle (5%)
  if (fields.lifestyle) completion += 5

  return Math.min(100, Math.round(completion))
}

/**
 * Get missing fields that need to be completed
 * @param {Object} user - User object with profile data
 * @returns {Array} Array of field names that are missing
 */
export const getMissingFields = (user) => {
  if (!user) return []

  const missing = []

  const isNotDefault = (value, defaults = []) => {
    if (!value) return false
    const strValue = String(value).trim()
    if (strValue === '') return false
    return !defaults.some(def => strValue === String(def))
  }

  if (!isNotDefault(user.name, ['Your Name', ''])) {
    missing.push('Name')
  }
  if (!user.age || user.age <= 0 || user.age > 100) {
    missing.push('Age')
  }
  if (!user.email && !user.phone) {
    missing.push('Email or Phone')
  }
  if (!isNotDefault(user.bio, ['Passionate about connecting with amazing people!', ''])) {
    missing.push('Bio')
  }
  if (!isNotDefault(user.location, ['New York, NY', ''])) {
    missing.push('Location')
  }
  if (!user.gender || !['Male', 'Female', 'Other', 'Prefer not to say'].includes(user.gender)) {
    missing.push('Gender')
  }
  if (!isNotDefault(user.job, ['Software Developer', ''])) {
    missing.push('Job')
  }
  if (!isNotDefault(user.education, ['University', ''])) {
    missing.push('Education')
  }
  if (!isNotDefault(user.height, [''])) {
    missing.push('Height')
  }
  if (!isNotDefault(user.lookingFor, [''])) {
    missing.push('Looking For')
  }
  if (!user.interests || !Array.isArray(user.interests) || user.interests.length < 3) {
    missing.push('Interests (at least 3)')
  }
  if (!user.lifestyle || 
      !user.lifestyle.drinking || 
      !user.lifestyle.smoking || 
      !user.lifestyle.exercise || 
      !user.lifestyle.pets) {
    missing.push('Lifestyle preferences')
  }

  return missing
}

/**
 * Get completion status text
 * @param {number} percentage - Completion percentage
 * @returns {string} Status text
 */
export const getCompletionStatus = (percentage) => {
  if (percentage >= 90) return 'Excellent!'
  if (percentage >= 75) return 'Great!'
  if (percentage >= 50) return 'Good'
  if (percentage >= 25) return 'Getting there'
  return 'Just getting started'
}
