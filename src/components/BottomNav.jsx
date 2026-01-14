import { HomeIcon, MessageIcon, SearchIcon, UserIcon, GroupsIcon } from './Icons'
import { getMatches } from '../utils/localStorage'

const BottomNav = ({ activeTab, setActiveTab }) => {
  const matches = getMatches()
  const unreadCount = matches.reduce((sum, match) => sum + (match.unread || 0), 0)

  const navItems = [
    { id: 'home', label: 'Discover', Icon: HomeIcon },
    { id: 'groups', label: 'Groups', Icon: GroupsIcon },
    { id: 'matches', label: 'Matches', Icon: MessageIcon, badge: unreadCount > 0 ? unreadCount : null },
    { id: 'search', label: 'Search', Icon: SearchIcon },
    { id: 'profile', label: 'Profile', Icon: UserIcon },
  ]

  return (
    <nav className="bottom-nav" style={{ borderRadius: '20px 20px 0 0' }}>
      {navItems.map((item) => {
        const Icon = item.Icon
        return (
          <div
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            style={{ position: 'relative' }}
          >
            <span className="nav-icon">
              <Icon size={24} />
            </span>
            {item.badge && item.badge > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '0',
                  right: '20px',
                  background: 'var(--error)',
                  color: 'white',
                  borderRadius: '10px',
                  minWidth: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '0 6px',
                }}
              >
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
            <span className="nav-label">{item.label}</span>
          </div>
        )
      })}
    </nav>
  )
}

export default BottomNav
