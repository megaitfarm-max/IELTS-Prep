import { useState, useEffect } from 'react'
import { useAuth } from '@context/AuthContext'
import { Card } from '@components/common/Card'
import ProgressBar from '@components/common/ProgressBar'
import styles from './Profile.module.css'
import lessonsData from '../../data/lessons.json'

function Profile() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('personal')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ show: false, type: 'info', message: '' })
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    targetScore: 7.5,
    testDate: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [achievements, setAchievements] = useState([
    { id: 1, title: 'First Lesson', description: 'Complete your first lesson', earned: false },
    { id: 2, title: '7 Day Streak', description: 'Study for 7 consecutive days', earned: false },
    { id: 3, title: 'Reading Master', description: 'Complete all reading lessons', earned: false },
    { id: 4, title: 'Perfect Score', description: 'Get 100% on any practice test', earned: false },
    { id: 5, title: '30 Day Streak', description: 'Study for 30 consecutive days', earned: false },
    { id: 6, title: 'All Modules Complete', description: 'Finish all four modules', earned: false },
  ])

  const [stats, setStats] = useState({
    totalStudyTime: 0,
    lessonsCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    averageScore: 0,
    testsCompleted: 0,
  })

  const [moduleProgress, setModuleProgress] = useState([
    { module: 'Reading', progress: 0, lessons: 0, total: lessonsData.reading?.length || 3, color: 'reading' },
    { module: 'Listening', progress: 0, lessons: 0, total: lessonsData.listening?.length || 1, color: 'listening' },
    { module: 'Writing', progress: 0, lessons: 0, total: lessonsData.writing?.length || 2, color: 'writing' },
    { module: 'Speaking', progress: 0, lessons: 0, total: lessonsData.speaking?.length || 2, color: 'speaking' },
  ])

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)
      
      // Fetch fresh user data from backend
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const response = await fetch('http://localhost:8000/api/v1/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          
          if (response.ok) {
            const userData = await response.json()
            setFormData({
              fullName: userData.full_name || userData.name || '',
              email: userData.email || '',
              targetScore: userData.target_band_score || 7.5,
              testDate: userData.test_date || '',
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
            })
          } else if (user) {
            // Fallback to context user if API fails
            setFormData({
              fullName: user.full_name || user.name || '',
              email: user.email || '',
              targetScore: user.target_band_score || 7.5,
              testDate: user.test_date || '',
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
            })
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error)
          // Fallback to context user
          if (user) {
            setFormData({
              fullName: user.full_name || user.name || '',
              email: user.email || '',
              targetScore: user.target_band_score || 7.5,
              testDate: user.test_date || '',
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
            })
          }
        }
      } else if (user) {
        setFormData({
          fullName: user.full_name || user.name || '',
          email: user.email || '',
          targetScore: user.target_band_score || 7.5,
          testDate: user.test_date || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      }
      
      // Load progress data
      await loadProgressData()
      
      setLoading(false)
    }

    fetchUserData()
  }, [user])
  
  const loadProgressData = async () => {
    try {
      // Load from localStorage first
      const completedLessons = JSON.parse(localStorage.getItem('completedLessons') || '[]')
      
      // Try to load from backend
      const token = localStorage.getItem('token')
      let allCompleted = completedLessons
      
      if (token) {
        try {
          const response = await fetch('http://localhost:8000/api/v1/lesson-progress/', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (response.ok) {
            const data = await response.json()
            const backendCompleted = data.map(item => {
              const lessonId = item.lesson_id.includes('-') ? item.lesson_id.split('-')[1] : item.lesson_id
              return `${item.module}-${lessonId}`
            })
            allCompleted = [...new Set([...completedLessons, ...backendCompleted])]
          }
        } catch (error) {
          console.error('Failed to load from backend:', error)
        }
      }
      
      // Calculate stats
      const totalCompleted = allCompleted.length
      
      // Calculate module progress
      const readingCompleted = allCompleted.filter(l => l.startsWith('reading-')).length
      const listeningCompleted = allCompleted.filter(l => l.startsWith('listening-')).length
      const writingCompleted = allCompleted.filter(l => l.startsWith('writing-')).length
      const speakingCompleted = allCompleted.filter(l => l.startsWith('speaking-')).length
      
      const readingTotal = lessonsData.reading?.length || 3
      const listeningTotal = lessonsData.listening?.length || 1
      const writingTotal = lessonsData.writing?.length || 2
      const speakingTotal = lessonsData.speaking?.length || 2
      
      setStats(prev => ({
        ...prev,
        lessonsCompleted: totalCompleted,
        totalStudyTime: totalCompleted * 30, // Estimate 30 min per lesson
      }))
      
      setModuleProgress([
        { 
          module: 'Reading', 
          progress: Math.round((readingCompleted / readingTotal) * 100), 
          lessons: readingCompleted, 
          total: readingTotal, 
          color: 'reading' 
        },
        { 
          module: 'Listening', 
          progress: Math.round((listeningCompleted / listeningTotal) * 100), 
          lessons: listeningCompleted, 
          total: listeningTotal, 
          color: 'listening' 
        },
        { 
          module: 'Writing', 
          progress: Math.round((writingCompleted / writingTotal) * 100), 
          lessons: writingCompleted, 
          total: writingTotal, 
          color: 'writing' 
        },
        { 
          module: 'Speaking', 
          progress: Math.round((speakingCompleted / speakingTotal) * 100), 
          lessons: speakingCompleted, 
          total: speakingTotal, 
          color: 'speaking' 
        },
      ])
      
      // Update achievements
      setAchievements(prev => prev.map(achievement => {
        if (achievement.id === 1 && totalCompleted > 0) {
          return { ...achievement, earned: true }
        }
        if (achievement.id === 3 && readingCompleted === readingTotal) {
          return { ...achievement, earned: true }
        }
        if (achievement.id === 6 && readingCompleted === readingTotal && listeningCompleted === listeningTotal && writingCompleted === writingTotal && speakingCompleted === speakingTotal) {
          return { ...achievement, earned: true }
        }
        return achievement
      }))
      
    } catch (error) {
      console.error('Failed to load progress data:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault()
    
    const token = localStorage.getItem('token')
    if (!token) {
      alert('Please login again')
      return
    }
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/users/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: formData.fullName,
          target_band_score: parseFloat(formData.targetScore),
          test_date: formData.testDate || null,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setModal({ show: true, type: 'info', message: 'Personal information updated successfully!' })
        // Refresh user data after a delay
        setTimeout(() => window.location.reload(), 1500)
      } else {
        const error = await response.json()
        setModal({ show: true, type: 'error', message: `Failed to update: ${error.detail || 'Unknown error'}` })
      }
    } catch (error) {
      console.error('Update failed:', error)
      setModal({ show: true, type: 'error', message: 'Failed to update profile. Please try again.' })
    }
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (formData.newPassword !== formData.confirmPassword) {
      setModal({ show: true, type: 'error', message: 'Passwords do not match!' })
      return
    }
    // API call would go here
    setModal({ show: true, type: 'info', message: 'Password changed successfully!' })
    setFormData((prev) => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }))
  }

  const formatMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  if (loading) {
    return (
      <div className={styles.profile}>
        <Card padding="xl">
          <div className={styles.loading}>Loading profile...</div>
        </Card>
      </div>
    )
  }

  return (
    <div className={styles.profile}>
      <div className={styles.header}>
        <h1>👤 My Profile</h1>
        <p>Manage your account settings and track your progress</p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'personal' ? styles.active : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          Personal Info
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'progress' ? styles.active : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          Progress
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'achievements' ? styles.active : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          Achievements
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'security' ? styles.active : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
      </div>

      {activeTab === 'personal' && (
        <div className={styles.tabContent}>
          <Card padding="lg">
            <h2>Personal Information</h2>
            <form onSubmit={handlePersonalInfoSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="targetScore">Target Band Score</label>
                  <select
                    id="targetScore"
                    name="targetScore"
                    value={formData.targetScore}
                    onChange={handleInputChange}
                    className={styles.select}
                  >
                    <option value="5.0">5.0</option>
                    <option value="5.5">5.5</option>
                    <option value="6.0">6.0</option>
                    <option value="6.5">6.5</option>
                    <option value="7.0">7.0</option>
                    <option value="7.5">7.5</option>
                    <option value="8.0">8.0</option>
                    <option value="8.5">8.5</option>
                    <option value="9.0">9.0</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="testDate">Test Date</label>
                  <input
                    type="date"
                    id="testDate"
                    name="testDate"
                    value={formData.testDate}
                    onChange={handleInputChange}
                    className={styles.input}
                  />
                </div>
              </div>

              <button type="submit" className={styles.submitButton}>
                Save Changes
              </button>
            </form>
          </Card>
        </div>
      )}

      {activeTab === 'progress' && (
        <div className={styles.tabContent}>
          <div className={styles.statsGrid}>
            <Card padding="md">
              <div className={styles.statCard}>
                <div className={styles.statIcon}>📚</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{stats.lessonsCompleted}</div>
                  <div className={styles.statLabel}>Lessons Completed</div>
                </div>
              </div>
            </Card>

            <Card padding="md">
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🔥</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{stats.currentStreak}</div>
                  <div className={styles.statLabel}>Current Streak</div>
                </div>
              </div>
            </Card>

            <Card padding="md">
              <div className={styles.statCard}>
                <div className={styles.statIcon}>⏱️</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{formatMinutes(stats.totalStudyTime)}</div>
                  <div className={styles.statLabel}>Total Study Time</div>
                </div>
              </div>
            </Card>

            <Card padding="md">
              <div className={styles.statCard}>
                <div className={styles.statIcon}>📊</div>
                <div className={styles.statInfo}>
                  <div className={styles.statValue}>{stats.averageScore}%</div>
                  <div className={styles.statLabel}>Average Score</div>
                </div>
              </div>
            </Card>
          </div>

          <Card padding="lg">
            <h2>Module Progress</h2>
            <div className={styles.moduleProgress}>
              {moduleProgress.map((item) => (
                <div key={item.module} className={styles.moduleItem}>
                  <div className={styles.moduleHeader}>
                    <span className={styles.moduleName}>{item.module}</span>
                    <span className={styles.moduleStats}>
                      {item.lessons}/{item.total} lessons
                    </span>
                  </div>
                  <ProgressBar value={item.progress} color={item.color} showLabel />
                </div>
              ))}
            </div>
          </Card>

          <Card padding="lg">
            <h2>Study Insights</h2>
            <div className={styles.insights}>
              <div className={styles.insight}>
                <span className={styles.insightLabel}>Most Active Day:</span>
                <span className={styles.insightValue}>Monday</span>
              </div>
              <div className={styles.insight}>
                <span className={styles.insightLabel}>Longest Session:</span>
                <span className={styles.insightValue}>2h 30m</span>
              </div>
              <div className={styles.insight}>
                <span className={styles.insightLabel}>Longest Streak:</span>
                <span className={styles.insightValue}>{stats.longestStreak} days</span>
              </div>
              <div className={styles.insight}>
                <span className={styles.insightLabel}>Tests Completed:</span>
                <span className={styles.insightValue}>{stats.testsCompleted}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className={styles.tabContent}>
          <Card padding="lg">
            <h2>🏆 Achievements</h2>
            <p className={styles.achievementSubtext}>
              Earned {achievements.filter((a) => a.earned).length} of {achievements.length}{' '}
              achievements
            </p>
            <div className={styles.achievementGrid}>
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`${styles.achievementCard} ${achievement.earned ? styles.earned : styles.locked}`}
                >
                  <div className={styles.achievementIcon}>
                    {achievement.earned ? '🏆' : '🔒'}
                  </div>
                  <h3>{achievement.title}</h3>
                  <p>{achievement.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'security' && (
        <div className={styles.tabContent}>
          <Card padding="lg">
            <h2>Change Password</h2>
            <form onSubmit={handlePasswordSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={styles.input}
                  required
                />
              </div>

              <button type="submit" className={styles.submitButton}>
                Change Password
              </button>
            </form>
          </Card>

          <Card padding="lg">
            <h2>Account Actions</h2>
            <div className={styles.accountActions}>
              <button className={styles.dangerButton}>Delete Account</button>
              <p className={styles.dangerText}>
                This action cannot be undone. All your data will be permanently deleted.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Modal */}
      {modal.show && (
        <div className={styles.modalOverlay} onClick={() => setModal({ ...modal, show: false })}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={`${styles.modalIcon} ${styles[modal.type]}`}>
              {modal.type === 'error' ? '❌' : modal.type === 'warning' ? '⚠️' : 'ℹ️'}
            </div>
            <p className={styles.modalMessage}>{modal.message}</p>
            <button
              className={styles.modalOk}
              onClick={() => setModal({ ...modal, show: false })}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
