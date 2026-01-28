import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './WritingPractice.module.css'

const SAMPLE_PROMPTS = {
  task1: [
    "The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.",
    "The diagram below shows the process of making chocolate. Summarize the information by selecting and reporting the main features.",
    "The table below gives information about the underground railway systems in six cities. Summarize the information by selecting and reporting the main features, and make comparisons where relevant."
  ],
  task2: [
    "Some people think that the teenage years are the happiest times of most people's lives. Others think that adult life brings more happiness, in spite of greater responsibilities. Discuss both these views and give your own opinion.",
    "In some countries, owning a home rather than renting one is very important for people. Why might this be the case? Do you think this is a positive or negative situation?",
    "Many people believe that social networking sites (such as Facebook) have had a huge negative impact on both individuals and society. To what extent do you agree or disagree?"
  ]
}

const WritingPractice = () => {
  const navigate = useNavigate()
  const [taskType, setTaskType] = useState('task2')
  const [prompt, setPrompt] = useState('')
  const [essay, setEssay] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', type: 'info', onConfirm: null })

  useEffect(() => {
    loadSubmissions()
  }, [])

  useEffect(() => {
    setWordCount(essay.trim().split(/\s+/).filter(word => word.length > 0).length)
  }, [essay])

  const loadSubmissions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/v1/writing/submissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setSubmissions(data)
      }
    } catch (error) {
      console.error('Failed to load submissions:', error)
    }
  }

  const loadSamplePrompt = () => {
    const prompts = SAMPLE_PROMPTS[taskType]
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)]
    setPrompt(randomPrompt)
  }

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setModalConfig({
        title: '⚠️ Missing Prompt',
        message: 'Please enter a prompt before submitting your essay.',
        type: 'warning',
        onConfirm: null
      })
      setShowModal(true)
      return
    }

    const minWords = taskType === 'task1' ? 150 : 250
    if (wordCount < minWords) {
      setModalConfig({
        title: '⚠️ Word Count Warning',
        message: `Your essay has only ${wordCount} words. ${taskType === 'task1' ? 'Task 1' : 'Task 2'} requires at least ${minWords} words. Submit anyway?`,
        type: 'confirm',
        onConfirm: () => submitEssay()
      })
      setShowModal(true)
      return
    }

    await submitEssay()
  }

  const submitEssay = async () => {

    setIsSubmitting(true)
    setFeedback(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/v1/writing/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          task_type: taskType,
          prompt: prompt,
          user_essay: essay
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit essay')
      }

      const data = await response.json()
      setFeedback(data.feedback)
      await loadSubmissions()
      
      // Scroll to feedback
      setTimeout(() => {
        document.getElementById('feedback-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)

    } catch (error) {
      console.error('Submission error:', error)
      setModalConfig({
        title: '❌ Submission Failed',
        message: 'Failed to submit essay. Please check your connection and try again.',
        type: 'error',
        onConfirm: null
      })
      setShowModal(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNewEssay = () => {
    setEssay('')
    setPrompt('')
    setFeedback(null)
    setWordCount(0)
  }

  const loadSubmission = async (submissionId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/v1/writing/submissions/${submissionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setTaskType(data.task_type)
        setPrompt(data.prompt)
        setEssay(data.user_essay)
        setFeedback(data.feedback)
        setShowHistory(false)
        setTimeout(() => {
          document.getElementById('feedback-section')?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    } catch (error) {
      console.error('Failed to load submission:', error)
    }
  }

  const getBandColor = (score) => {
    if (score >= 8) return '#10b981'
    if (score >= 7) return '#3b82f6'
    if (score >= 6) return '#f59e0b'
    if (score >= 5) return '#ef4444'
    return '#991b1b'
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>✍️ IELTS Writing Practice</h1>
        <p>Get instant AI feedback on your essays with detailed band scores</p>
        <div className={styles.headerActions}>
          <button 
            className={styles.historyButton}
            onClick={() => setShowHistory(!showHistory)}
          >
            📜 {showHistory ? 'Hide' : 'Show'} History ({submissions.length})
          </button>
          <button 
            className={styles.newEssayButton}
            onClick={handleNewEssay}
          >
            ➕ New Essay
          </button>
        </div>
      </div>

      {showHistory && (
        <div className={styles.historyPanel}>
          <h3>Your Previous Submissions</h3>
          {submissions.length === 0 ? (
            <p className={styles.emptyHistory}>No submissions yet. Start writing your first essay!</p>
          ) : (
            <div className={styles.historyList}>
              {submissions.map(sub => (
                <div 
                  key={sub.id}
                  className={styles.historyItem}
                  onClick={() => loadSubmission(sub.id)}
                >
                  <div className={styles.historyTop}>
                    <span className={styles.historyType}>
                      {sub.task_type === 'task1' ? 'Task 1' : 'Task 2'}
                    </span>
                    <span className={styles.historyDate}>
                      {new Date(sub.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.historyPrompt}>
                    {sub.prompt.substring(0, 100)}...
                  </div>
                  <div className={styles.historyMeta}>
                    {sub.word_count} words • {sub.has_feedback ? '✅ Feedback Available' : '⏳ Processing'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className={styles.editorSection}>
        <div className={styles.taskTypeSelector}>
          <button
            className={`${styles.taskTypeButton} ${taskType === 'task1' ? styles.active : ''}`}
            onClick={() => setTaskType('task1')}
          >
            Task 1 (Report/Chart)
          </button>
          <button
            className={`${styles.taskTypeButton} ${taskType === 'task2' ? styles.active : ''}`}
            onClick={() => setTaskType('task2')}
          >
            Task 2 (Essay)
          </button>
        </div>

        <div className={styles.promptSection}>
          <div className={styles.promptHeader}>
            <label>Essay Prompt</label>
            <button className={styles.sampleButton} onClick={loadSamplePrompt}>
              🎲 Load Sample Prompt
            </button>
          </div>
          <textarea
            className={styles.promptInput}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your essay prompt or load a sample..."
            rows={3}
          />
        </div>

        <div className={styles.editorContainer}>
          <div className={styles.editorHeader}>
            <label>Your Essay</label>
            <div className={styles.wordCounter}>
              <span className={wordCount < (taskType === 'task1' ? 150 : 250) ? styles.warning : styles.good}>
                {wordCount} words
              </span>
              <span className={styles.minWords}>
                (min: {taskType === 'task1' ? '150' : '250'})
              </span>
            </div>
          </div>
          <textarea
            className={styles.essayEditor}
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            placeholder="Start writing your essay here..."
            rows={15}
          />
        </div>

        <button
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={isSubmitting || !essay.trim() || !prompt.trim()}
        >
          {isSubmitting ? '🔄 Analyzing...' : '🚀 Submit for AI Feedback'}
        </button>
      </div>

      {feedback && (
        <div id="feedback-section" className={styles.feedbackSection}>
          <h2>📊 Your Feedback</h2>
          
          <div className={styles.bandScores}>
            <div className={styles.overallScore} style={{ borderColor: getBandColor(feedback.overall_score || 0) }}>
              <div className={styles.scoreLabel}>Overall Band</div>
              <div className={styles.scoreValue} style={{ color: getBandColor(feedback.overall_score || 0) }}>
                {(feedback.overall_score || 0).toFixed(1)}
              </div>
            </div>

            <div className={styles.criteriaScores}>
              <div className={styles.criteriaScore}>
                <div className={styles.criteriaLabel}>Task Achievement</div>
                <div className={styles.criteriaValue} style={{ color: getBandColor(feedback.task_achievement || 0) }}>
                  {(feedback.task_achievement || 0).toFixed(1)}
                </div>
              </div>
              <div className={styles.criteriaScore}>
                <div className={styles.criteriaLabel}>Coherence & Cohesion</div>
                <div className={styles.criteriaValue} style={{ color: getBandColor(feedback.coherence_cohesion || 0) }}>
                  {(feedback.coherence_cohesion || 0).toFixed(1)}
                </div>
              </div>
              <div className={styles.criteriaScore}>
                <div className={styles.criteriaLabel}>Lexical Resource</div>
                <div className={styles.criteriaValue} style={{ color: getBandColor(feedback.lexical_resource || 0) }}>
                  {(feedback.lexical_resource || 0).toFixed(1)}
                </div>
              </div>
              <div className={styles.criteriaScore}>
                <div className={styles.criteriaLabel}>Grammar Range</div>
                <div className={styles.criteriaValue} style={{ color: getBandColor(feedback.grammatical_range || 0) }}>
                  {(feedback.grammatical_range || 0).toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.feedbackDetails}>
            <div className={styles.feedbackCard}>
              <h3>✅ Strengths</h3>
              <ul>
                {feedback.strengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>

            <div className={styles.feedbackCard}>
              <h3>⚠️ Areas for Improvement</h3>
              <ul>
                {feedback.weaknesses.map((weakness, index) => (
                  <li key={index}>{weakness}</li>
                ))}
              </ul>
            </div>

            <div className={styles.feedbackCard}>
              <h3>💡 Suggestions</h3>
              <ul>
                {feedback.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>{modalConfig.title}</h3>
            <p>{modalConfig.message}</p>
            <div className={styles.modalActions}>
              {modalConfig.type === 'confirm' ? (
                <>
                  <button 
                    className={styles.modalCancelButton}
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className={styles.modalConfirmButton}
                    onClick={() => {
                      setShowModal(false)
                      if (modalConfig.onConfirm) modalConfig.onConfirm()
                    }}
                  >
                    Submit Anyway
                  </button>
                </>
              ) : (
                <button 
                  className={styles.modalOkButton}
                  onClick={() => setShowModal(false)}
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WritingPractice
