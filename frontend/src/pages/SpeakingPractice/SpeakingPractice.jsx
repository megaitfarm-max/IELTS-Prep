import React, { useState, useEffect, useRef } from 'react'
import styles from './SpeakingPractice.module.css'

const IELTS_TOPICS = {
  part1: [
    { id: 1, topic: 'Hometown', questions: [
      "Where are you from?",
      "Do you like your hometown? Why?",
      "What do you like most about your hometown?",
      "Has your hometown changed much over the years?",
      "Would you like to live in your hometown in the future?",
      "What could be improved about your hometown?"
    ]},
    { id: 2, topic: 'Work/Studies', questions: [
      "Do you work or are you a student?",
      "What do you study/do?",
      "Why did you choose this subject/job?",
      "Do you enjoy your work/studies?",
      "What are your future career plans?",
      "How has your work/study changed you as a person?"
    ]},
    { id: 3, topic: 'Hobbies', questions: [
      "What do you like to do in your free time?",
      "How long have you had this hobby?",
      "Do you think hobbies are important? Why?",
      "Would you like to try a new hobby in the future?",
      "How do hobbies benefit people?",
      "Has your hobby changed over time?"
    ]},
    { id: 4, topic: 'Technology', questions: [
      "How often do you use technology?",
      "What kinds of technology do you use daily?",
      "How has technology changed your life?",
      "Do you think technology makes life easier?",
      "What technology would you like to learn about?",
      "Can technology replace human interaction?"
    ]},
    { id: 5, topic: 'Travel', questions: [
      "Do you enjoy traveling?",
      "Where have you traveled recently?",
      "What do you like most about traveling?",
      "Would you like to travel more in the future?",
      "How does traveling benefit people?",
      "What's your dream travel destination?"
    ]}
  ],
  part2: [
    { id: 1, topic: 'A person you admire', prompt: `Describe a person you admire.\n\nYou should say:\n- who this person is\n- how you know this person\n- what this person does\n- and explain why you admire them\n\nYou have 1 minute to prepare. You should speak for 2 minutes.` },
    { id: 2, topic: 'A memorable journey', prompt: `Describe a memorable journey you have taken.\n\nYou should say:\n- where you went\n- who you went with\n- what you did there\n- and explain why it was memorable\n\nYou have 1 minute to prepare. You should speak for 2 minutes.` },
    { id: 3, topic: 'A useful skill', prompt: `Describe a useful skill you learned.\n\nYou should say:\n- what the skill is\n- when you learned it\n- how you learned it\n- and explain why it is useful\n\nYou have 1 minute to prepare. You should speak for 2 minutes.` }
  ],
  part3: [
    { id: 1, topic: 'Technology in Education', questions: [
      "How has technology changed education in your country?",
      "Do you think traditional teaching methods are still important?",
      "What are the advantages and disadvantages of online learning?",
      "How might education change in the future?",
      "Should all students have access to technology?",
      "Can technology replace teachers?"
    ]},
    { id: 2, topic: 'Environmental Issues', questions: [
      "What are the main environmental problems in your country?",
      "Do you think individuals can make a difference to environmental problems?",
      "What role should governments play in protecting the environment?",
      "How might climate change affect future generations?",
      "Are people more environmentally conscious now than in the past?",
      "What environmental issue concerns you most?"
    ]},
    { id: 3, topic: 'Social Media Impact', questions: [
      "How has social media changed society?",
      "What are the benefits and drawbacks of social media?",
      "Do you think social media brings people together or isolates them?",
      "How might social media evolve in the future?",
      "Should there be age restrictions on social media use?",
      "How can we use social media more responsibly?"
    ]}
  ]
}

