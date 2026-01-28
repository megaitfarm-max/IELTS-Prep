import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../components/common/Card/Card'
import { apiRequest } from '@utils/api'
import styles from './TestHistory.module.css'

function TestHistory() {
  const navigate = useNavigate()
  const [testHistory, setTestHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedTestId, setExpandedTestId] = useState(null)

  useEffect(() => {
    fetchTestHistory()
  }, [])

  const fetchTestHistory = async () => {
    try {
      const response = await apiRequest('/api/v1/test-history')
      
      if (response.ok) {
        const data = await response.json()
        setTestHistory(data)
      } else {
        setError('Failed to load test history')
      }
    } catch (err) {
      console.error('Error fetching test history:', err)
      setError('Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getBandColor = (band) => {
    if (band >= 8.0) return '#10b981' // Green
    if (band >= 7.0) return '#3b82f6' // Blue
    if (band >= 6.0) return '#f59e0b' // Orange
    return '#ef4444' // Red
  }

  const viewTestDetails = (testId) => {
    if (expandedTestId === testId) {
      setExpandedTestId(null) // Collapse if already expanded
    } else {
      setExpandedTestId(testId) // Expand this test
    }
  }

  const closeDetails = () => {
    setExpandedTestId(null)
  }

  if (loading) {
    return (
      <div className={styles.testHistory}>
        <div className={styles.loading}>
          <div className={styles.loader}></div>
          <p>Loading test history...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.testHistory}>
        <Card>
          <div className={styles.error}>
            <p>❌ {error}</p>
            <button onClick={fetchTestHistory} className={styles.retryButton}>
              🔄 Retry
            </button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className={styles.testHistory}>
      <button onClick={() => navigate(-1)} className={styles.backButton}>
        ← Back
      </button>

      <div className={styles.header}>
        <h1>📊 Test History</h1>
        <p>View your past IELTS mock test performances</p>
      </div>

      {testHistory.length === 0 ? (
        <Card>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📝</div>
            <h3>No Test History Yet</h3>
            <p>Complete a mock test to see your history here</p>
            <button 
              onClick={() => navigate('/mock-tests')} 
              className={styles.startTestButton}
            >
              Start Your First Test
            </button>
          </div>
        </Card>
      ) : (
        <div className={styles.historyList}>
          {testHistory.map((test) => (
            <Card key={test.id} className={styles.testCard}>
              <div className={styles.testCardHeader}>
                <div className={styles.testDate}>
                  <span className={styles.dateIcon}>📅</span>
                  {formatDate(test.test_date)}
                </div>
                <div 
                  className={styles.overallBand}
                  style={{ backgroundColor: getBandColor(test.overall_score) }}
                >
                  Band {test.overall_score.toFixed(1)}
                </div>
              </div>

              <div className={styles.moduleScores}>
                {test.module_scores && Object.entries(test.module_scores).map(([module, score]) => (
                  <div key={module} className={styles.moduleScore}>
                    <span className={styles.moduleName}>
                      {module === 'listening' && '🎧 Listening'}
                      {module === 'reading' && '📖 Reading'}
                      {module === 'writing' && '✍️ Writing'}
                      {module === 'speaking' && '🗣️ Speaking'}
                    </span>
                    <span className={styles.scoreValue}>
                      {score.bandScore || score.band_score || 'N/A'}
                    </span>
                  </div>
                ))}
              </div>

              <div className={styles.testStats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>⏱️ Duration</span>
                  <span className={styles.statValue}>
                    {test.time_spent ? formatDuration(test.time_spent) : 'N/A'}
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>✅ Status</span>
                  <span className={`${styles.statValue} ${test.completed ? styles.completed : styles.incomplete}`}>
                    {test.completed ? 'Completed' : 'Incomplete'}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => viewTestDetails(test.id)} 
                className={styles.viewDetailsButton}
              >
                {expandedTestId === test.id ? '▲ Hide Details' : '▼ View Full Results'}
              </button>

              {/* Expanded Details Section */}
              {expandedTestId === test.id && (
                <div className={styles.expandedDetails}>
                  <div className={styles.detailsHeader}>
                    <h3>📋 Complete Test Breakdown</h3>
                  </div>

                  {/* Question by Question Analysis */}
                  {test.question_details && test.question_details.length > 0 && (
                    <div className={styles.questionBreakdownExpanded}>
                      <h4>Question-by-Question Analysis</h4>
                      <div className={styles.questionsGrid}>
                        {test.question_details.map((q, idx) => (
                          <div 
                            key={idx} 
                            className={`${styles.questionDetailCard} ${q.isCorrect ? styles.correctCard : styles.incorrectCard}`}
                          >
                            <div className={styles.questionCardHeader}>
                              <span className={styles.qNum}>Q{idx + 1}</span>
                              <span className={styles.qModule}>
                                {q.moduleType === 'listening' && '🎧 Listening'}
                                {q.moduleType === 'reading' && '📖 Reading'}
                                {q.moduleType === 'writing' && '✍️ Writing'}
                                {q.moduleType === 'speaking' && '🗣️ Speaking'}
                              </span>
                              <span className={`${styles.qStatusBadge} ${q.isCorrect ? styles.correct : styles.incorrect}`}>
                                {q.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                              </span>
                            </div>
                            
                            <div className={styles.questionText}>
                              <strong>Question:</strong> {q.question}
                            </div>

                            <div className={styles.answersSection}>
                              <div className={styles.answerBlock}>
                                <span className={styles.answerLabel}>Your Answer:</span>
                                <span className={`${styles.answerText} ${!q.isCorrect ? styles.wrongAnswer : ''}`}>
                                  {q.userAnswer || 'Not answered'}
                                </span>
                              </div>
                              <div className={styles.answerBlock}>
                                <span className={styles.answerLabel}>Correct Answer:</span>
                                <span className={`${styles.answerText} ${styles.correctAnswer}`}>
                                  {q.correctAnswer || 'N/A'}
                                </span>
                              </div>
                            </div>

                            {q.source && (
                              <div className={styles.sourceTag}>
                                🎬 Source: <a href={q.source.videoUrl} target="_blank" rel="noopener noreferrer">
                                  YouTube
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Remove the modal - we're using inline expansion now */}
    </div>
  )
}

export default TestHistory
