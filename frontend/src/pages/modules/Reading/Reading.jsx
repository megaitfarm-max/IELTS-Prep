import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Card } from '@components/common/Card'
import styles from './Reading.module.css'
import lessonsData from '../../../data/lessons.json'

function Reading() {
  const [completedLessons, setCompletedLessons] = useState([])
  const lessons = lessonsData.reading || []

  useEffect(() => {
    // Load completed lessons from localStorage
    const completed = JSON.parse(localStorage.getItem('completedLessons') || '[]')
    const readingCompleted = completed.filter(key => key.startsWith('reading-'))
    setCompletedLessons(readingCompleted)
    
    // Also try to load from backend
    const loadFromBackend = async () => {
      try {
        const token = localStorage.getItem('token')
        if (token) {
          const response = await fetch('http://localhost:8000/api/v1/lesson-progress/reading', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          if (response.ok) {
            const data = await response.json()
            // Strip duplicate prefix if exists
            const backendCompleted = data.map(item => {
              const lessonId = item.lesson_id.includes('-') ? item.lesson_id.split('-')[1] : item.lesson_id
              return `reading-${lessonId}`
            })
            // Merge with localStorage and remove duplicates
            const merged = [...new Set([...readingCompleted, ...backendCompleted])]
            setCompletedLessons(merged)
            // Update localStorage with merged unique values
            const allCompleted = JSON.parse(localStorage.getItem('completedLessons') || '[]')
            const otherModules = allCompleted.filter(key => !key.startsWith('reading-'))
            localStorage.setItem('completedLessons', JSON.stringify([...otherModules, ...merged]))
          }
        }
      } catch (error) {
        console.error('Failed to load progress from backend:', error)
      }
    }
    
    loadFromBackend()
  }, [])

  const isLessonCompleted = (lessonId) => {
    // lessonId already contains the module prefix (e.g., 'reading-1')
    return completedLessons.includes(lessonId)
  }

  const completedCount = completedLessons.length

  return (
    <div className={styles.readingModule}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.moduleIcon}>📖</div>
          <div>
            <h1>Reading Module</h1>
            <p>Master IELTS reading with diverse passages and question types</p>
          </div>
        </div>
        <div className={styles.moduleStats}>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{lessons.length}</span>
            <span className={styles.statLabel}>Total Lessons</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{completedCount}</span>
            <span className={styles.statLabel}>Completed</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNumber}>{lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0}%</span>
            <span className={styles.statLabel}>Progress</span>
          </div>
        </div>
      </div>

      <div className={styles.lessonGrid}>
        {lessons.map((lesson, index) => {
          const isCompleted = isLessonCompleted(lesson.id)
          return (
          <Link 
            key={lesson.id} 
            to={`/lessons/reading/${lesson.id}`} 
            className={styles.lessonLink}
          >
            <Card hover>
              <div className={`${styles.lessonCard} ${isCompleted ? styles.completed : ''}`}>
                {isCompleted && <div className={styles.completedBadge}>✓ COMPLETED</div>}
                <div className={styles.lessonNumber}>
                  {isCompleted ? '✓' : index + 1}
                </div>
                <div className={styles.lessonContent}>
                  <h3 className={styles.lessonTitle}>{lesson.title}</h3>
                  <p className={styles.lessonDescription}>{lesson.description}</p>
                  <div className={styles.lessonMeta}>
                    <span className={styles.duration}>⏱️ {lesson.duration} min</span>
                    <span className={`${styles.difficulty} ${styles[lesson.difficulty.toLowerCase()]}`}>
                      {lesson.difficulty}
                    </span>
                  </div>
                  <div className={styles.lessonObjectives}>
                    <strong>You'll learn:</strong>
                    <ul>
                      {lesson.objectives.slice(0, 2).map((obj, i) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                  <div className={styles.startButton}>
                    {isCompleted ? 'Review Lesson →' : 'Start Lesson →'}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        )})}
      </div>

      {lessons.length === 0 && (
        <div className={styles.emptyState}>
          <p>No lessons available yet. Check back soon!</p>
        </div>
      )}
    </div>
  )
}

export default Reading