const SpeakingPractice = () => {
  const [part, setPart] = useState(1)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [customTopic, setCustomTopic] = useState('')
  const [customQuestions, setCustomQuestions] = useState([''])
  const [showCustomTopicForm, setShowCustomTopicForm] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioURL, setAudioURL] = useState(null)
  const [transcript, setTranscript] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [sessions, setSessions] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [prepTime, setPrepTime] = useState(part === 2 ? 60 : 0)
  const [preparationMode, setPreparationMode] = useState(false)
  const [questionHistory, setQuestionHistory] = useState([])
  const [sessionResponses, setSessionResponses] = useState([]) // Store all responses for batch analysis
  const [overallProgress, setOverallProgress] = useState({ totalQuestions: 0, averageScore: 0 })
  const [showSummary, setShowSummary] = useState(false)
  const [isAnalyzingBatch, setIsAnalyzingBatch] = useState(false)
  const [modal, setModal] = useState({ show: false, type: 'info', message: '', onConfirm: null })
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)
  const recognitionRef = useRef(null)
  const synthRef = useRef(window.speechSynthesis)

  // Setup speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }
        
        setTranscript(prev => prev + finalTranscript)
      }
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  // Timer for recording and preparation
  useEffect(() => {
    if (preparationMode && prepTime > 0) {
      timerRef.current = setInterval(() => {
        setPrepTime(prev => {
          if (prev <= 1) {
            setPreparationMode(false)
            speakText("Preparation time is over. You may begin speaking now.")
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording, isPaused, preparationMode, prepTime])

  const showModal = (message, type = 'info', onConfirm = null) => {
    setModal({ show: true, type, message, onConfirm })
  }

  const closeModal = () => {
    setModal({ show: false, type: 'info', message: '', onConfirm: null })
  }

  const handleStopSession = () => {
    showModal('Are you sure you want to stop this practice session? Your progress will be lost.', 'confirm', () => {
      if (isRecording) {
        stopRecording()
      }
      finishTopic()
      closeModal()
    })
  }

  const speakText = (text, onEnd = null) => {
    if (synthRef.current.speaking) {
      synthRef.current.cancel()
    }
    
    const utterance = new SpeechSynthesisUtterance(text)
    const voices = synthRef.current.getVoices()
    
    // Try to find a good English voice
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en-') && (
        voice.name.includes('Enhanced') ||
        voice.name.includes('Premium') ||
        voice.name.includes('Google') ||
        voice.name.includes('Daniel') ||
        voice.name.includes('Samantha')
      )
    ) || voices.find(voice => voice.lang.startsWith('en-'))
    
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }
    
    utterance.rate = 0.9
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    utterance.onstart = () => setAiSpeaking(true)
    utterance.onend = () => {
      setAiSpeaking(false)
      if (onEnd) onEnd()
    }
    
    synthRef.current.speak(utterance)
  }

  const selectTopic = (topic) => {
    setSelectedTopic(topic)
    setCurrentQuestionIndex(0)
    setTranscript('')
    setFeedback(null)
    setQuestionHistory([])
    setSessionResponses([])
    setOverallProgress({ totalQuestions: 0, averageScore: 0 })
    setShowSummary(false)
    
    // AI introduces the topic and auto-starts recording
    if (part === 1) {
      speakText(`Let's talk about ${topic.topic}. I'll ask you several questions. ${topic.questions[0]}`, () => {
        setTimeout(() => startRecording(), 800)
      })
    } else if (part === 2) {
      speakText(`Now I'm going to give you a topic. You have one minute to prepare. ${topic.prompt.split('\n\n')[0]}`, () => {
        setPreparationMode(true)
        setPrepTime(60)
      })
    } else {
      speakText(`Let's discuss ${topic.topic}. I'll ask you multiple questions to explore this topic deeply. ${topic.questions[0]}`, () => {
        setTimeout(() => startRecording(), 800)
      })
    }
  }

  const createCustomTopic = () => {
    if (!customTopic.trim() || customQuestions.every(q => !q.trim())) {
      showModal('Please enter a topic name and at least one question', 'warning')
      return
    }

    const validQuestions = customQuestions.filter(q => q.trim())
    
    const newTopic = {
      id: 'custom',
      topic: customTopic,
      questions: validQuestions
    }

    setSelectedTopic(newTopic)
    setCurrentQuestionIndex(0)
    setTranscript('')
    setFeedback(null)
    setQuestionHistory([])
    setSessionResponses([])
    setOverallProgress({ totalQuestions: 0, averageScore: 0 })
    setShowCustomTopicForm(false)
    setShowSummary(false)
    
    speakText(`Let's practice with your custom topic: ${customTopic}. ${validQuestions[0]}`, () => {
      setTimeout(() => startRecording(), 800)
    })
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const url = URL.createObjectURL(audioBlob)
        setAudioURL(url)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)
      setTranscript('')
      
      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start()
      }
    } catch (error) {
      console.error('Error accessing microphone:', error)
      showModal('Unable to access microphone. Please check your browser permissions and try again.', 'error')
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        if (recognitionRef.current) recognitionRef.current.start()
      } else {
        mediaRecorderRef.current.pause()
        if (recognitionRef.current) recognitionRef.current.stop()
      }
      setIsPaused(!isPaused)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      
      // Stop speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      
      // Auto-save response and move to next
      setTimeout(() => saveResponseAndContinue(), 1000)
    }
  }

  const saveResponseAndContinue = () => {
    if (!transcript.trim()) {
      showModal('No speech detected. The recording will restart automatically.', 'warning')
      setTimeout(() => {
        closeModal()
        startRecording()
      }, 2000)
      return
    }
    
    // Save response for batch analysis later
    const response = {
      question: part === 2 ? selectedTopic?.topic : selectedTopic?.questions[currentQuestionIndex],
      questionIndex: currentQuestionIndex,
      transcript: transcript,
      duration_seconds: recordingTime,
      word_count: transcript.trim().split(/\s+/).length,
      timestamp: new Date().toISOString()
    }
    
    setSessionResponses(prev => [...prev, response])
    
    // Move to next question or finish
    if (part === 2 || currentQuestionIndex >= selectedTopic.questions.length - 1) {
      // Last question or Part 2 - finish and analyze
      analyzeBatchResponses([...sessionResponses, response])
    } else {
      // Move to next question
      const nextIndex = currentQuestionIndex + 1
      setCurrentQuestionIndex(nextIndex)
      setTranscript('')
      setAudioURL(null)
      setRecordingTime(0)
      
      speakText(selectedTopic.questions[nextIndex], () => {
        setTimeout(() => startRecording(), 800)
      })
    }
  }

  const analyzeBatchResponses = async (responses) => {
    setIsAnalyzingBatch(true)
    
    // First announcement
    speakText("Excellent! You've completed all questions. Let me analyze your responses. This will take a moment.", async () => {
      // Start analysis after first message finishes
      try {
        const token = localStorage.getItem('token')
        
        if (!token) {
          throw new Error('Please log in to analyze your speaking responses')
        }
        
        // Analyze each response in parallel
        const analysisPromises = responses.map(response =>
          fetch('http://localhost:8000/api/v1/speaking/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              part_number: part,
              topic: selectedTopic?.topic || 'General',
              prompt_text: response.question,
              transcription: response.transcript,
              duration_seconds: response.duration_seconds,
              word_count: response.word_count
            })
          }).then(async res => {
            if (!res.ok) {
              console.error(`Analysis failed for question: ${response.question}`, res.status)
              return { success: false, error: res.status }
            }
            return res.json()
          }).catch(err => {
            console.error('Network error:', err)
            return { success: false, error: 'network' }
          })
        )
        
        const results = await Promise.all(analysisPromises)
        
        // Build question history with feedback, filter out failed responses
        const history = responses.map((response, index) => ({
          ...response,
          score: results[index]?.feedback?.overall_score || 0,
          feedback: results[index]?.feedback || {
            overall_score: 0,
            fluency_coherence: 0,
            lexical_resource: 0,
            grammatical_range: 0,
            pronunciation: 0,
            strengths: ['Analysis not available'],
            weaknesses: ['Please try again'],
            suggestions: ['Check your connection and retry']
          },
          failed: !results[index]?.success
        }))
        
        setQuestionHistory(history)
        
        // Calculate overall statistics
        const totalScore = history.reduce((sum, item) => sum + item.score, 0)
        const avgScore = totalScore / history.length
        
        setOverallProgress({
          totalQuestions: history.length,
          averageScore: avgScore
        })
        
        // Show summary
        setShowSummary(true)
        
        // Provide overall feedback - this plays AFTER first message
        let finalFeedback = ''
        if (avgScore >= 7.5) {
          finalFeedback = `Outstanding performance! Your average band score is ${avgScore.toFixed(1)}. You're demonstrating advanced proficiency across all questions.`
        } else if (avgScore >= 6.5) {
          finalFeedback = `Good work! Your average band score is ${avgScore.toFixed(1)}. You're showing solid competence with room for improvement.`
        } else {
          finalFeedback = `Your average band score is ${avgScore.toFixed(1)}. Keep practicing regularly to improve your fluency and accuracy.`
        }
        
        speakText(finalFeedback)
        
      } catch (error) {
        console.error('Error analyzing responses:', error)
        showModal('Failed to analyze your responses. Please check your connection and try again.', 'error')
      } finally {
        setIsAnalyzingBatch(false)
      }
    })
  }

  const finishTopic = () => {
    setSelectedTopic(null)
    setCurrentQuestionIndex(0)
    setTranscript('')
    setFeedback(null)
    setQuestionHistory([])
    setSessionResponses([])
    setOverallProgress({ totalQuestions: 0, averageScore: 0 })
    setShowSummary(false)
  }

  const resetTopic = () => {
    setCurrentQuestionIndex(0)
    setTranscript('')
    setFeedback(null)
    setSessionResponses([])
    setShowSummary(false)
    
    // Restart the same topic
    if (selectedTopic) {
      selectTopic(selectedTopic)
    }
  }

  const getBandColor = (score) => {
    if (score >= 8) return '#10b981'
    if (score >= 7) return '#3b82f6'
    if (score >= 6) return '#f59e0b'
    if (score >= 5) return '#ef4444'
    return '#991b1b'
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🎤 IELTS Speaking Practice</h1>
        <p>Practice with AI examiner - Real voice interaction</p>
      </div>

      {/* Part Selector */}
      <div className={styles.partSelector}>
        <button
          className={`${styles.partButton} ${part === 1 ? styles.active : ''}`}
          onClick={() => { setPart(1); setSelectedTopic(null); setFeedback(null) }}
          disabled={isRecording || aiSpeaking}
        >
          Part 1<br /><span className={styles.partDesc}>4-5 min • Introduction</span>
        </button>
        <button
          className={`${styles.partButton} ${part === 2 ? styles.active : ''}`}
          onClick={() => { setPart(2); setSelectedTopic(null); setFeedback(null) }}
          disabled={isRecording || aiSpeaking}
        >
          Part 2<br /><span className={styles.partDesc}>3-4 min • Long Turn</span>
        </button>
        <button
          className={`${styles.partButton} ${part === 3 ? styles.active : ''}`}
          onClick={() => { setPart(3); setSelectedTopic(null); setFeedback(null) }}
          disabled={isRecording || aiSpeaking}
        >
          Part 3<br /><span className={styles.partDesc}>4-5 min • Discussion</span>
        </button>
      </div>

      {/* Topic Selection */}
      {!selectedTopic && !showCustomTopicForm && (
        <div className={styles.topicGrid}>
          <h2>Select a Topic</h2>
          <div className={styles.topics}>
            {IELTS_TOPICS[`part${part}`].map(topic => (
              <div
                key={topic.id}
                className={styles.topicCard}
                onClick={() => selectTopic(topic)}
              >
                <h3>{topic.topic}</h3>
                {part !== 2 && (
                  <p className={styles.questionCount}>📝 {topic.questions.length} questions</p>
                )}
              </div>
            ))}
            <div
              className={`${styles.topicCard} ${styles.customTopicCard}`}
              onClick={() => setShowCustomTopicForm(true)}
            >
              <h3>✨ Create Custom Topic</h3>
              <p>Design your own practice session</p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Topic Form */}
      {showCustomTopicForm && (
        <div className={styles.customTopicForm}>
          <h2>Create Your Custom Topic</h2>
          <div className={styles.formGroup}>
            <label>Topic Name</label>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="e.g., My Favorite Sport, Future Career Plans..."
              className={styles.topicInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Questions (at least 3 recommended)</label>
            {customQuestions.map((q, index) => (
              <div key={index} className={styles.questionInput}>
                <input
                  type="text"
                  value={q}
                  onChange={(e) => {
                    const newQuestions = [...customQuestions]
                    newQuestions[index] = e.target.value
                    setCustomQuestions(newQuestions)
                  }}
                  placeholder={`Question ${index + 1}`}
                />
                {customQuestions.length > 1 && (
                  <button
                    onClick={() => setCustomQuestions(customQuestions.filter((_, i) => i !== index))}
                    className={styles.removeButton}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setCustomQuestions([...customQuestions, ''])}
              className={styles.addQuestionButton}
            >
              + Add Question
            </button>
          </div>
          <div className={styles.formActions}>
            <button onClick={() => setShowCustomTopicForm(false)} className={styles.cancelButton}>
              Cancel
            </button>
            <button onClick={createCustomTopic} className={styles.createButton}>
              Start Practice
            </button>
          </div>
        </div>
      )}

      {/* Practice Session */}
      {selectedTopic && !showSummary && (
        <div className={styles.practiceArea}>
          {/* Stop Session Button */}
          <button onClick={handleStopSession} className={styles.stopSessionButton} title="Stop Practice">
            ✕ Stop Session
          </button>
          
          {/* Progress Tracker */}
          <div className={styles.progressTracker}>
            <div className={styles.progressInfo}>
              <span className={styles.questionProgress}>
                Question {currentQuestionIndex + 1} of {selectedTopic.questions?.length || 1}
              </span>
              {questionHistory.length > 0 && (
                <span className={styles.averageScore}>
                  Avg Score: <strong>{overallProgress.averageScore.toFixed(1)}</strong>
                </span>
              )}
            </div>
            {part !== 2 && selectedTopic.questions && (
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${((currentQuestionIndex + 1) / selectedTopic.questions.length) * 100}%` }}
                />
              </div>
            )}
          </div>
          {/* AI Status */}
          {aiSpeaking && (
            <div className={styles.aiStatus}>
              <div className={styles.aiAvatar}>🤖</div>
              <p>AI Examiner is speaking...</p>
            </div>
          )}

          {/* Preparation Timer (Part 2) */}
          {preparationMode && (
            <div className={styles.preparationTimer}>
              <h3>Preparation Time</h3>
              <div className={styles.bigTimer}>{formatTime(prepTime)}</div>
              <p>Take notes and prepare your answer</p>
            </div>
          )}

          {/* Question Display */}
          <div className={styles.questionArea}>
            <h3>{part === 2 ? selectedTopic.topic : `Question ${currentQuestionIndex + 1}`}</h3>
            {part === 2 ? (
              <div className={styles.promptCard}>
                {selectedTopic.prompt.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            ) : (
              <p className={styles.question}>{selectedTopic.questions[currentQuestionIndex]}</p>
            )}
          </div>

          {/* Recording Controls */}
          <div className={styles.recordingControls}>
            {/* Waiting for AI */}
            {!isRecording && !transcript && aiSpeaking && (
              <div className={styles.waitingMessage}>
                <p>🤖 AI is speaking... Recording will start automatically</p>
              </div>
            )}

            {/* Waiting to start */}
            {!isRecording && !transcript && !aiSpeaking && !preparationMode && (
              <div className={styles.waitingMessage}>
                <p>⏳ Preparing to record...</p>
              </div>
            )}
            
            {/* Active Recording */}
            {isRecording && (
              <>
                <div className={styles.recordingIndicator}>
                  <span className={styles.redDot}></span>
                  Recording: {formatTime(recordingTime)}
                </div>
                <div className={styles.recordingActions}>
                  <button onClick={pauseRecording} className={styles.pauseButton}>
                    {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                  </button>
                  <button onClick={stopRecording} className={styles.stopButton}>
                    ⏹️ Stop & Continue
                  </button>
                </div>
              </>
            )}
            
            {/* Response Saved - Moving to Next */}
            {transcript && !isRecording && !isAnalyzingBatch && (
              <div className={styles.savedResponse}>
                <div className={styles.checkmark}>✓</div>
                <h3>Response Saved</h3>
                <p className={styles.nextInfo}>Moving to next question...</p>
              </div>
            )}

            {/* Batch Analysis in Progress */}
            {isAnalyzingBatch && (
              <div className={styles.analyzingBatch}>
                <div className={styles.spinner}></div>
                <h3>Analyzing All Your Responses...</h3>
                <p>Evaluating {sessionResponses.length} answers</p>
                <p className={styles.pleaseWait}>This will take a moment. Please wait.</p>
              </div>
            )}
          </div>

          {/* Live Transcript */}
          {transcript && (
            <div className={styles.transcriptArea}>
              <h4>📝 Your Speech (Auto-transcribed)</h4>
              <div className={styles.transcript}>{transcript}</div>
              <div className={styles.wordCount}>
                {transcript.trim().split(/\s+/).length} words • {formatTime(recordingTime)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary View */}
      {showSummary && (
        <div className={styles.summarySection}>
          <h2>📊 Topic Summary: {selectedTopic?.topic}</h2>
          
          <div className={styles.overallStats}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{questionHistory.length}</div>
              <div className={styles.statLabel}>Questions Completed</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue} style={{ color: getBandColor(overallProgress.averageScore) }}>
                {overallProgress.averageScore.toFixed(1)}
              </div>
              <div className={styles.statLabel}>Average Band Score</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {overallProgress.averageScore >= 7.5 ? '🌟' : overallProgress.averageScore >= 6.5 ? '👍' : '💪'}
              </div>
              <div className={styles.statLabel}>
                {overallProgress.averageScore >= 7.5 ? 'Advanced' : overallProgress.averageScore >= 6.5 ? 'Intermediate' : 'Developing'}
              </div>
            </div>
          </div>

          <div className={styles.questionHistoryList}>
            <h3>Question-by-Question Breakdown</h3>
            {questionHistory.map((item, index) => (
              <div key={index} className={styles.historyItem}>
                <div className={styles.historyHeader}>
                  <span className={styles.historyNumber}>Q{item.questionIndex + 1}</span>
                  <span className={styles.historyScore} style={{ color: getBandColor(item.score) }}>
                    {item.score.toFixed(1)}
                  </span>
                </div>
                <p className={styles.historyQuestion}>{item.question}</p>
                <div className={styles.historyTranscript}>
                  <strong>Your Answer:</strong> {item.transcript.substring(0, 150)}...
                </div>
                <div className={styles.historyFeedback}>
                  <div className={styles.feedbackBrief}>
                    <span>✅ {item.feedback?.strengths?.[0] || 'Good effort'}</span>
                    <span>💡 {item.feedback?.suggestions?.[0] || 'Keep practicing'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.summaryActions}>
            <button onClick={finishTopic} className={styles.newTopicButton}>
              Practice New Topic
            </button>
            <button onClick={resetTopic} className={styles.reviewButton}>
              Restart This Topic
            </button>
          </div>
        </div>
      )}

      {/* Custom Modal */}
      {modal.show && (
        <div className={styles.modalOverlay} onClick={modal.type !== 'confirm' ? closeModal : undefined}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={`${styles.modalIcon} ${styles[modal.type]}`}>
              {modal.type === 'error' && '⚠️'}
              {modal.type === 'warning' && '⚡'}
              {modal.type === 'confirm' && '❓'}
              {modal.type === 'info' && 'ℹ️'}
            </div>
            <p className={styles.modalMessage}>{modal.message}</p>
            <div className={styles.modalActions}>
              {modal.type === 'confirm' ? (
                <>
                  <button onClick={closeModal} className={styles.modalCancel}>Cancel</button>
                  <button onClick={modal.onConfirm} className={styles.modalConfirm}>Confirm</button>
                </>
              ) : (
                <button onClick={closeModal} className={styles.modalOk}>OK</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SpeakingPractice
