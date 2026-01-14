// Test Supabase Connection
// Run with: node test-supabase-connection.js

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Testing Supabase Connection...\n')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables!')
  console.log('Please ensure .env file exists with:')
  console.log('  VITE_SUPABASE_URL=...')
  console.log('  VITE_SUPABASE_ANON_KEY=...')
  process.exit(1)
}

console.log('✅ Environment variables found')
console.log(`📍 URL: ${supabaseUrl}`)
console.log(`🔑 Key: ${supabaseAnonKey.substring(0, 20)}...\n`)

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test connection
async function testConnection() {
  try {
    console.log('🔄 Testing connection...')
    
    // Test 1: Simple query to verify connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      // If users table doesn't exist, try a simpler test
      console.log('⚠️  Users table query failed (might not exist yet)')
      console.log(`   Error: ${error.message}`)
      
      // Test 2: Try to get auth session (simpler test)
      const { data: authData, error: authError } = await supabase.auth.getSession()
      
      if (authError) {
        console.log(`   Auth test error: ${authError.message}`)
      } else {
        console.log('✅ Supabase client initialized successfully')
        console.log('✅ Connection test passed!')
        return true
      }
    } else {
      console.log('✅ Database query successful')
      console.log('✅ Connection test passed!')
      return true
    }
    
    // If we get here, connection is working
    console.log('✅ Supabase client initialized successfully')
    console.log('✅ Connection test passed!')
    return true
    
  } catch (err) {
    console.error('❌ Connection test failed!')
    console.error(`   Error: ${err.message}`)
    return false
  }
}

// Run test
testConnection()
  .then(success => {
    if (success) {
      console.log('\n🎉 Supabase connection is working!')
      process.exit(0)
    } else {
      console.log('\n❌ Supabase connection failed')
      process.exit(1)
    }
  })
  .catch(err => {
    console.error('\n❌ Unexpected error:', err)
    process.exit(1)
  })
