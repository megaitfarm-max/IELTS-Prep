import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@components/common/Card'
import ProgressBar from '@components/common/ProgressBar'
import styles from './LessonPlan.module.css'
import lessonsData from '../../data/lessons.json'

function LessonPlan() {
  const [expandedModule, setExpandedModule] = useState(null)
  const [completedLessons, setCompletedLessons] = useState([])
  
  useEffect(() => {
    // Load completed lessons from localStorage
    const completed = JSON.parse(localStorage.getItem('completedLessons') || '[]')
    setCompletedLessons(completed)
    
    // Load from backend
    const loadFromBackend = async () => {
      try {
        const token = localStorage.getItem('token')
        if (token) {
          const response = await fetch('http://localhost:8000/api/v1/lesson-progress/', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (response.ok) {
            const data = await response.json()
            // Ensure consistent format: module-lessonNumber (e.g., 'reading-2')
            const backendCompleted = data.map(item => {
              const lessonId = item.lesson_id.includes('-') ? item.lesson_id.split('-')[1] : item.lesson_id
              return `${item.module}-${lessonId}`
            })
            const merged = [...new Set([...completed, ...backendCompleted])]
            setCompletedLessons(merged)
            localStorage.setItem('completedLessons', JSON.stringify(merged))
          }
        }
      } catch (error) {
        console.error('Failed to load progress from backend:', error)
      }
    }
    loadFromBackend()
  }, [])
  
  const modulesConfig = [
    {
      id: 'reading',
      name: 'Reading Module',
      icon: '📖',
      color: 'reading',
      description: 'Master IELTS reading with diverse passages and question types',
      estimatedTime: '8 hours',
      path: '/reading',
    },
    {
      id: 'listening',
      name: 'Listening Module',
      icon: '🎧',
      color: 'listening',
      description: 'Improve comprehension with various accents and contexts',
      estimatedTime: '6 hours',
      path: '/listening',
    },
    {
      id: 'writing',
      name: 'Writing Module',
      icon: '✍️',
      color: 'writing',
      description: 'Develop skills for Task 1 reports and Task 2 essays',
      estimatedTime: '10 hours',
      path: '/writing',
    },
    {
      id: 'speaking',
      name: 'Speaking Module',
      icon: '🗣️',
      color: 'speaking',
      description: 'Build confidence in all three speaking parts',
      estimatedTime: '4 hours',
      path: '/speaking',
    },
  ]

  const modules = modulesConfig.map(config => {
    const lessons = lessonsData[config.id] || []
    const completed = completedLessons.filter(key => key.startsWith(`${config.id}-`)).length
    return {
      ...config,
      totalLessons: lessons.length,
      completedLessons: completed,
      lessons: lessons.slice(0, 5) // Show first 5 lessons as preview
    }
  })

  const toggleModule = (moduleId) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId)
  }

  return (
    <div className={styles.lessonPlan}>
      <div className={styles.header}>
        <h1>📚 Lesson Plan</h1>
        <p>Choose a module to start your IELTS preparation journey</p>
      </div>

      <div className={styles.modules}>
        {modules.map((module) => (
          <div key={module.id} className={styles.moduleSection}>
            <Card padding="lg">
              <div className={styles.moduleHeader}>
                <div className={styles.moduleInfo}>
                  <div className={`${styles.moduleIcon} ${styles[module.color]}`}>
                    {module.icon}
                  </div>
                  <div>
                    <h2>{module.name}</h2>
                    <p className={styles.moduleDescription}>{module.description}</p>
                    <div className={styles.moduleStats}>
                      <span>📊 {module.totalLessons} Lessons</span>
                      <span>⏱️ {module.estimatedTime}</span>
                      <span>✅ {module.completedLessons} Completed</span>
                    </div>
                  </div>
                </div>
                <Link to={module.path}>
                  <button className={`${styles.startButton} ${styles[module.color]}`}>
                    Start Module →
                  </button>
                </Link>
              </div>

              <div className={styles.progressSection}>
                <div className={styles.progressHeader}>
                  <span>Progress</span>
                  <span>{Math.round((module.completedLessons / module.totalLessons) * 100)}%</span>
                </div>
                <ProgressBar 
                  value={(module.completedLessons / module.totalLessons) * 100} 
                  color={module.color}
                />
              </div>

              <div className={styles.lessonsList}>
                <h3>Lessons Preview</h3>
                {module.lessons.map((lesson, index) => (
                  <Link 
                    key={lesson.id} 
                    to={`/lessons/${module.id}/${lesson.id}`}
                    className={styles.lessonItemLink}
                  >
                    <div className={styles.lessonItem}>
                      <div className={styles.lessonNumber}>
                        {lesson.completed ? '✓' : index + 1}
                      </div>
                      <div className={styles.lessonInfo}>
                        <h4>{lesson.title}</h4>
                        <div className={styles.lessonMeta}>
                          <span className={styles.duration}>⏱️ {lesson.duration} min</span>
                          <span className={`${styles.difficulty} ${styles[lesson.difficulty.toLowerCase()]}`}>
                            {lesson.difficulty}
                          </span>
                        </div>
                      </div>
                      {lesson.completed && (
                        <div className={styles.completedBadge}>Completed</div>
                      )}
                    </div>
                  </Link>
                ))}
                {module.totalLessons > 5 && (
                  <button 
                    className={styles.viewAll}
                    onClick={() => toggleModule(module.id)}
                  >
                    {expandedModule === module.id 
                      ? `Show less ▲` 
                      : `View all ${module.totalLessons} lessons →`
                    }
                  </button>
                )}

                {/* Show all lessons when expanded */}
                {expandedModule === module.id && (
                  <div className={styles.allLessons}>
                    {lessonsData[module.id].slice(5).map((lesson, index) => (
                      <Link 
                        key={lesson.id} 
                        to={`/lessons/${module.id}/${lesson.id}`}
                        className={styles.lessonItemLink}
                      >
                        <div className={styles.lessonItem}>
                          <div className={styles.lessonNumber}>
                            {index + 6}
                          </div>
                          <div className={styles.lessonInfo}>
                            <h4>{lesson.title}</h4>
                            <div className={styles.lessonMeta}>
                              <span className={styles.duration}>⏱️ {lesson.duration} min</span>
                              <span className={`${styles.difficulty} ${styles[lesson.difficulty.toLowerCase()]}`}>
                                {lesson.difficulty}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        ))}
      </div>

      <div className={styles.studyTips}>
        <Card padding="md">
          <h3>💡 Study Tips</h3>
          <ul>
            <li>Complete at least one lesson per day to maintain your streak</li>
            <li>Focus on your weakest module first for maximum improvement</li>
            <li>Use the AI chatbot if you have questions during lessons</li>
            <li>Take mock tests regularly to track your progress</li>
            <li>Set your test date in your profile for a personalized study plan</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}

export default LessonPlan
