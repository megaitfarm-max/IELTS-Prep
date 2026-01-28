import { NavLink } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import styles from './Sidebar.module.css'

const menuItems = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/lesson-plan', icon: '📚', label: 'Lesson Plan' },
  { path: '/videos', icon: '📹', label: 'Video Library' },
  { path: '/reading', icon: '📖', label: 'Reading' },
  { path: '/listening', icon: '🎧', label: 'Listening' },
  { path: '/writing', icon: '✍️', label: 'Writing' },
  { path: '/writing-practice', icon: '🎯', label: 'Writing Practice' },
  { path: '/speaking', icon: '🗣️', label: 'Speaking' },
  { path: '/speaking-practice', icon: '🎤', label: 'Speaking Practice' },
  { path: '/mock-tests', icon: '📝', label: 'Mock Tests' },
  { path: '/test-history', icon: '📋', label: 'Test History' },
  { path: '/profile', icon: '👤', label: 'Profile' },
]

function Sidebar() {
  const { user } = useAuth()

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </NavLink>
        ))}
        {user?.is_admin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.icon}>🔐</span>
            <span className={styles.label}>Admin</span>
          </NavLink>
        )}
      </nav>
    </aside>
  )
}

export default Sidebar
