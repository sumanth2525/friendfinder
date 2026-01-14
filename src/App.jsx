import { useState, useEffect } from 'react'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import Home from './pages/Home'
import Matches from './pages/Matches'
import Messages from './pages/Messages'
import Search from './pages/Search'
import Profile from './pages/Profile'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Favorites from './pages/Favorites'
import { saveUser, getUser, isAuthenticated as checkAuth, clearAuth, saveActiveTab, getActiveTab, getTheme, saveTheme } from './utils/localStorage'
import { trackActivity, ACTIVITY_TYPES } from './utils/activityTracker'
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

  const renderContent = () => {
    if (activeTab === 'messages' && selectedMatchId) {
      return <Messages selectedMatchId={selectedMatchId} onBack={handleBackToMatches} />
    }

    switch (activeTab) {
      case 'home':
        return <Home onNavigateToMatches={() => setActiveTab('matches')} />
      case 'matches':
        return <Matches onSelectMatch={handleSelectMatch} />
      case 'search':
        return <Search />
      case 'favorites':
        return <Favorites />
      case 'profile':
        return <Profile user={user} onLogout={handleLogout} onNavigateToFavorites={() => setActiveTab('favorites')} />
      default:
        return <Home />
    }
  }

  // Show login/signup page if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="app-container">
        <main className="main-content" style={{ paddingBottom: '20px' }}>
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
      <Header user={user} onLogout={handleLogout} theme={theme} onThemeChange={handleThemeChange} onNavigateToProfile={() => setActiveTab('profile')} />
      <main className="main-content">
        {renderContent()}
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}

export default App
