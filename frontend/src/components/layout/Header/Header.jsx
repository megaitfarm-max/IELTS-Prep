import { useAuth } from '@hooks/useAuth'
import { useContext } from 'react'
import { ThemeContext } from '@/context/ThemeContext'
import styles from './Header.module.css'

function Header() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useContext(ThemeContext)

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🎓</span>
          <span className={styles.logoText}>IELTS Prep</span>
        </div>
        
        <nav className={styles.nav}>
          <button onClick={toggleTheme} className={styles.themeToggle}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          
          <div className={styles.user}>
            <span className={styles.userName}>{user?.full_name || user?.name || 'User'}</span>
            <button onClick={logout} className={styles.logoutBtn}>
              Logout
            </button>
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header
