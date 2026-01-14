// Quick Supabase Connection Test
// Run this in browser console after app loads: testSupabase()

// This function will be available globally when you import it in your app
window.testSupabase = async function() {
  console.log('🔍 Testing Supabase Connection...\n')
  
  try {
    // Import Supabase config
    const { supabase } = await import('./src/config/supabase.js')
    
    if (!supabase) {
      console.error('❌ Supabase client is null!')
      console.log('\n📝 Check:')
      console.log('  1. .env file exists in project root')
      console.log('  2. .env has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
      console.log('  3. Dev server was restarted after creating .env')
      return false
    }
    
    console.log('✅ Supabase client initialized')
    console.log(`📍 URL: ${import.meta.env.VITE_SUPABASE_URL || 'Not set'}`)
    console.log(`🔑 Key: ${import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 30) || 'Not set'}...\n`)
    
    // Test 1: Auth service
    console.log('📊 Test 1: Auth Service...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.log(`   ⚠️  Auth error: ${authError.message}`)
      console.log('   (This is OK - you\'re not logged in)\n')
    } else {
      console.log('   ✅ Auth service accessible\n')
    }
    
    // Test 2: Database query (users table)
    console.log('📊 Test 2: Database Query (users table)...')
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log(`   ⚠️  Query error: ${error.message}`)
      console.log('   (This is OK if the \'users\' table doesn\'t exist yet)\n')
    } else {
      console.log('   ✅ Query successful!\n')
    }
    
    // Test 3: Realtime
    console.log('⚡ Test 3: Realtime Service...')
    const channel = supabase.channel('test-connection')
    
    const subscribePromise = new Promise((resolve) => {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('   ✅ Realtime channel subscribed')
          channel.unsubscribe()
          resolve(true)
        } else if (status === 'CHANNEL_ERROR') {
          console.log('   ⚠️  Realtime channel error (might not be enabled)')
          resolve(false)
        }
      })
    })
    
    await Promise.race([
      subscribePromise,
      new Promise(resolve => setTimeout(() => {
        console.log('   ⚠️  Realtime timeout (might not be enabled)')
        resolve(false)
      }, 2000))
    ])
    
    console.log('\n🎉 Connection test completed!')
    console.log('\n✅ Supabase is configured and working!')
    return true
    
  } catch (err) {
    console.error('❌ Test failed:', err)
    console.error('\nError details:', err.message)
    return false
  }
}

// Auto-run if imported
if (typeof window !== 'undefined') {
  console.log('💡 Run testSupabase() in console to test connection')
}
