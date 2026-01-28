import { useState, useEffect } from 'react'
import { useAuth } from '@hooks/useAuth'
import { Card } from '@components/common/Card'
import { Link } from 'react-router-dom'
import ProgressBar from '@components/common/ProgressBar'
import styles from './Dashboard.module.css'
import lessonsData from '../../data/lessons.json'

function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalLessons: 8, // 3 reading + 1 listening + 2 writing + 2 speaking
    completedLessons: 0,
    streakDays: 0,
    studyTimeMinutes: 0,
    targetScore: user?.target_band_score || 7,
    estimatedScore: 6.0,
  })

  const [modules, setModules] = useState([
    {
      name: 'Reading',
      icon: '📖',
      total: lessonsData.reading?.length || 3,
      completed: 0,
      color: 'reading',
      path: '/reading',
    },
    {
      name: 'Listening',
      icon: '🎧',
      total: lessonsData.listening?.length || 1,
      completed: 0,
      color: 'listening',
      path: '/listening',
    },
    {
      name: 'Writing',
      icon: '✍️',
      total: lessonsData.writing?.length || 2,
      completed: 0,
      color: 'writing',
      path: '/writing',
    },
    {
      name: 'Speaking',
      icon: '🗣️',
      total: lessonsData.speaking?.length || 2,
      completed: 0,
      color: 'speaking',
      path: '/speaking',
    },
  ])

  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      title: 'Welcome to IELTS Prep!',
      description: 'Start your first lesson to begin tracking progress',
      time: 'Just now',
      icon: '🎉',
    },
  ])

  useEffect(() => {
    loadProgressData()
  }, [])

  const loadProgressData = async () => {
    try {
      // Load from localStorage first
      let localCompleted = JSON.parse(localStorage.getItem('completedLessons') || '[]')
      
      // CRITICAL: Remove duplicates from localStorage first
      localCompleted = [...new Set(localCompleted)]
      
      // Try to load from backend
      const token = localStorage.getItem('token')
      let allCompleted = localCompleted
      let completionDates = []
      let realStudyTimeSeconds = 0
      let totalCorrect = 0
      let totalExercises = 0
      
      if (token) {
        try {
          // Load lesson progress
          const response = await fetch('http://localhost:8000/api/v1/lesson-progress/', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (response.ok) {
            const data = await response.json()
            
            // Store completion dates for streak calculation
            completionDates = data.map(item => new Date(item.completed_at))
            
            const backendCompleted = data.map(item => {
              const lessonId = item.lesson_id.includes('-') ? item.lesson_id.split('-')[1] : item.lesson_id
              return `${item.module}-${lessonId}`
            })
            
            // Merge and deduplicate
            allCompleted = [...new Set([...localCompleted, ...backendCompleted])]
            
            // Update localStorage with clean data
            localStorage.setItem('completedLessons', JSON.stringify(allCompleted))
          }
          
          // Load REAL performance data from lesson_attempts
          const attemptsResponse = await fetch('http://localhost:8000/api/v1/lesson-attempts/', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (attemptsResponse.ok) {
            const attemptsData = await attemptsResponse.json()
            
            // Calculate REAL study time and performance
            attemptsData.forEach(attempt => {
              if (attempt.is_completed) {
                realStudyTimeSeconds += attempt.time_spent_seconds || 0
                totalCorrect += attempt.exercises_correct || 0
                totalExercises += attempt.exercises_total || 0
              }
            })
          }
        } catch (error) {
          console.error('Failed to load from backend:', error)
        }
      }
      
      // Calculate streak days - only count DIFFERENT days
      let streakDays = 0
      if (completionDates.length > 0) {
        // Sort dates descending (most recent first)
        completionDates.sort((a, b) => b - a)
        
        // Get unique dates (only count each day once)
        const uniqueDates = []
        const seenDates = new Set()
        
        completionDates.forEach(date => {
          const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
          if (!seenDates.has(dateStr)) {
            seenDates.add(dateStr)
            uniqueDates.push(date)
          }
        })
        
        if (uniqueDates.length > 0) {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          const yesterday = new Date(today)
          yesterday.setDate(yesterday.getDate() - 1)
          
          const mostRecentDate = new Date(uniqueDates[0])
          mostRecentDate.setHours(0, 0, 0, 0)
          
          // Check if user completed something today or yesterday
          if (mostRecentDate.getTime() === today.getTime() || mostRecentDate.getTime() === yesterday.getTime()) {
            streakDays = 1
            
            // Count consecutive DIFFERENT days
            for (let i = 1; i < uniqueDates.length; i++) {
              const currentDate = new Date(uniqueDates[i])
              currentDate.setHours(0, 0, 0, 0)
              
              const previousDate = new Date(uniqueDates[i - 1])
              previousDate.setHours(0, 0, 0, 0)
              
              const dayDiff = Math.floor((previousDate - currentDate) / (1000 * 60 * 60 * 24))
              
              // Only count if exactly 1 day apart
              if (dayDiff === 1) {
                streakDays++
              } else {
                break // Streak broken
              }
            }
          }
        }
      }
      
      // Calculate totals with deduplication
      const totalCompleted = allCompleted.length
      const readingCompleted = [...new Set(allCompleted.filter(l => l.startsWith('reading-')))].length
      const listeningCompleted = [...new Set(allCompleted.filter(l => l.startsWith('listening-')))].length
      const writingCompleted = [...new Set(allCompleted.filter(l => l.startsWith('writing-')))].length
      const speakingCompleted = [...new Set(allCompleted.filter(l => l.startsWith('speaking-')))].length
      
      const totalLessons = (lessonsData.reading?.length || 3) + 
                          (lessonsData.listening?.length || 1) + 
                          (lessonsData.writing?.length || 2) + 
                          (lessonsData.speaking?.length || 2)
      
      // Calculate REAL band score from actual performance
      let realBandScore = 0
      if (totalExercises > 0) {
        const accuracyPercentage = (totalCorrect / totalExercises) * 100
        
        // IELTS-like scoring based on accuracy
        if (accuracyPercentage >= 97.5) realBandScore = 9.0      // 39-40/40
        else if (accuracyPercentage >= 92.5) realBandScore = 8.5 // 37-38/40
        else if (accuracyPercentage >= 87.5) realBandScore = 8.0 // 35-36/40
        else if (accuracyPercentage >= 82.5) realBandScore = 7.5 // 33-34/40
        else if (accuracyPercentage >= 75) realBandScore = 7.0   // 30-32/40
        else if (accuracyPercentage >= 67.5) realBandScore = 6.5 // 27-29/40
        else if (accuracyPercentage >= 57.5) realBandScore = 6.0 // 23-26/40
        else if (accuracyPercentage >= 47.5) realBandScore = 5.5 // 19-22/40
        else if (accuracyPercentage >= 37.5) realBandScore = 5.0 // 15-18/40
        else if (accuracyPercentage >= 30) realBandScore = 4.5
        else if (accuracyPercentage >= 22.5) realBandScore = 4.0
        else realBandScore = 3.5
      }
      
      // Convert real study time to minutes
      const realStudyTimeMinutes = Math.floor(realStudyTimeSeconds / 60)
      
      // Smart fallback: If no real data, estimate from completed lessons
      const finalStudyTime = realStudyTimeMinutes > 0 ? realStudyTimeMinutes : totalCompleted * 30
      const finalBandScore = realBandScore > 0 ? realBandScore : (totalCompleted > 0 ? 6.0 : 0)
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalLessons: totalLessons,
        completedLessons: totalCompleted,
        streakDays: streakDays,
        studyTimeMinutes: finalStudyTime,
        estimatedScore: finalBandScore
      }))
      
      // Update modules
      setModules([
        {
          name: 'Reading',
          icon: '📖',
          total: lessonsData.reading?.length || 3,
          completed: readingCompleted,
          color: 'reading',
          path: '/reading',
        },
        {
          name: 'Listening',
          icon: '🎧',
          total: lessonsData.listening?.length || 1,
          completed: listeningCompleted,
          color: 'listening',
          path: '/listening',
        },
        {
          name: 'Writing',
          icon: '✍️',
          total: lessonsData.writing?.length || 2,
          completed: writingCompleted,
          color: 'writing',
          path: '/writing',
        },
        {
          name: 'Speaking',
          icon: '🗣️',
          total: lessonsData.speaking?.length || 2,
          completed: speakingCompleted,
          color: 'speaking',
          path: '/speaking',
        },
      ])
      
      // Load recent activity from backend
      if (token && completionDates.length > 0) {
        try {
          const activityResponse = await fetch('http://localhost:8000/api/v1/lesson-progress/', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (activityResponse.ok) {
            const activityData = await activityResponse.json()
            
            // Get last 3 completed lessons
            const recentLessons = activityData
              .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
              .slice(0, 3)
              .map((item, index) => {
                const moduleEmoji = {
                  'reading': '📖',
                  'listening': '🎧',
                  'writing': '✍️',
                  'speaking': '🗣️'
                }
                
                const lessonId = item.lesson_id.includes('-') ? item.lesson_id.split('-')[1] : item.lesson_id
                const fullLessonId = `${item.module}-${lessonId}`
                
                // Find lesson title from lessonsData
                const lessonData = lessonsData[item.module]?.find(l => l.id === fullLessonId)
                const lessonTitle = lessonData?.title || `${item.module.charAt(0).toUpperCase() + item.module.slice(1)} Lesson ${lessonId}`
                
                // Format time ago
                const completedDate = new Date(item.completed_at)
                const now = new Date()
                const diffMs = now - completedDate
                const diffMins = Math.floor(diffMs / (1000 * 60))
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
                
                let timeAgo = 'Just now'
                if (diffDays > 0) timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
                else if (diffHours > 0) timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
                else if (diffMins > 0) timeAgo = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
                
                return {
                  id: index + 1,
                  title: `Completed: ${lessonTitle}`,
                  description: `${item.module.charAt(0).toUpperCase() + item.module.slice(1)} Module`,
                  time: timeAgo,
                  icon: moduleEmoji[item.module] || '✅',
                }
              })
            
            if (recentLessons.length > 0) {
              setRecentActivity(recentLessons)
            }
          }
        } catch (error) {
          console.error('Failed to load recent activity:', error)
        }
      }
      
    } catch (error) {
      console.error('Failed to load progress:', error)
    }
  }

  const recommendations = [
    {
      id: 1,
      title: 'Start with Reading Basics',
      description: 'Build a strong foundation with fundamental reading skills',
      module: 'Reading',
      path: '/reading',
    },
    {
      id: 2,
      title: 'Daily Practice Challenge',
      description: 'Complete one lesson per day to build your streak',
      module: 'All',
      path: '/lesson-plan',
    },
    {
      id: 3,
      title: 'Set Your Test Date',
      description: 'Add your test date to get a personalized study plan',
      module: 'Profile',
      path: '/profile',
    },
  ]

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div>
          <h1>Welcome back, {user?.full_name || 'Learner'}! 👋</h1>
          <p>Let's continue your IELTS preparation journey</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <Card padding="md" className={styles.statCard}>
          <div className={styles.statIcon}>🎯</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.completedLessons}/{stats.totalLessons}</div>
            <div className={styles.statLabel}>Lessons Completed</div>
          </div>
        </Card>

        <Card padding="md" className={styles.statCard}>
          <div className={styles.statIcon}>🔥</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.streakDays} Days</div>
            <div className={styles.statLabel}>Current Streak</div>
          </div>
        </Card>

        <Card padding="md" className={styles.statCard}>
          <div className={styles.statIcon}>⏱️</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{Math.floor(stats.studyTimeMinutes / 60)}h {stats.studyTimeMinutes % 60}m</div>
            <div className={styles.statLabel}>Study Time</div>
          </div>
        </Card>

        <Card padding="md" className={styles.statCard}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>
              {stats.estimatedScore > 0 ? stats.estimatedScore.toFixed(1) : '-'}
            </div>
            <div className={styles.statLabel}>
              {stats.estimatedScore === 6.0 && stats.completedLessons > 0 ? 'Est. Band Score' : 'Current Band Score'}
            </div>
          </div>
        </Card>
      </div>

      <div className={styles.content}>
        <div className={styles.mainContent}>
          <section className={styles.section}>
            <h2>Your Progress</h2>
            <div className={styles.modulesGrid}>
              {modules.map((module) => (
                <Link key={module.name} to={module.path} className={styles.moduleCard}>
                  <Card hover padding="md">
                    <div className={styles.moduleHeader}>
                      <div className={`${styles.moduleIcon} ${styles[module.color]}`}>
                        {module.icon}
                      </div>
                      <div className={styles.moduleInfo}>
                        <h3>{module.name}</h3>
                        <p>{module.completed}/{module.total} lessons</p>
                      </div>
                    </div>
                    <ProgressBar 
                      value={(module.completed / module.total) * 100} 
                      color={module.color}
                    />
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2>Recent Activity</h2>
            <div className={styles.activityList}>
              {recentActivity.map((activity) => (
                <Card key={activity.id} padding="md" className={styles.activityCard}>
                  <div className={styles.activityIcon}>{activity.icon}</div>
                  <div className={styles.activityContent}>
                    <h4>{activity.title}</h4>
                    <p>{activity.description}</p>
                    <span className={styles.activityTime}>{activity.time}</span>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>

        <aside className={styles.sidebar}>
          <section className={styles.section}>
            <h3>Recommended for You</h3>
            <div className={styles.recommendationsList}>
              {recommendations.map((rec) => (
                <Link key={rec.id} to={rec.path} className={styles.recommendationCard}>
                  <Card hover padding="sm">
                    <h4>{rec.title}</h4>
                    <p>{rec.description}</p>
                    <span className={styles.badge}>{rec.module}</span>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <Card padding="md" className={styles.targetCard}>
              <h3>Your Target</h3>
              <div className={styles.targetScore}>
                <div className={styles.scoreCircle}>
                  <span className={styles.scoreValue}>{stats.targetScore}</span>
                  <span className={styles.scoreLabel}>Band Score</span>
                </div>
              </div>
              <p className={styles.targetMessage}>
                Keep practicing to reach your goal!
              </p>
            </Card>
          </section>
        </aside>
      </div>
    </div>
  )
}

export default Dashboard
