import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styles from './LessonDetail.module.css'
import lessonsData from '../../data/lessons.json'

const LessonDetail = () => {
  const { module, lessonId } = useParams()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState(null)
  const [currentExercise, setCurrentExercise] = useState(0)
  const [userAnswers, setUserAnswers] = useState({})
  const [showResults, setShowResults] = useState({})
  const [completed, setCompleted] = useState(false)
  const [attemptId, setAttemptId] = useState(null)
  const [startTime, setStartTime] = useState(Date.now())

  useEffect(() => {
    // Load lesson data
    if (module && lessonsData[module]) {
      const foundLesson = lessonsData[module].find(l => l.id === lessonId)
      setLesson(foundLesson)
      
      // Check if already completed
      const completedLessons = JSON.parse(localStorage.getItem('completedLessons') || '[]')
      if (completedLessons.includes(lessonId)) {
        setCompleted(true)
        // Load previous attempt data
        loadPreviousAttempt()
      } else {
        // Start new attempt
        startLessonAttempt(foundLesson)
      }
    }
  }, [module, lessonId])
  
  const startLessonAttempt = async (lessonData) => {
    try {
      const token = localStorage.getItem('token')
      if (token && lessonData) {
        const cleanLessonId = lessonId.includes('-') ? lessonId.split('-')[1] : lessonId
        
        const response = await fetch('http://localhost:8000/api/v1/lesson-attempts/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            lesson_id: cleanLessonId,
            module: module,
            exercises_total: lessonData.exercises?.length || 0
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          setAttemptId(data.id)
          console.log('Started lesson attempt:', data.id)
        }
      }
    } catch (error) {
      console.error('Failed to start lesson attempt:', error)
    }
  }
  
  const loadPreviousAttempt = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const cleanLessonId = lessonId.includes('-') ? lessonId.split('-')[1] : lessonId
        
        const response = await fetch(`http://localhost:8000/api/v1/lesson-attempts/lesson/${module}/${cleanLessonId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setAttemptId(data.id)
          
          // Restore user answers and results
          if (data.user_answers) {
            setUserAnswers(JSON.parse(data.user_answers))
          }
          if (data.exercise_results) {
            const results = JSON.parse(data.exercise_results)
            const formattedResults = {}
            Object.keys(results).forEach(key => {
              formattedResults[key] = { shown: true, correct: results[key] }
            })
            setShowResults(formattedResults)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load previous attempt:', error)
    }
  }
  
  const updateAttempt = async (updates) => {
    if (!attemptId) return
    
    try {
      const token = localStorage.getItem('token')
      if (token) {
        await fetch(`http://localhost:8000/api/v1/lesson-attempts/${attemptId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updates)
        })
      }
    } catch (error) {
      console.error('Failed to update attempt:', error)
    }
  }

  const handleAnswerSelect = (exerciseIndex, answer) => {
    const newAnswers = {
      ...userAnswers,
      [exerciseIndex]: answer
    }
    setUserAnswers(newAnswers)
    
    // Save answers to backend
    updateAttempt({
      user_answers: JSON.stringify(newAnswers),
      exercises_attempted: Object.keys(newAnswers).length
    })
  }

  const checkAnswer = (exerciseIndex) => {
    const exercise = lesson.exercises[exerciseIndex]
    const userAnswer = userAnswers[exerciseIndex]
    const isCorrect = userAnswer === exercise.correctAnswer

    const newResults = {
      ...showResults,
      [exerciseIndex]: {
        shown: true,
        correct: isCorrect
      }
    }
    setShowResults(newResults)
    
    // Calculate stats
    const correctCount = Object.values(newResults).filter(r => r.correct).length
    const resultsForBackend = {}
    Object.keys(newResults).forEach(key => {
      resultsForBackend[key] = newResults[key].correct
    })
    
    // Save results to backend
    updateAttempt({
      exercise_results: JSON.stringify(resultsForBackend),
      exercises_correct: correctCount,
      time_spent_seconds: Math.floor((Date.now() - startTime) / 1000)
    })
  }

  const completeLesson = async () => {
    setCompleted(true)
    
    // Calculate final score
    const correctCount = Object.values(showResults).filter(r => r.correct).length
    const totalExercises = lesson.exercises?.length || 0
    const scorePercentage = totalExercises > 0 ? Math.round((correctCount / totalExercises) * 100) : 0
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    
    // Save to localStorage for immediate feedback
    const completedLessons = JSON.parse(localStorage.getItem('completedLessons') || '[]')
    if (!completedLessons.includes(lessonId)) {
      completedLessons.push(lessonId)
      localStorage.setItem('completedLessons', JSON.stringify(completedLessons))
    }
    
    // Smart save: If no attemptId, create one first
    const token = localStorage.getItem('token')
    if (token) {
      try {
        if (!attemptId && lesson) {
          // Create attempt if it doesn't exist
          const cleanLessonId = lessonId.includes('-') ? lessonId.split('-')[1] : lessonId
          const response = await fetch('http://localhost:8000/api/v1/lesson-attempts/start', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              lesson_id: cleanLessonId,
              module: module,
              exercises_total: totalExercises
            })
          })
          
          if (response.ok) {
            const data = await response.json()
            setAttemptId(data.id)
            
            // Now update it immediately with completion data
            await fetch(`http://localhost:8000/api/v1/lesson-attempts/${data.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                is_completed: true,
                score_percentage: scorePercentage,
                time_spent_seconds: timeSpent,
                exercises_correct: correctCount,
                exercises_attempted: Object.keys(userAnswers).length,
                exercises_total: totalExercises,
                user_answers: JSON.stringify(userAnswers),
                exercise_results: JSON.stringify(
                  Object.keys(showResults).reduce((acc, key) => {
                    acc[key] = showResults[key].correct
                    return acc
                  }, {})
                )
              })
            })
          }
        } else {
          // Update existing attempt
          await updateAttempt({
            is_completed: true,
            score_percentage: scorePercentage,
            time_spent_seconds: timeSpent,
            exercises_correct: correctCount
          })
        }
      } catch (error) {
        console.error('Failed to save attempt:', error)
      }
    }
    
    // Save to backend API (lesson progress)
    try {
      const token = localStorage.getItem('token')
      if (token) {
        // Strip module prefix if it exists (e.g., 'reading-2' -> '2')
        const cleanLessonId = lessonId.includes('-') ? lessonId.split('-')[1] : lessonId
        
        await fetch('http://localhost:8000/api/v1/lesson-progress/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            lesson_id: cleanLessonId,
            module: module
          })
        })
      }
    } catch (error) {
      console.error('Failed to save progress to backend:', error)
      // Continue anyway since we have localStorage backup
    }
  }

  const getModuleIcon = () => {
    const icons = {
      reading: '📖',
      listening: '🎧',
      writing: '✍️',
      speaking: '🗣️'
    }
    return icons[module] || '📚'
  }

  if (!lesson) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading lesson...</p>
      </div>
    )
  }

  return (
    <div className={styles.lessonContainer}>
      {/* Header */}
      <div className={styles.lessonHeader}>
        <button className={styles.backButton} onClick={() => navigate(`/${module}`)}>
          ← Back to {module.charAt(0).toUpperCase() + module.slice(1)} Module
        </button>
        <div className={styles.moduleTag}>
          <span className={styles.moduleIcon}>{getModuleIcon()}</span>
          <span>{module.charAt(0).toUpperCase() + module.slice(1)} Module</span>
        </div>
      </div>

      {/* Title Section */}
      <div className={styles.titleSection}>
        <h1 className={styles.lessonTitle}>{lesson.title}</h1>
        <div className={styles.lessonMeta}>
          <span className={styles.duration}>⏱️ {lesson.duration} min</span>
          <span className={styles.difficulty}>{lesson.difficulty}</span>
        </div>
        <p className={styles.description}>{lesson.description}</p>
      </div>

      {/* Objectives */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>🎯 Learning Objectives</h2>
        <ul className={styles.objectivesList}>
          {lesson.objectives.map((obj, index) => (
            <li key={index} className={styles.objective}>
              <span className={styles.checkIcon}>✓</span>
              {obj}
            </li>
          ))}
        </ul>
      </div>

      {/* Introduction */}
      {lesson.content.introduction && (
        <div className={styles.section}>
          <div className={styles.introBox}>
            <p>{lesson.content.introduction}</p>
          </div>
        </div>
      )}

      {/* Content Sections */}
      {lesson.content.sections && lesson.content.sections.map((section, index) => (
        <div key={index} className={styles.section}>
          <h2 className={styles.sectionTitle}>{section.title}</h2>
          <div 
            className={styles.sectionContent}
            dangerouslySetInnerHTML={{ __html: section.content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>') }}
          />
        </div>
      ))}

      {/* Practice Passage (for Reading lessons) */}
      {lesson.content.practicePassage && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>📄 Practice Passage</h2>
          <div className={styles.passageBox}>
            <h3 className={styles.passageTitle}>{lesson.content.practicePassage.title}</h3>
            <p className={styles.passageText}>{lesson.content.practicePassage.text}</p>
          </div>
        </div>
      )}

      {/* Key Takeaways */}
      {lesson.content.keyTakeaways && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>💡 Key Takeaways</h2>
          <div className={styles.takeawaysBox}>
            {lesson.content.keyTakeaways.map((takeaway, index) => (
              <div key={index} className={styles.takeaway}>
                <span className={styles.bulletIcon}>▶</span>
                <span>{takeaway}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercises */}
      {lesson.exercises && lesson.exercises.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>✏️ Practice Exercises</h2>
          {lesson.exercises.map((exercise, index) => (
            <div key={index} className={styles.exerciseCard}>
              <div className={styles.exerciseHeader}>
                <h3>Question {index + 1}</h3>
                {exercise.instruction && (
                  <p className={styles.instruction}>{exercise.instruction}</p>
                )}
              </div>

              {/* Show passage for exercises that have them */}
              {exercise.passage && (
                <div className={styles.exercisePassage}>
                  <p>{exercise.passage}</p>
                </div>
              )}

              <p className={styles.question}>{exercise.question}</p>

              {/* Multiple choice options */}
              <div className={styles.optionsContainer}>
                {exercise.options.map((option, optIndex) => (
                  <button
                    key={optIndex}
                    className={`${styles.optionButton} ${
                      userAnswers[index] === optIndex ? styles.selected : ''
                    } ${
                      showResults[index]?.shown
                        ? optIndex === exercise.correctAnswer
                          ? styles.correct
                          : userAnswers[index] === optIndex
                          ? styles.incorrect
                          : ''
                        : ''
                    }`}
                    onClick={() => handleAnswerSelect(index, optIndex)}
                    disabled={showResults[index]?.shown}
                  >
                    <span className={styles.optionLetter}>
                      {String.fromCharCode(65 + optIndex)}
                    </span>
                    <span className={styles.optionText}>{option}</span>
                  </button>
                ))}
              </div>

              {/* Check Answer Button */}
              {!showResults[index]?.shown && userAnswers[index] !== undefined && (
                <button
                  className={styles.checkButton}
                  onClick={() => checkAnswer(index)}
                >
                  Check Answer
                </button>
              )}

              {/* Feedback */}
              {showResults[index]?.shown && (
                <div
                  className={`${styles.feedback} ${
                    showResults[index].correct ? styles.correctFeedback : styles.incorrectFeedback
                  }`}
                >
                  <div className={styles.feedbackIcon}>
                    {showResults[index].correct ? '✓' : '✗'}
                  </div>
                  <div className={styles.feedbackContent}>
                    <p className={styles.feedbackTitle}>
                      {showResults[index].correct ? 'Correct!' : 'Incorrect'}
                    </p>
                    {exercise.explanation && (
                      <p className={styles.explanation}>{exercise.explanation}</p>
                    )}
                    {!showResults[index].correct && (
                      <p className={styles.correctAnswerText}>
                        The correct answer is: <strong>{exercise.options[exercise.correctAnswer]}</strong>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Speaking Practice Questions */}
      {lesson.exercises && lesson.exercises[0]?.type === 'speaking-practice' && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>🎤 Practice Questions</h2>
          {lesson.exercises.map((exercise, index) => (
            <div key={index} className={styles.speakingPracticeCard}>
              <h3 className={styles.practiceCategory}>
                Topic: {exercise.category}
              </h3>
              <div className={styles.questionsList}>
                {exercise.questions.map((question, qIndex) => (
                  <div key={qIndex} className={styles.practiceQuestion}>
                    <span className={styles.qNumber}>Q{qIndex + 1}</span>
                    <span className={styles.qText}>{question}</span>
                    <button className={styles.recordButton}>
                      🎙️ Record Answer
                    </button>
                  </div>
                ))}
              </div>
              <div className={styles.practiceHint}>
                💡 <strong>Tip:</strong> Practice answering each question for 20-30 seconds. 
                Record yourself and listen back to improve.
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Complete Lesson Button */}
      <div className={styles.completionSection}>
        {!completed ? (
          <button className={styles.completeButton} onClick={completeLesson}>
            ✓ Mark as Complete
          </button>
        ) : (
          <div className={styles.completedMessage}>
            <span className={styles.successIcon}>🎉</span>
            <h3>Lesson Completed!</h3>
            <p>Great job! You can now go back to the module or continue practicing.</p>
            <button className={styles.backToLessonsButton} onClick={() => navigate(`/${module}`)}>
              Back to {module.charAt(0).toUpperCase() + module.slice(1)} Module
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default LessonDetail
