// Mock user data
export const mockUsers = [
  {
    id: 1,
    name: 'Alex Johnson',
    email: 'alex@friendfinder.com',
    phone: '+1 234-567-8901',
    password: 'demo123',
    avatar: 'AJ',
    bio: 'Music enthusiast and travel lover',
    interests: ['Music', 'Travel', 'Photography'],
  },
  {
    id: 2,
    name: 'Sarah Chen',
    email: 'sarah@friendfinder.com',
    phone: '+1 234-567-8902',
    password: 'demo123',
    avatar: 'SC',
    bio: 'Artist and photographer',
    interests: ['Art', 'Photography', 'Design'],
  },
  {
    id: 3,
    name: 'Mike Davis',
    email: 'mike@friendfinder.com',
    phone: '+1 234-567-8903',
    password: 'demo123',
    avatar: 'MD',
    bio: 'Sports fan and gamer',
    interests: ['Sports', 'Gaming', 'Fitness'],
  },
  {
    id: 4,
    name: 'Emma Wilson',
    email: 'emma@friendfinder.com',
    phone: '+1 234-567-8904',
    password: 'demo123',
    avatar: 'EW',
    bio: 'Bookworm and coffee addict',
    interests: ['Reading', 'Coffee', 'Writing'],
  },
  {
    id: 5,
    name: 'John Smith',
    email: 'john@friendfinder.com',
    phone: '+1 234-567-8905',
    password: 'demo123',
    avatar: 'JS',
    bio: 'Tech enthusiast',
    interests: ['Technology', 'Coding', 'Gadgets'],
  },
]

// Mock OTP storage (in real app, this would be on server)
let otpStorage = {}

// Generate a 6-digit OTP
export const generateOTP = (phone) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  otpStorage[phone] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  }
  return otp
}

// Verify OTP
export const verifyOTP = (phone, enteredOTP) => {
  const stored = otpStorage[phone]
  if (!stored) return false
  if (Date.now() > stored.expiresAt) {
    delete otpStorage[phone]
    return false
  }
  return stored.otp === enteredOTP
}

// Get user by phone
export const getUserByPhone = (phone) => {
  return mockUsers.find(user => user.phone === phone)
}

// Get user by email
export const getUserByEmail = (email) => {
  return mockUsers.find(user => user.email === email)
}

// Get all mock users for demo
export const getAllMockUsers = () => mockUsers

// Check if phone exists
export const phoneExists = (phone) => {
  return mockUsers.some(user => user.phone === phone)
}

// Check if email exists
export const emailExists = (email) => {
  return mockUsers.some(user => user.email === email.toLowerCase())
}

// Create a new user
export const createUser = (userData) => {
  const maxId = mockUsers.length > 0 
    ? Math.max(...mockUsers.map(u => u.id)) 
    : 0
  const newUser = {
    id: maxId + 1,
    name: userData.name,
    email: userData.email?.toLowerCase() || null,
    phone: userData.phone || null,
    password: userData.password || null,
    avatar: userData.avatar || generateInitials(userData.name),
    bio: userData.bio || '',
    interests: userData.interests || [],
    age: userData.age || null,
    location: userData.location || '',
    job: userData.job || null,
    education: userData.education || null,
    height: userData.height || null,
    lookingFor: userData.lookingFor || 'Not Sure Yet',
    lifestyle: userData.lifestyle || {
      drinking: 'Prefer not to say',
      smoking: 'Prefer not to say',
      exercise: 'Prefer not to say',
      pets: 'Prefer not to say',
    },
    photo: userData.photo || null, // Base64 photo for demo
    photos: userData.photo ? [userData.photo] : [],
    verified: userData.verified !== undefined ? userData.verified : false, // Default to false - needs verification
    createdAt: Date.now(),
  }
  mockUsers.push(newUser)
  return newUser
}

// Generate initials from name
const generateInitials = (name) => {
  if (!name || typeof name !== 'string') return 'U'
  const nameParts = name.trim().split(' ').filter(part => part.length > 0)
  if (nameParts.length >= 2) {
    const first = nameParts[0]?.[0] || ''
    const last = nameParts[nameParts.length - 1]?.[0] || ''
    if (first && last) {
      return (first + last).toUpperCase()
    }
  }
  if (nameParts.length === 1 && nameParts[0]?.length >= 2) {
    return nameParts[0].substring(0, 2).toUpperCase()
  }
  if (nameParts.length === 1 && nameParts[0]?.length === 1) {
    return nameParts[0].toUpperCase()
  }
  return 'U'
}
