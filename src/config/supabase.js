import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if mock data mode is forced
const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true'
const useSupabase = import.meta.env.VITE_USE_SUPABASE !== 'false' // Default to true if not set

// Create Supabase client or null if not configured
let supabase = null

// Determine if we should use Supabase
const shouldUseSupabase = useSupabase && !useMockData && supabaseUrl && supabaseAnonKey

if (shouldUseSupabase) {
  try {
    // Validate URL format
    if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
      throw new Error('Invalid Supabase URL format')
    }

    // Validate key format (should start with 'eyJ' for JWT)
    if (!supabaseAnonKey.startsWith('eyJ')) {
      throw new Error('Invalid Supabase API key format')
    }

    // Create and export Supabase client
    supabase = createClient(supabaseUrl, supabaseAnonKey)
    console.log('✅ Supabase client initialized successfully')
    console.log(`📍 Project URL: ${supabaseUrl}`)
  } catch (error) {
    console.error('❌ Error initializing Supabase:', error.message)
    console.warn('⚠️ Falling back to mock data mode')
    supabase = null
  }
} else {
  if (useMockData) {
    console.log('📦 Using mock data mode (forced via VITE_USE_MOCK_DATA)')
  } else if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase environment variables not found. Using mock data mode.')
    console.warn('📝 To enable Supabase:')
    console.warn('   1. Copy .env.example to .env')
    console.warn('   2. Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
    console.warn('   3. Restart the dev server')
    console.warn('   See ENV_SETUP.md for detailed instructions')
  } else {
    console.log('📦 Using mock data mode')
  }
}

export { supabase }
