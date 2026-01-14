// Browser-based Supabase Connection Test
// Run this in browser console or add to your app temporarily

// Get Supabase client from your config
import { supabase } from './src/config/supabase.js'

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n')
  
  if (!supabase) {
    console.error('❌ Supabase client is null!')
    console.log('Check your .env file has:')
    console.log('  VITE_SUPABASE_URL=...')
    console.log('  VITE_SUPABASE_ANON_KEY=...')
    return false
  }
  
  console.log('✅ Supabase client initialized')
  
  try {
    // Test 1: Simple query
    console.log('\n📊 Test 1: Database Query...')
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('⚠️  Query error (table might not exist):', error.message)
    } else {
      console.log('✅ Query successful:', data)
    }
    
    // Test 2: Auth service
    console.log('\n🔐 Test 2: Auth Service...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.log('⚠️  Auth error:', authError.message)
    } else {
      console.log('✅ Auth service accessible')
    }
    
    // Test 3: Realtime (if enabled)
    console.log('\n⚡ Test 3: Realtime...')
    const channel = supabase.channel('test-channel')
    const subscribed = channel.subscribe((status) => {
      console.log('✅ Realtime channel status:', status)
      channel.unsubscribe()
    })
    
    console.log('\n🎉 All tests completed!')
    return true
    
  } catch (err) {
    console.error('❌ Test failed:', err)
    return false
  }
}

// Run test
testSupabaseConnection()
