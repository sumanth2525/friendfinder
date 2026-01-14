import { useState, useEffect, lazy, Suspense } from 'react'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
// Lazy load pages for code splitting - reduces initial bundle by ~50%
const Home = lazy(() => import('./pages/Home'))
const Groups = lazy(() => import('./pages/Groups'))
const Matches = lazy(() => import('./pages/Matches'))
const Messages = lazy(() => import('./pages/Messages'))
const Search = lazy(() => import('./pages/Search'))
const Profile = lazy(() => import('./pages/Profile'))
const Login = lazy(() => import('./pages/Login'))
const SignUp = lazy(() => import('./pages/SignUp'))
const Favorites = lazy(() => import('./pages/Favorites'))
const Admin = lazy(() => import('./pages/Admin'))
import { saveUser, getUser, isAuthenticated as checkAuth, clearAuth, saveActiveTab, getActiveTab, getTheme, saveTheme, getMatches } from './utils/localStorage'
import { trackActivity, ACTIVITY_TYPES } from './utils/activityTracker'
import { supabase } from './config/supabase'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('home')
  const [selectedMatchId, setSelectedMatchId] = useState(null)
  const [theme, setTheme] = useState('light')
  const [authMode, setAuthMode] = useState('login') // 'login' or 'signup'

  // Load user data from localStorage on mount
  useEffect(() => {
    const savedUser = getUser()
    const savedAuth = checkAuth()
    const savedTab = getActiveTab()
    const savedTheme = getTheme()
    
    if (savedAuth && savedUser) {
      setUser(savedUser)
      setIsAuthenticated(true)
    }
    
    if (savedTab) {
      setActiveTab(savedTab)
    }
    
    // Apply theme
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
    }
  }, [])

  // Save active tab to localStorage when it changes and track activity
  useEffect(() => {
    if (isAuthenticated) {
      saveActiveTab(activeTab)
      trackActivity(ACTIVITY_TYPES.TAB_SWITCHED, {
        tab: activeTab,
      })
    }
  }, [activeTab, isAuthenticated])

  const handleLogin = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
    saveUser(userData)
  }

  const handleSignUp = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
    saveUser(userData)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
    setActiveTab('home')
    clearAuth()
  }

  const handleSelectMatch = (match) => {
    setSelectedMatchId(match.id)
    setActiveTab('messages')
  }

  const handleBackToMatches = () => {
    setSelectedMatchId(null)
    setActiveTab('matches')
  }

  // Loading component for lazy-loaded routes
  const PageLoader = () => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '200px',
      fontSize: '18px',
      color: 'var(--text-secondary)'
    }}>
      <div>Loading...</div>
    </div>
  )

  const renderContent = () => {
    if (activeTab === 'messages' && selectedMatchId) {
      // Get match object for real-time chat
      const match = getMatches().find(m => m.id === selectedMatchId)
      return (
        <Suspense fallback={<PageLoader />}>
          <Messages 
            selectedMatchId={selectedMatchId} 
            onBack={handleBackToMatches}
            match={match}
          />
        </Suspense>
      )
    }

    switch (activeTab) {
      case 'home':
        return (
          <Suspense fallback={<PageLoader />}>
            <Home 
              onNavigateToMatches={() => setActiveTab('matches')} 
              onNavigateToGroups={() => setActiveTab('groups')}
            />
          </Suspense>
        )
      case 'groups':
        return (
          <Suspense fallback={<PageLoader />}>
            <Groups />
          </Suspense>
        )
      case 'matches':
        return (
          <Suspense fallback={<PageLoader />}>
            <Matches onSelectMatch={handleSelectMatch} />
          </Suspense>
        )
      case 'search':
        return (
          <Suspense fallback={<PageLoader />}>
            <Search />
          </Suspense>
        )
      case 'favorites':
        return (
          <Suspense fallback={<PageLoader />}>
            <Favorites />
          </Suspense>
        )
      case 'profile':
        return (
          <Suspense fallback={<PageLoader />}>
            <Profile user={user} onLogout={handleLogout} onNavigateToFavorites={() => setActiveTab('favorites')} />
          </Suspense>
        )
      case 'admin':
        return (
          <Suspense fallback={<PageLoader />}>
            <Admin user={user} onLogout={handleLogout} />
          </Suspense>
        )
      default:
        return (
          <Suspense fallback={<PageLoader />}>
            <Home />
          </Suspense>
        )
    }
  }

  // Show login/signup page if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="app-container">
        <main className="main-content" style={{ paddingBottom: '20px' }}>
          <Suspense fallback={<PageLoader />}>
            {authMode === 'login' ? (
              <Login 
                onLogin={handleLogin} 
                onSwitchToSignUp={() => setAuthMode('signup')} 
              />
            ) : (
              <SignUp 
                onSignUp={handleSignUp} 
                onSwitchToLogin={() => setAuthMode('login')} 
              />
            )}
          </Suspense>
        </main>
      </div>
    )
  }

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    saveTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  // Show main app if authenticated
  return (
    <div className="app-container" data-theme={theme}>
      <Header 
        user={user} 
        onLogout={handleLogout} 
        theme={theme} 
        onThemeChange={handleThemeChange} 
        onNavigateToProfile={() => setActiveTab('profile')}
        onNavigateToAdmin={() => setActiveTab('admin')}
        onNavigateToHome={() => setActiveTab('home')}
        supabase={supabase}
      />
      <main className="main-content">
        {renderContent()}
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}

export default App
