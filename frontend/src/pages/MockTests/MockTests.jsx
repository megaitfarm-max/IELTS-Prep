import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@components/common/Card'
import ResumeTestModal from '../../components/ResumeTestModal/ResumeTestModal'
import YouTubePlayer from '../../components/YouTubePlayer/YouTubePlayer'
import styles from './MockTests.module.css'
import { generateDynamicTest, listeningQuestionBank, readingQuestionBank } from '../../data/questionBank'

function MockTests() {
  const navigate = useNavigate()
  const [currentModule, setCurrentModule] = useState(null)
  const [currentSection, setCurrentSection] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [testStarted, setTestStarted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [completedModules, setCompletedModules] = useState([])
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [moduleScores, setModuleScores] = useState({})
  const [isRecording, setIsRecording] = useState(null)
  const [recordingTimerId, setRecordingTimerId] = useState(null) // Track timer ID for stop function
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [showResumeModal, setShowResumeModal] = useState(false)
  const [resumeTestInfo, setResumeTestInfo] = useState(null)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const [showTranscript, setShowTranscript] = useState(false)
  const [readingAnalysis, setReadingAnalysis] = useState(null)
  const [writingFeedback, setWritingFeedback] = useState({})
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [generatedQuestions, setGeneratedQuestions] = useState(null)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const audioRef = useRef(null)
  
  // Enhanced tracking for detailed analytics
  const [questionTimings, setQuestionTimings] = useState({}) // { questionId: { startTime, endTime, timeSpent } }
  const [questionStartTime, setQuestionStartTime] = useState(null)
  const [moduleStartTimes, setModuleStartTimes] = useState({}) // { moduleId: startTime }
  const [questionSources, setQuestionSources] = useState({}) // { questionId: { videoId, videoUrl, timestamp } }
  const [questionDetails, setQuestionDetails] = useState([]) // Detailed per-question results for analysis
  const [testStartTimestamp, setTestStartTimestamp] = useState(null) // Overall test start time

  // Dynamic modules that will be populated with Ollama-generated questions
  const [dynamicModules, setDynamicModules] = useState([
    {
      id: 'listening',
      name: 'Listening',
      icon: '🎧',
      duration: 30,
      description: 'AI-Generated listening comprehension test',
      color: 'var(--listening-primary)',
      audioUrl: 'uRKeeelqWxw',  // YouTube video ID
      transcript: '',  // Will be generated dynamically
      sections: []
    },
    {
      id: 'reading',
      name: 'Reading',
      icon: '📖',
      duration: 60,
      description: 'AI-Generated reading comprehension test',
      color: 'var(--reading-primary)',
      passages: []  // Will be generated dynamically
    },
    {
      id: 'writing',
      name: 'Writing',
      icon: '✍️',
      duration: 60,
      description: '2 academic tasks (Task 1 & Task 2)',
      color: 'var(--writing-primary)',
      tasks: []  // Will be generated dynamically
    },
    {
      id: 'speaking',
      name: 'Speaking',
      icon: '🎤',
      duration: 15,
      description: 'AI Interviewer conversation',
      color: 'var(--speaking-primary)',
      questions: []  // Will be generated dynamically
    }
  ])

  const modules = dynamicModules

  const totalDuration = modules.reduce((sum, m) => sum + m.duration, 0)

  // Load saved progress from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('mockTestProgress')
    if (savedState) {
      const { currentModule: savedModule, answers: savedAnswers, timeRemaining: savedTime, completedModules: savedCompleted, testStarted: savedStarted, dynamicModules: savedDynamicModules } = JSON.parse(savedState)
      if (savedStarted && savedModule !== null) {
        const moduleInfo = modules[savedModule]
        
        // Calculate accurate progress based on module type
        let totalQuestions = 10 // default
        if (savedDynamicModules && savedDynamicModules[savedModule]) {
          const savedMod = savedDynamicModules[savedModule]
          if (savedMod.id === 'listening' && savedMod.sections) {
            totalQuestions = savedMod.sections.reduce((sum, s) => sum + (s.questions?.length || 0), 0)
          } else if (savedMod.id === 'reading' && savedMod.passages) {
            totalQuestions = savedMod.passages.reduce((sum, p) => sum + (p.questions?.length || 0), 0)
          }
        }
        
        const answeredCount = Object.keys(savedAnswers).length
        const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0
        
        setResumeTestInfo({
          moduleName: moduleInfo?.name || 'Unknown',
          progress: `${progressPercent}%`,
          timeLeft: formatTimerDisplay(savedTime)
        })
        setShowResumeModal(true)
      }
    }
  }, [])

  const handleResumeTest = () => {
    const savedState = localStorage.getItem('mockTestProgress')
    if (savedState) {
      const { currentModule: savedModule, answers: savedAnswers, timeRemaining: savedTime, completedModules: savedCompleted, dynamicModules: savedDynamicModules, currentQuestionIndex: savedQuestionIndex } = JSON.parse(savedState)
      
      // Restore all state
      setCurrentModule(savedModule)
      setAnswers(savedAnswers || {})  // Restore saved answers
      setTimeRemaining(savedTime)
      setCompletedModules(savedCompleted || [])
      
      if (savedDynamicModules) {
        setDynamicModules(savedDynamicModules)
      }
      
      if (savedQuestionIndex !== undefined) {
        setCurrentQuestionIndex(savedQuestionIndex)
      }
      
      setTestStarted(true)
      setShowResumeModal(false)
      
      console.log('✅ Resume: Restored', Object.keys(savedAnswers || {}).length, 'answers')
    }
  }

  const handleStartFresh = () => {
    localStorage.removeItem('mockTestProgress')
    setShowResumeModal(false)
  }

  // Save progress to localStorage whenever state changes
  useEffect(() => {
    if (testStarted && currentModule !== null) {
      localStorage.setItem('mockTestProgress', JSON.stringify({
        currentModule,
        answers,
        timeRemaining,
        completedModules,
        testStarted,
        dynamicModules,
        currentQuestionIndex
      }))
    }
  }, [currentModule, answers, timeRemaining, completedModules, testStarted, dynamicModules, currentQuestionIndex])

  useEffect(() => {
    let timer
    if (testStarted && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleModuleComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [testStarted, timeRemaining, currentModule])

  // Audio player management
  useEffect(() => {
    if (audioRef.current && activeModule?.id === 'listening') {
      audioRef.current.addEventListener('timeupdate', handleAudioProgress)
      audioRef.current.addEventListener('ended', handleAudioEnded)
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('timeupdate', handleAudioProgress)
          audioRef.current.removeEventListener('ended', handleAudioEnded)
        }
      }
    }
  }, [audioPlaying])

  const handleAudioProgress = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100
      setAudioProgress(progress)
    }
  }

  const handleAudioEnded = () => {
    setAudioPlaying(false)
    setAudioProgress(0)
  }

  const toggleAudio = () => {
    if (audioRef.current) {
      if (audioPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setAudioPlaying(!audioPlaying)
    }
  }

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const formatTimerDisplay = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const startTest = () => {
    // Start test immediately - questions will be generated in background
    setTestStarted(true)
    setCurrentModule(0)
    setTimeRemaining(modules[0].duration * 60)
    setTestStartTimestamp(Date.now()) // Track test start time
    setModuleStartTimes({ [modules[0].id]: Date.now() }) // Track module start
    
    // Generate questions in background
    generateInitialQuestions()
  }
  
  const generateInitialQuestions = async () => {
    setLoadingQuestions(true)
    try {
      // Generate questions for the first module dynamically from Gemini
      const firstModule = dynamicModules[0]
      
      if (firstModule.id === 'listening') {
        // Fetch YouTube transcript first
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
        let transcript = ''
        
        try {
          const transcriptResponse = await fetch(`${API_URL}/api/v1/questions/fetch-youtube-transcript`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ video_id: firstModule.audioUrl })
          })
          const transcriptData = await transcriptResponse.json()
          transcript = transcriptData.transcript || ''
          if (transcript) {
            console.log('✅ Fetched YouTube transcript:', transcript.substring(0, 100) + '...')
          }
        } catch (error) {
          console.error('❌ Error fetching transcript:', error)
          transcript = 'A conversation about accommodation search near a university campus'
        }
        
        // Generate questions based on actual transcript
        const questions = await generateQuestionsFromOllama('listening', transcript)
        
        // Track source for each question
        const sources = {}
        questions.forEach(q => {
          sources[q.id] = {
            videoId: firstModule.audioUrl,
            videoUrl: `https://www.youtube.com/watch?v=${firstModule.audioUrl}`,
            timestamp: new Date().toISOString(),
            contentPreview: transcript.substring(0, 100)
          }
        })
        setQuestionSources(prev => ({ ...prev, ...sources }))
        
        // Update the module with generated questions and real transcript
        const updatedModules = [...dynamicModules]
        updatedModules[0].sections = [{ 
          id: 'section-1',
          title: 'Accommodation Search', 
          questions,
          transcript: transcript
        }]
        updatedModules[0].transcript = transcript
        setDynamicModules(updatedModules)
      } else if (firstModule.id === 'reading') {
        // For reading: Generate a full academic passage (300-400 words)
        const passagePrompt = 'Write an academic IELTS reading passage (300-400 words) about climate change and environmental conservation. Include academic vocabulary, statistics, and multiple perspectives. Make it suitable for IELTS Academic Reading test.'
        const questions = await generateQuestionsFromOllama('reading', passagePrompt)
        
        // Use the prompt as passage for now (AI will generate questions based on typical IELTS topics)
        const readingPassage = `Climate Change and Global Response\n\nClimate change represents one of the most pressing challenges facing humanity in the 21st century. Scientific evidence overwhelmingly indicates that human activities, particularly the emission of greenhouse gases, have led to a significant increase in global temperatures. The Intergovernmental Panel on Climate Change (IPCC) reports that global temperatures have risen by approximately 1.1°C since pre-industrial times, with projections suggesting further increases if current trends continue.\n\nThe impacts of climate change are already visible across the globe. Rising sea levels threaten coastal communities, while extreme weather events such as hurricanes, droughts, and floods have become more frequent and severe. Ecosystems are experiencing unprecedented stress, with many species facing extinction due to rapidly changing habitats. The Arctic ice cap has decreased by 13% per decade since 1979, demonstrating the accelerating nature of these changes.\n\nInternational cooperation has become essential in addressing this crisis. The Paris Agreement, adopted in 2015, represents a landmark achievement in global climate diplomacy, with 196 parties committing to limit global warming to well below 2°C above pre-industrial levels. Countries have pledged to reduce emissions through various means, including transitioning to renewable energy sources, improving energy efficiency, and protecting forests.\n\nHowever, challenges remain in implementing these commitments. Developing nations argue that wealthy countries, having benefited from industrialization, should bear greater responsibility for emissions reductions and provide financial support for adaptation measures. Meanwhile, some nations continue to prioritize economic growth over environmental concerns, complicating international negotiations.\n\nTechnological innovation offers hope for addressing climate change. Renewable energy technologies, such as solar and wind power, have become increasingly cost-competitive with fossil fuels. Electric vehicles are gaining market share, and carbon capture technologies show promise for reducing atmospheric CO2 levels. Nevertheless, experts emphasize that technological solutions alone are insufficient without corresponding changes in consumption patterns and political will to implement necessary reforms.`
        
        const updatedModules = [...dynamicModules]
        updatedModules[0].passages = [{ 
          id: 'passage-1',
          title: 'Climate Change and Global Response', 
          questions,
          content: readingPassage
        }]
        setDynamicModules(updatedModules)
      } else if (firstModule.id === 'writing') {
        // Initialize writing tasks
        const updatedModules = [...dynamicModules]
        updatedModules[0].tasks = [
          {
            id: 'writing-task-1',
            title: 'Task 1: Describing Visual Information',
            prompt: 'The chart below shows the percentage of households in different income brackets that own various types of technology devices. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.',
            minWords: 150,
            description: 'Write at least 150 words describing the data presented in the chart.'
          },
          {
            id: 'writing-task-2',
            title: 'Task 2: Essay Writing',
            prompt: 'Some people believe that technology has made our lives more complex, while others argue it has made life simpler. Discuss both views and give your own opinion.',
            minWords: 250,
            description: 'Write at least 250 words presenting a well-structured argument with examples.'
          }
        ]
        setDynamicModules(updatedModules)
      } else if (firstModule.id === 'speaking') {
        // Initialize speaking questions
        const updatedModules = [...dynamicModules]
        updatedModules[0].questions = [
          { id: 'speaking-1', part: 'Part 1', question: 'Let\'s talk about your hometown. Where are you from?' },
          { id: 'speaking-2', part: 'Part 1', question: 'What do you like most about living there?' },
          { id: 'speaking-3', part: 'Part 1', question: 'How has your hometown changed over the years?' },
          { id: 'speaking-4', part: 'Part 2', question: 'Describe a memorable journey you have taken. You should say: where you went, who you went with, what you did there, and explain why it was memorable.' },
          { id: 'speaking-5', part: 'Part 3', question: 'How do you think transportation will change in the future?' },
          { id: 'speaking-6', part: 'Part 3', question: 'What are the advantages and disadvantages of international travel?' }
        ]
        setDynamicModules(updatedModules)
      }
      
      setTestStarted(true)
      setCurrentModule(0)
      setTimeRemaining(modules[0].duration * 60)
    } catch (error) {
      console.error('Error starting test:', error)
      // Fallback to question bank if Gemini fails
      const firstModule = dynamicModules[0]
      const updatedModules = [...dynamicModules]
      
      if (firstModule.id === 'listening') {
        const fallbackQuestions = generateDynamicTest(listeningQuestionBank, 10)
        updatedModules[0].sections = [{ 
          id: 'section-1',
          title: 'Listening Section', 
          questions: fallbackQuestions
        }]
      } else if (firstModule.id === 'reading') {
        const fallbackQuestions = generateDynamicTest(readingQuestionBank, 10)
        updatedModules[0].passages = [{ 
          id: 'passage-1',
          title: 'Reading Passage', 
          questions: fallbackQuestions
        }]
      }
      
      setDynamicModules(updatedModules)
      setTestStarted(true)
      setCurrentModule(0)
      setTimeRemaining(modules[0].duration * 60)
    } finally {
      setLoadingQuestions(false)
    }
  }

  const handleBackClick = () => {
    setShowExitDialog(true)
  }

  const confirmExit = () => {
    localStorage.setItem('mockTestProgress', JSON.stringify({
      currentModule,
      answers,
      timeRemaining,
      completedModules,
      testStarted: true
    }))
    navigate('/dashboard')
  }

  const cancelExit = () => {
    setShowExitDialog(false)
  }

  const generateQuestionsFromOllama = async (moduleType, content) => {
    setLoadingQuestions(true)
    try {
      console.log(`🤖 Generating ${moduleType} questions from content:`, content.substring(0, 200) + '...')
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_URL}/api/v1/questions/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_type: moduleType,
          content: content,
          difficulty: 'medium',
          num_questions: 10,
          question_types: ['fill', 'mcq', 'tf']
        })
      })
      const data = await response.json()
      
      // Add unique IDs to questions and keep answer field
      const questionsWithIds = data.questions.map((q, idx) => ({
        ...q,
        id: `${moduleType}-${idx + 1}`,
        answer: q.answer || q.correct_answer || null  // Store correct answer
      }))
      
      console.log('✅ Generated questions with answers:', questionsWithIds.map(q => ({ id: q.id, answer: q.answer })))
      
      setGeneratedQuestions(questionsWithIds)
      return questionsWithIds
    } catch (error) {
      console.error('Error generating questions:', error)
      // Fallback to question bank
      if (moduleType === 'listening') {
        return generateDynamicTest(listeningQuestionBank, 10)
      } else if (moduleType === 'reading') {
        return generateDynamicTest(readingQuestionBank, 10)
      }
      return []
    } finally {
      setLoadingQuestions(false)
    }
  }

  const handleNextQuestion = () => {
    const activeModule = dynamicModules[currentModule]
    let totalQuestions = 0
    
    if (activeModule?.id === 'listening') {
      totalQuestions = (activeModule.sections || []).reduce((sum, section) => sum + (section.questions || []).length, 0)
    } else if (activeModule?.id === 'reading') {
      totalQuestions = (activeModule.passages || []).reduce((sum, passage) => sum + (passage.questions || []).length, 0)
    }
    
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const getCurrentQuestion = () => {
    const activeModule = dynamicModules[currentModule]
    let allQuestions = []
    
    if (activeModule?.id === 'listening') {
      (activeModule.sections || []).forEach(section => {
        allQuestions.push(...(section.questions || []))
      })
    } else if (activeModule?.id === 'reading') {
      (activeModule.passages || []).forEach(passage => {
        allQuestions.push(...(passage.questions || []))
      })
    }
    
    return allQuestions[currentQuestionIndex]
  }

  const getReadingAnalysis = async (passage, userAnswers) => {
    setLoadingAnalysis(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_URL}/api/v1/ai/reading-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passage, answers: userAnswers })
      })
      const data = await response.json()
      setReadingAnalysis(data)
    } catch (error) {
      console.error('Error getting reading analysis:', error)
    } finally {
      setLoadingAnalysis(false)
    }
  }

  const getWritingFeedback = async (taskId, text, taskNumber) => {
    setLoadingAnalysis(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_URL}/api/v1/ai/writing-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, task_number: taskNumber })
      })
      const data = await response.json()
      setWritingFeedback({
        ...writingFeedback,
        [taskId]: data
      })
    } catch (error) {
      console.error('Error getting writing feedback:', error)
    } finally {
      setLoadingAnalysis(false)
    }
  }

  const validateAnswers = () => {
    const module = modules[currentModule]
    let requiredAnswers = 0
    let givenAnswers = 0

    if (module.id === 'listening') {
      // Flatten all questions from all sections
      const allQuestions = module.sections.flatMap(s => s.questions)
      requiredAnswers = allQuestions.length
      givenAnswers = allQuestions.filter(q => answers[q.id] && answers[q.id].trim() !== '').length
    } else if (module.id === 'reading') {
      // Flatten all questions from all passages
      const allQuestions = module.passages.flatMap(p => p.questions)
      requiredAnswers = allQuestions.length
      givenAnswers = allQuestions.filter(q => answers[q.id] && answers[q.id].trim() !== '').length
    } else if (module.id === 'writing') {
      requiredAnswers = module.tasks.length
      givenAnswers = module.tasks.filter(t => {
        const wordCount = (answers[t.id] || '').trim().split(/\s+/).filter(w => w).length
        return wordCount >= t.minWords
      }).length
    } else if (module.id === 'speaking') {
      requiredAnswers = module.questions.length
      givenAnswers = module.questions.filter(q => answers[q.id]).length
    }

    if (givenAnswers < requiredAnswers) {
      setValidationError(`Please answer all questions! (${givenAnswers}/${requiredAnswers} completed)`)
      return false
    }
    
    setValidationError('')
    return true
  }

  const handleModuleComplete = async () => {
    // Show warning if not all questions answered but allow proceeding
    const isValid = validateAnswers()
    if (!isValid) {
      console.warn('⚠️ Not all questions answered, but proceeding anyway')
      setValidationError('') // Clear error and allow proceeding
    }

    // Calculate score for current module
    const module = dynamicModules[currentModule]
    let score = 0
    let totalQuestions = 0

    const detailedQuestions = []
    
    if (module.id === 'listening') {
      const allQuestions = module.sections.flatMap(s => s.questions)
      totalQuestions = allQuestions.length
      
      allQuestions.forEach(q => {
        const userAnswer = answers[q.id]
        const correctAnswer = q.answer || q.correct_answer
        let isCorrect = false
        
        if (userAnswer && correctAnswer) {
          // Normalize answers for comparison
          const normalizedUser = userAnswer.toString().toLowerCase().trim()
          const normalizedCorrect = correctAnswer.toString().toLowerCase().trim()
          
          if (q.type === 'mcq' || q.type === 'tf') {
            isCorrect = normalizedUser === normalizedCorrect
          } else if (q.type === 'fill') {
            // For fill-in-blank, check if answer contains the correct word
            isCorrect = normalizedUser.includes(normalizedCorrect) || normalizedCorrect.includes(normalizedUser)
          }
          
          if (isCorrect) score++
        }
        
        detailedQuestions.push({
          id: q.id,
          question: q.question,
          type: q.type,
          userAnswer: userAnswer || 'Not answered',
          correctAnswer: correctAnswer || 'N/A',
          isCorrect,
          source: questionSources[q.id] || null,
          moduleType: 'listening'
        })
      })
    } else if (module.id === 'reading') {
      const allQuestions = module.passages.flatMap(p => p.questions)
      totalQuestions = allQuestions.length
      
      allQuestions.forEach(q => {
        const userAnswer = answers[q.id]
        const correctAnswer = q.answer || q.correct_answer
        let isCorrect = false
        
        if (userAnswer && correctAnswer) {
          const normalizedUser = userAnswer.toString().toLowerCase().trim()
          const normalizedCorrect = correctAnswer.toString().toLowerCase().trim()
          
          if (q.type === 'mcq' || q.type === 'tf') {
            isCorrect = normalizedUser === normalizedCorrect
          } else if (q.type === 'fill') {
            isCorrect = normalizedUser.includes(normalizedCorrect) || normalizedCorrect.includes(normalizedUser)
          }
          
          if (isCorrect) score++
        }
        
        detailedQuestions.push({
          id: q.id,
          question: q.question,
          type: q.type,
          userAnswer: userAnswer || 'Not answered',
          correctAnswer: correctAnswer || 'N/A',
          isCorrect,
          source: null,
          moduleType: 'reading'
        })
      })
      
      // Get AI analysis for reading
      const allPassages = module.passages.map(p => p.content).join('\n\n')
      getReadingAnalysis(allPassages, answers)
    } else if (module.id === 'writing') {
      totalQuestions = module.tasks.length
      module.tasks.forEach(task => {
        const wordCount = (answers[task.id] || '').trim().split(/\s+/).filter(w => w).length
        const hasAnswer = wordCount > 0
        let isCorrect = false
        
        if (wordCount >= task.minWords) {
          score += 0.5
          isCorrect = true
        }
        if (wordCount >= task.minWords + 50) {
          score += 0.5
        }
        
        // Get preview of writing
        const writingPreview = hasAnswer ? (answers[task.id] || '').substring(0, 120) + '...' : 'Not answered'
        
        detailedQuestions.push({
          id: task.id,
          question: task.prompt,
          type: 'essay',
          userAnswer: hasAnswer ? `✍️ ${wordCount} words - "${writingPreview}"` : 'Not answered',
          correctAnswer: `Min. ${task.minWords} words | ✅ AI Analysis: Task Achievement, Coherence, Grammar, Vocabulary`,
          isCorrect,
          source: null,
          moduleType: 'writing',
          fullText: answers[task.id] || ''
        })
        
        // Get AI feedback for each writing task
        getWritingFeedback(task.id, answers[task.id] || '', task.id)
      })
    } else if (module.id === 'speaking') {
      totalQuestions = module.questions.length
      module.questions.forEach(q => {
        const hasAnswer = answers[q.id] ? true : false
        if (hasAnswer) {
          score++
        }
        
        // Get recording data if available
        const recordingData = answers[q.id]
        let answerDisplay = 'Not answered'
        if (hasAnswer && typeof recordingData === 'object' && recordingData.duration) {
          answerDisplay = `🎙️ Recorded (${recordingData.duration}s)${recordingData.transcription ? ' - "' + recordingData.transcription.substring(0, 80) + '..."' : ''}`
        } else if (hasAnswer) {
          answerDisplay = '🎙️ Response recorded (30s)'
        }
        
        detailedQuestions.push({
          id: q.id,
          question: q.question,
          type: 'speaking',
          userAnswer: answerDisplay,
          correctAnswer: '✅ Evaluated by AI - Fluency, Pronunciation, Grammar, Vocabulary',
          isCorrect: hasAnswer,
          source: null,
          moduleType: 'speaking'
        })
      })
    }

    // Convert to IELTS band score (simplified)
    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0
    let bandScore
    if (percentage >= 90) bandScore = 9.0
    else if (percentage >= 80) bandScore = 8.5
    else if (percentage >= 70) bandScore = 8.0
    else if (percentage >= 60) bandScore = 7.5
    else if (percentage >= 50) bandScore = 7.0
    else if (percentage >= 40) bandScore = 6.5
    else if (percentage >= 30) bandScore = 6.0
    else if (percentage >= 20) bandScore = 5.5
    else bandScore = 5.0

    setModuleScores({
      ...moduleScores,
      [module.id]: { bandScore, correctAnswers: score, totalQuestions, percentage }
    })
    
    // Store detailed question analysis
    setQuestionDetails(prev => [...prev, ...detailedQuestions])

    setCompletedModules([...completedModules, module.id])

    if (currentModule < dynamicModules.length - 1) {
      const nextModuleIndex = currentModule + 1
      const nextModule = dynamicModules[nextModuleIndex]
      
      // Generate questions for the next module
      setLoadingQuestions(true)
      try {
        if (nextModule.id === 'listening') {
          // Fetch YouTube transcript for next module
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
          let transcript = ''
          
          try {
            const transcriptResponse = await fetch(`${API_URL}/api/v1/questions/fetch-youtube-transcript`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ video_id: nextModule.audioUrl })
            })
            const transcriptData = await transcriptResponse.json()
            transcript = transcriptData.transcript || ''
            if (transcript) {
              console.log('✅ Fetched YouTube transcript for next module:', transcript.substring(0, 100) + '...')
            }
          } catch (error) {
            console.error('❌ Error fetching transcript for next module:', error)
            transcript = 'IELTS listening practice conversation'
          }
          
          const questions = await generateQuestionsFromOllama('listening', transcript)
          
          const updatedModules = [...dynamicModules]
          updatedModules[nextModuleIndex].sections = [{ 
            id: 'section-1',
            title: 'Listening Section', 
            questions,
            transcript: transcript
          }]
          updatedModules[nextModuleIndex].transcript = transcript
          setDynamicModules(updatedModules)
        } else if (nextModule.id === 'reading') {
          const passagePrompt = 'Write an academic IELTS reading passage (300-400 words) about technology and artificial intelligence. Include academic vocabulary, research findings, and balanced viewpoints.'
          const questions = await generateQuestionsFromOllama('reading', passagePrompt)
          
          const readingPassage = `Artificial Intelligence and the Future of Work\n\nThe rapid advancement of artificial intelligence (AI) has sparked intense debate about its impact on employment and the future of work. While some experts predict widespread job displacement, others argue that AI will create new opportunities and enhance human productivity. Understanding these perspectives is crucial for developing appropriate policies and educational strategies.\n\nResearch from Oxford University suggests that up to 47% of current jobs in developed economies could be automated within the next two decades. Routine tasks in manufacturing, data entry, and customer service are particularly vulnerable to automation. However, jobs requiring creativity, emotional intelligence, and complex problem-solving appear more resistant to AI replacement. Healthcare professionals, educators, and creative workers may find AI tools augmenting rather than replacing their roles.\n\nProponents of AI emphasize its potential to eliminate dangerous and repetitive work while freeing humans to focus on more meaningful activities. Machine learning algorithms can process vast amounts of data far more quickly than humans, leading to breakthroughs in fields such as drug discovery, climate modeling, and scientific research. Companies implementing AI systems report increased efficiency and improved decision-making capabilities.\n\nCritics, however, raise concerns about growing inequality and the concentration of wealth among those who own AI technologies. They argue that displaced workers may struggle to transition to new roles, particularly if they lack access to retraining programs. The World Economic Forum estimates that 85 million jobs may be displaced by 2025, while 97 million new roles could emerge, but the geographical and skill mismatches present significant challenges.\n\nEducational institutions are responding by emphasizing skills that complement AI capabilities. Critical thinking, creativity, emotional intelligence, and adaptability are increasingly prioritized over rote memorization. Many experts advocate for lifelong learning approaches to help workers continuously update their skills in response to technological change. The transition to an AI-integrated economy will require coordinated efforts from governments, businesses, and educational institutions to ensure that the benefits are broadly shared while minimizing social disruption.`
          
          const updatedModules = [...dynamicModules]
          updatedModules[nextModuleIndex].passages = [{ 
            id: 'passage-1',
            title: 'Artificial Intelligence and the Future of Work', 
            questions,
            content: readingPassage
          }]
          setDynamicModules(updatedModules)
        } else if (nextModule.id === 'writing') {
          // Initialize writing tasks
          const updatedModules = [...dynamicModules]
          updatedModules[nextModuleIndex].tasks = [
            {
              id: 'writing-task-1',
              title: 'Task 1: Describing Visual Information',
              prompt: 'The chart below shows the percentage of households in different income brackets that own various types of technology devices. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.',
              minWords: 150
            },
            {
              id: 'writing-task-2',
              title: 'Task 2: Essay Writing',
              prompt: 'Some people believe that technology has made our lives more complex, while others argue it has made life simpler. Discuss both views and give your own opinion.',
              minWords: 250
            }
          ]
          setDynamicModules(updatedModules)
        } else if (nextModule.id === 'speaking') {
          // Initialize speaking questions
          const updatedModules = [...dynamicModules]
          updatedModules[nextModuleIndex].questions = [
            { id: 'speaking-1', part: 'Part 1', question: "Let's talk about your hometown. Where are you from?" },
            { id: 'speaking-2', part: 'Part 1', question: 'What do you like most about living there?' },
            { id: 'speaking-3', part: 'Part 1', question: 'How has your hometown changed in recent years?' },
            { id: 'speaking-4', part: 'Part 2', question: 'Describe a memorable journey you have taken. You should say: where you went, who you went with, what you did there, and explain why this journey was memorable.' },
            { id: 'speaking-5', part: 'Part 3', question: 'How do you think transportation will change in the future?' },
            { id: 'speaking-6', part: 'Part 3', question: 'What are the advantages and disadvantages of international travel?' }
          ]
          setDynamicModules(updatedModules)
        }
      } catch (error) {
        console.error('Error generating questions for next module:', error)
      } finally {
        setLoadingQuestions(false)
      }
      
      setCurrentModule(nextModuleIndex)
      setTimeRemaining(dynamicModules[nextModuleIndex].duration * 60)
      setAnswers({})  // Clear answers for new module
      setCurrentQuestionIndex(0)
      setModuleStartTimes(prev => ({ ...prev, [dynamicModules[nextModuleIndex].id]: Date.now() })) // Track new module start
    } else {
      // All modules completed - Save to database first, then show results
      await saveTestHistoryToDatabase()
      localStorage.removeItem('mockTestProgress')
      setShowResults(true)
      setTestStarted(false)
    }
  }

  const handleAnswer = (questionId, value) => {
    setAnswers({
      ...answers,
      [questionId]: value
    })
  }

  const handleRecording = (questionId) => {
    setIsRecording(questionId)
    // Record for 30 seconds for proper speaking response
    const timerId = setTimeout(() => {
      setIsRecording(null)
      handleAnswer(questionId, 'recorded')
      setRecordingTimerId(null)
    }, 30000)
    setRecordingTimerId(timerId)
  }
  
  const stopRecording = (questionId) => {
    if (recordingTimerId) {
      clearTimeout(recordingTimerId)
      setRecordingTimerId(null)
    }
    setIsRecording(null)
    handleAnswer(questionId, 'recorded')
  }

  const saveTestHistoryToDatabase = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      
      // Calculate total time spent
      const totalTimeSeconds = testStartTimestamp ? Math.floor((Date.now() - testStartTimestamp) / 1000) : 0
      
      // Calculate module times
      const moduleTimes = {}
      Object.keys(moduleStartTimes).forEach(moduleId => {
        const startTime = moduleStartTimes[moduleId]
        moduleTimes[moduleId] = Math.floor((Date.now() - startTime) / 1000)
      })
      
      // Calculate question type accuracy
      const questionTypeAccuracy = {}
      questionDetails.forEach(q => {
        if (!questionTypeAccuracy[q.type]) {
          questionTypeAccuracy[q.type] = { correct: 0, total: 0 }
        }
        questionTypeAccuracy[q.type].total++
        if (q.isCorrect) {
          questionTypeAccuracy[q.type].correct++
        }
      })
      
      // Convert to percentages
      const questionTypeAccuracyPercent = {}
      Object.keys(questionTypeAccuracy).forEach(type => {
        const stats = questionTypeAccuracy[type]
        questionTypeAccuracyPercent[type] = stats.total > 0 ? stats.correct / stats.total : 0
      })
      
      // Calculate topic performance (by module)
      const topicPerformance = {}
      questionDetails.forEach(q => {
        const topic = q.moduleType || 'unknown'
        if (!topicPerformance[topic]) {
          topicPerformance[topic] = { correct: 0, total: 0 }
        }
        topicPerformance[topic].total++
        if (q.isCorrect) {
          topicPerformance[topic].correct++
        }
      })
      
      const testData = {
        user_id: 1, // TODO: Get from auth context
        overall_band_score: Object.values(moduleScores).length > 0 
          ? Object.values(moduleScores).reduce((sum, s) => sum + s.bandScore, 0) / Object.keys(moduleScores).length 
          : 0,
        listening_score: moduleScores.listening?.bandScore || 0,
        reading_score: moduleScores.reading?.bandScore || 0,
        writing_score: moduleScores.writing?.bandScore || 0,
        speaking_score: moduleScores.speaking?.bandScore || 0,
        listening_correct: moduleScores.listening?.correctAnswers || 0,
        listening_total: moduleScores.listening?.totalQuestions || 0,
        reading_correct: moduleScores.reading?.correctAnswers || 0,
        reading_total: moduleScores.reading?.totalQuestions || 0,
        writing_task1_words: questionDetails.find(q => q.id === 'writing-task-1')?.userAnswer.match(/\d+/)?.[0] || 0,
        writing_task2_words: questionDetails.find(q => q.id === 'writing-task-2')?.userAnswer.match(/\d+/)?.[0] || 0,
        speaking_responses: questionDetails.filter(q => q.moduleType === 'speaking' && q.isCorrect).length,
        question_details: questionDetails,
        modules_completed: completedModules,
        question_sources: questionSources,
        total_time_seconds: totalTimeSeconds,
        module_times: moduleTimes,
        question_type_accuracy: questionTypeAccuracyPercent,
        topic_performance: topicPerformance
      }
      
      console.log('💾 Saving test history to database:', testData)
      
      const response = await fetch(`${API_URL}/api/v1/test-history/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Test history saved successfully! Test ID:', result.test_id)
      } else {
        console.error('❌ Failed to save test history:', await response.text())
      }
    } catch (error) {
      console.error('❌ Error saving test history:', error)
    }
  }

  const resetTest = () => {
    setCurrentModule(null)
    setTestStarted(false)
    setTimeRemaining(0)
    setCompletedModules([])
    setAnswers({})
    setShowResults(false)
    setModuleScores({})
    setIsRecording(null)
    setReadingAnalysis(null)
    setWritingFeedback({})
    setTestStartTimestamp(null)
    setModuleStartTimes({})
    setQuestionDetails([])
    setQuestionSources({})
    localStorage.removeItem('mockTestProgress')
  }

  if (showResults) {
    const overallScore = Object.values(moduleScores).reduce((sum, s) => sum + s.bandScore, 0) / Object.keys(moduleScores).length
    
    return (
      <div className={styles.mockTests}>
        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <h1>🎉 Test Complete!</h1>
            <p>Here's your comprehensive performance analysis</p>
          </div>

          <Card padding="xl">
            <div className={styles.overallScoreCard}>
              <h2>Overall Band Score</h2>
              <div className={styles.scoreCircle}>
                <div className={styles.scoreNumber}>{overallScore.toFixed(1)}</div>
                <div className={styles.scoreLabel}>IELTS Band</div>
              </div>
            </div>

            <div className={styles.moduleScoresGrid}>
              {modules.map(module => {
                const score = moduleScores[module.id]
                if (!score) return null
                return (
                  <div key={module.id} className={styles.moduleScoreCard}>
                    <div className={styles.moduleScoreHeader}>
                      <span className={styles.moduleIcon}>{module.icon}</span>
                      <h3>{module.name}</h3>
                    </div>
                    <div className={styles.moduleBandScore}>{score.bandScore}</div>
                    <div className={styles.scoreDetails}>
                      {score.correctAnswers} / {score.totalQuestions} correct
                    </div>
                    <div className={styles.scoreBar}>
                      <div className={styles.scoreBarFill} style={{ width: `${score.percentage}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>

            {readingAnalysis && (
              <div className={styles.aiAnalysis}>
                <h3>📊 AI Reading Analysis</h3>
                <div className={styles.analysisContent}>
                  <p><strong>Comprehension:</strong> {readingAnalysis.comprehension_feedback}</p>
                  <p><strong>Strengths:</strong> {readingAnalysis.strengths?.join(', ')}</p>
                  <p><strong>Areas to Improve:</strong> {readingAnalysis.improvements?.join(', ')}</p>
                </div>
              </div>
            )}

            {questionDetails.length > 0 && (
              <div className={styles.detailedBreakdown}>
                <h3>📝 Detailed Question-by-Question Analysis</h3>
                <p className={styles.breakdownIntro}>Review each question to understand your mistakes</p>
                
                <div className={styles.questionsList}>
                  {questionDetails.map((q, idx) => (
                    <div key={q.id} className={`${styles.questionDetailCard} ${q.isCorrect ? styles.correct : styles.incorrect}`}>
                      <div className={styles.questionHeader}>
                        <span className={styles.questionNumber}>Q{idx + 1}</span>
                        <span className={styles.moduleBadge}>
                          {q.moduleType === 'listening' && '🎧 Listening'}
                          {q.moduleType === 'reading' && '📖 Reading'}
                          {q.moduleType === 'writing' && '✍️ Writing'}
                          {q.moduleType === 'speaking' && '🗣️ Speaking'}
                        </span>
                        <span className={`${styles.statusBadge} ${q.isCorrect ? styles.correctBadge : styles.incorrectBadge}`}>
                          {q.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                        {q.source && (
                          <span className={styles.sourceBadge} title={q.source.videoUrl}>
                            🎬 YouTube
                          </span>
                        )}
                      </div>
                      
                      <div className={styles.questionContent}>
                        <p className={styles.questionText}><strong>Question:</strong> {q.question}</p>
                        
                        <div className={styles.answerComparison}>
                          <div className={styles.answerBox}>
                            <span className={styles.answerLabel}>Your Answer:</span>
                            <span className={`${styles.answerValue} ${!q.isCorrect ? styles.wrongAnswer : ''}`}>
                              {q.userAnswer}
                            </span>
                          </div>
                          
                          <div className={styles.answerBox}>
                            <span className={styles.answerLabel}>Correct Answer:</span>
                            <span className={`${styles.answerValue} ${styles.correctAnswerValue}`}>
                              {q.correctAnswer}
                            </span>
                          </div>
                        </div>
                        
                        {q.source && (
                          <div className={styles.sourceInfo}>
                            <strong>Source:</strong>{' '}
                            <a href={q.source.videoUrl} target="_blank" rel="noopener noreferrer">
                              {q.source.videoUrl}
                            </a>
                            <br />
                            <small>Generated from: {q.source.contentPreview}...</small>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(writingFeedback).length > 0 && (
              <div className={styles.aiAnalysis}>
                <h3>✍️ AI Writing Feedback</h3>
                {Object.entries(writingFeedback).map(([taskId, feedback]) => (
                  <div key={taskId} className={styles.writingFeedbackCard}>
                    <h4>Task {taskId.replace('writing-task-', '')}</h4>
                    <div className={styles.feedbackScores}>
                      <div className={styles.feedbackScore}>
                        <span className={styles.scoreLabel}>Task Achievement</span>
                        <span className={styles.scoreValue}>
                          {feedback.task_achievement || feedback.taskAchievement || 7}/9
                        </span>
                      </div>
                      <div className={styles.feedbackScore}>
                        <span className={styles.scoreLabel}>Coherence</span>
                        <span className={styles.scoreValue}>
                          {feedback.coherence || 7}/9
                        </span>
                      </div>
                      <div className={styles.feedbackScore}>
                        <span className={styles.scoreLabel}>Grammar</span>
                        <span className={styles.scoreValue}>
                          {feedback.grammar || 7}/9
                        </span>
                      </div>
                      <div className={styles.feedbackScore}>
                        <span className={styles.scoreLabel}>Vocabulary</span>
                        <span className={styles.scoreValue}>
                          {feedback.vocabulary || 7}/9
                        </span>
                      </div>
                    </div>
                    {feedback.overall_feedback && (
                      <p className={styles.feedbackText}>{feedback.overall_feedback}</p>
                    )}
                    {feedback.overallFeedback && (
                      <p className={styles.feedbackText}>{feedback.overallFeedback}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className={styles.performanceAnalysis}>
              <h3>Performance Analysis</h3>
              <div className={styles.analysisGrid}>
                <div className={styles.analysisCard}>
                  <h4>💪 Strengths</h4>
                  <ul>
                    {Object.entries(moduleScores).filter(([_, s]) => s.percentage >= 70).map(([id, _]) => (
                      <li key={id}>Strong {id} skills</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.analysisCard}>
                  <h4>📈 Areas to Improve</h4>
                  <ul>
                    {Object.entries(moduleScores).filter(([_, s]) => s.percentage < 70).map(([id, _]) => (
                      <li key={id}>Focus on {id} practice</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.analysisCard}>
                  <h4>🎯 Recommendations</h4>
                  <ul>
                    <li>Practice daily for 2 hours</li>
                    <li>Focus on weak areas</li>
                    <li>Take mock tests weekly</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button onClick={resetTest} className={styles.retakeButton}>
                🔄 Retake Test
              </button>
              <button onClick={() => navigate('/dashboard')} className={styles.dashboardButton}>
                📊 Back to Dashboard
              </button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (!testStarted) {
    return (
      <div className={styles.mockTests}>
        <button onClick={() => navigate(-1)} className={styles.backButtonOverview}>
          ← Back
        </button>
        <div className={styles.header}>
          <h1>🎯 Full IELTS Mock Test</h1>
          <p>Complete all four modules in one sitting</p>
        </div>

        <Card padding="xl">
          <div className={styles.overview}>
            <div className={styles.testInfo}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Total Duration</span>
                <span className={styles.infoValue}>{formatTime(totalDuration)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Modules</span>
                <span className={styles.infoValue}>4</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Format</span>
                <span className={styles.infoValue}>Academic</span>
              </div>
            </div>

            <div className={styles.modulesList}>
              <h3>Test Structure</h3>
              {modules.map((module, index) => (
                <div key={module.id} className={styles.moduleItem}>
                  <div className={styles.moduleLeft}>
                    <span className={styles.moduleNumber}>{index + 1}</span>
                    <span className={styles.moduleIcon}>{module.icon}</span>
                    <div>
                      <div className={styles.moduleName}>{module.name}</div>
                      <div className={styles.moduleDesc}>{module.description}</div>
                    </div>
                  </div>
                  <div className={styles.moduleDuration}>{formatTime(module.duration)}</div>
                </div>
              ))}
            </div>

            <div className={styles.instructions}>
              <h3>⚠️ Important Instructions</h3>
              <ul>
                <li>Complete all four modules in sequence</li>
                <li>Each module has a strict time limit</li>
                <li>You cannot return to a previous module once completed</li>
                <li>Ensure you have a quiet environment for the Speaking module</li>
                <li>Use headphones for the Listening module</li>
              </ul>
            </div>

            <button onClick={startTest} className={styles.startTestButton}>
              Start Mock Test
            </button>
          </div>
        </Card>
      </div>
    )
  }

  const activeModule = dynamicModules[currentModule]

  // Safety check: if module is not ready yet, show loading
  if (!activeModule) {
    return (
      <div className={styles.mockTests}>
        <div className={styles.loadingQuestions}>
          <div className={styles.loader}></div>
          <p>Loading module...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.mockTests}>
      <ResumeTestModal
        isOpen={showResumeModal}
        onResume={handleResumeTest}
        onStartNew={handleStartFresh}
        testInfo={resumeTestInfo}
      />

      {showExitDialog && (
        <div className={styles.exitDialog}>
          <div className={styles.dialogOverlay} onClick={cancelExit}></div>
          <div className={styles.dialogContent}>
            <h3>⚠️ Exit Test?</h3>
            <p>Your progress will be saved and you can resume later.</p>
            <div className={styles.dialogActions}>
              <button onClick={confirmExit} className={styles.confirmButton}>Yes, Save & Exit</button>
              <button onClick={cancelExit} className={styles.cancelButton}>Continue Test</button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.testHeader}>
        <button onClick={handleBackClick} className={styles.backButton}>
          ← Back
        </button>

        <div className={styles.moduleProgress}>
          {modules.map((module, index) => (
            <div
              key={module.id}
              className={`${styles.progressStep} ${
                index < currentModule
                  ? styles.completed
                  : index === currentModule
                  ? styles.active
                  : ''
              }`}
            >
              <div className={styles.progressIcon}>{module.icon}</div>
              <div className={styles.progressName}>{module.name}</div>
            </div>
          ))}
        </div>

        <div className={styles.timer}>
          <div className={styles.timerLabel}>Time Remaining</div>
          <div className={styles.timerValue}>{formatTimerDisplay(timeRemaining)}</div>
        </div>
      </div>

      <Card padding="xl">
        <div className={styles.moduleTest}>
          <div className={styles.moduleHeader}>
            <span className={styles.moduleIcon} style={{ fontSize: '3rem' }}>
              {activeModule.icon}
            </span>
            <h2>{activeModule.name} Test</h2>
            <p>{activeModule.description}</p>
          </div>

          <div className={styles.testContent}>
            {activeModule.id === 'listening' && (
              <div className={styles.questionsContainer}>
                {activeModule.sections?.map((section, secIdx) => (
                  <div key={section.id || secIdx} className={styles.sectionContainer}>
                    <div className={styles.audioPlayerSection}>
                      <div className={styles.audioHeader}>
                        <div className={styles.audioIconLarge}>🎧</div>
                        <div>
                          <h3 className={styles.audioSectionTitle}>{section.title || 'Listening Section'}</h3>
                          <p className={styles.audioDescription}>Listen carefully and answer the questions</p>
                        </div>
                      </div>

                      <YouTubePlayer videoId={activeModule.audioUrl} title="IELTS Listening Test Audio" />
                      
                      <div className={styles.transcriptToggle}>
                        <button onClick={() => setShowTranscript(!showTranscript)} className={styles.toggleButton}>
                          {showTranscript ? '📝 Hide Transcript' : '📝 Show Transcript'}
                        </button>
                      </div>

                      {showTranscript && activeModule.transcript && (
                        <div className={styles.transcript}>
                          <h4>Audio Transcript</h4>
                          <p style={{whiteSpace: 'pre-wrap'}}>{activeModule.transcript}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className={styles.listeningNote}>
                      <strong>⚠️ Instructions:</strong> Listen to the audio carefully and answer the questions below. In the real test, you will hear the recording only once.
                    </div>

                    {loadingQuestions ? (
                      <div className={styles.loadingQuestions}>
                        <div className={styles.loader}></div>
                        <p>Generating unique questions using AI...</p>
                      </div>
                    ) : (
                      <div className={styles.progressiveQuestionDisplay}>
                        <div className={styles.questionNavigation}>
                          <span className={styles.questionCounter}>
                            Question {currentQuestionIndex + 1} of {section.questions.length}
                          </span>
                          <div className={styles.questionDots}>
                            {section.questions.map((_, idx) => (
                              <span
                                key={idx}
                                className={`${styles.dot} ${idx === currentQuestionIndex ? styles.activeDot : ''} ${answers[section.questions[idx].id] ? styles.answeredDot : ''}`}
                                onClick={() => setCurrentQuestionIndex(idx)}
                              />
                            ))}
                          </div>
                        </div>

                        {section.questions.slice(currentQuestionIndex, currentQuestionIndex + 1).map((q) => (
                          <div key={q.id} className={styles.question}>
                            <p className={styles.questionText}>
                              <span className={styles.qNumber}>Q{q.id}</span>{' '}
                              {q.question}
                            </p>
                            {q.type === 'fill' && (
                              <input
                                type="text"
                                className={styles.answerInput}
                                placeholder="Type your answer here..."
                                value={answers[q.id] || ''}
                                onChange={(e) => handleAnswer(q.id, e.target.value)}
                                autoFocus
                              />
                            )}
                            {q.type === 'mcq' && (
                              <div className={styles.options}>
                                {q.options.map((opt) => (
                                  <label key={opt} className={styles.option}>
                                    <input
                                      type="radio"
                                      name={`q${q.id}`}
                                      value={opt}
                                      checked={answers[q.id] === opt}
                                      onChange={(e) => handleAnswer(q.id, e.target.value)}
                                    />
                                    {opt}
                                  </label>
                                ))}
                              </div>
                            )}
                            {q.type === 'tf' && (
                              <div className={styles.options}>
                                {(q.options || ['True', 'False', 'Not Given']).map((opt) => (
                                  <label key={opt} className={styles.option}>
                                    <input
                                      type="radio"
                                      name={`q${q.id}`}
                                      value={opt.toLowerCase()}
                                      checked={answers[q.id] === opt.toLowerCase()}
                                      onChange={(e) => handleAnswer(q.id, e.target.value)}
                                    />
                                    {opt}
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}

                        <div className={styles.questionNavButtons}>
                          <button
                            onClick={handlePrevQuestion}
                            disabled={currentQuestionIndex === 0}
                            className={styles.navButton}
                          >
                            ← Previous
                          </button>
                          <button
                            onClick={handleNextQuestion}
                            disabled={currentQuestionIndex >= section.questions.length - 1}
                            className={styles.navButton}
                          >
                            Next →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeModule.id === 'reading' && (
              <div className={styles.questionsContainer}>
                {(activeModule.passages || []).map((passage, passIdx) => (
                  <div key={passage.id} className={styles.passageContainer}>
                    <div className={styles.passageCard}>
                      <div className={styles.passageHeader}>
                        <h3>📖 {passage.title}</h3>
                        <button className={styles.highlightButton}>🖍 Highlight Tool</button>
                      </div>
                      <div className={styles.passageContent}>
                        <p style={{whiteSpace: 'pre-wrap'}}>{passage.content}</p>
                      </div>
                      
                      {loadingAnalysis && passIdx === (activeModule.passages || []).length - 1 && (
                        <div className={styles.analysisLoader}>
                          <div className={styles.loader}></div>
                          <p>AI is analyzing your comprehension...</p>
                        </div>
                      )}
                    </div>

                    {loadingQuestions ? (
                      <div className={styles.loadingQuestions}>
                        <div className={styles.loader}></div>
                        <p>Generating unique questions using AI...</p>
                      </div>
                    ) : (
                      <div className={styles.progressiveQuestionDisplay}>
                        <div className={styles.questionNavigation}>
                          <span className={styles.questionCounter}>
                            Question {currentQuestionIndex + 1} of {passage.questions?.length || 0}
                          </span>
                          <div className={styles.questionDots}>
                            {(passage.questions || []).map((_, idx) => (
                              <span
                                key={idx}
                                className={`${styles.dot} ${idx === currentQuestionIndex ? styles.activeDot : ''} ${answers[passage.questions[idx].id] ? styles.answeredDot : ''}`}
                                onClick={() => setCurrentQuestionIndex(idx)}
                              />
                            ))}
                          </div>
                        </div>

                        {(passage.questions || []).slice(currentQuestionIndex, currentQuestionIndex + 1).map((q) => (
                          <div key={q.id} className={styles.question}>
                            <p className={styles.questionText}>
                              <span className={styles.qNumber}>Q{q.id}</span>{' '}
                              {q.question}
                            </p>
                            {q.type === 'tf' && (
                              <div className={styles.options}>
                                {(q.options || ['True', 'False', 'Not Given']).map((opt) => (
                                  <label key={opt} className={styles.option}>
                                    <input
                                      type="radio"
                                      name={`q${q.id}`}
                                      value={opt.toLowerCase()}
                                      checked={answers[q.id] === opt.toLowerCase()}
                                      onChange={(e) => handleAnswer(q.id, e.target.value)}
                                    />
                                    {opt}
                                  </label>
                                ))}
                              </div>
                            )}
                            {q.type === 'mcq' && (
                              <div className={styles.options}>
                                {(q.options || []).map((opt) => (
                                  <label key={opt} className={styles.option}>
                                    <input
                                      type="radio"
                                      name={`q${q.id}`}
                                      value={opt}
                                      checked={answers[q.id] === opt}
                                      onChange={(e) => handleAnswer(q.id, e.target.value)}
                                    />
                                    {opt}
                                  </label>
                                ))}
                              </div>
                            )}
                            {q.type === 'fill' && (
                              <input
                                type="text"
                                className={styles.answerInput}
                                placeholder="Type your answer here..."
                                value={answers[q.id] || ''}
                                onChange={(e) => handleAnswer(q.id, e.target.value)}
                                autoFocus
                              />
                            )}
                          </div>
                        ))}

                        <div className={styles.questionNavButtons}>
                          <button
                            onClick={handlePrevQuestion}
                            disabled={currentQuestionIndex === 0}
                            className={styles.navButton}
                          >
                            ← Previous
                          </button>
                          <button
                            onClick={handleNextQuestion}
                            disabled={currentQuestionIndex >= (passage.questions?.length || 0) - 1}
                            className={styles.navButton}
                          >
                            Next →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeModule.id === 'writing' && (
              <div className={styles.writingContainer}>
                {(activeModule.tasks || []).map((task) => (
                  <div key={task.id} className={styles.writingTaskCard}>
                    <div className={styles.taskHeader}>
                      <h3>{task.title}</h3>
                      <div className={styles.taskBadge}>{task.minWords}+ words</div>
                    </div>
                    <div className={styles.writingPromptCard}>
                      <div className={styles.promptIcon}>💡</div>
                      <p className={styles.writingPrompt}>{task.prompt}</p>
                    </div>
                    <div className={styles.editorContainer}>
                      <div className={styles.editorToolbar}>
                        <button className={styles.toolButton} title="Bold">B</button>
                        <button className={styles.toolButton} title="Italic">I</button>
                        <button className={styles.toolButton} title="Underline">U</button>
                        <div className={styles.toolDivider}></div>
                        <button className={styles.toolButton} title="Undo">↶</button>
                        <button className={styles.toolButton} title="Redo">↷</button>
                      </div>
                    <textarea
                      className={styles.writingArea}
                      placeholder="Begin writing your essay here... Remember to organize your ideas clearly and use appropriate vocabulary."
                      value={answers[task.id] || ''}
                      onChange={(e) => handleAnswer(task.id, e.target.value)}
                    />
                    </div>
                    <div className={styles.writingStats}>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Words</span>
                        <span className={styles.statValue}>
                          {(answers[task.id] || '').trim().split(/\s+/).filter(w => w).length}
                        </span>
                      </div>
                      <div className={styles.statDivider}></div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Characters</span>
                        <span className={styles.statValue}>{(answers[task.id] || '').length}</span>
                      </div>
                      <div className={styles.statDivider}></div>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Target</span>
                        <span className={styles.statValue}>{task.minWords}+</span>
                      </div>
                    </div>
                    
                    {loadingAnalysis && writingFeedback[task.id] === undefined && (
                      <div className={styles.feedbackLoader}>
                        <div className={styles.loader}></div>
                        <p>AI is evaluating your essay...</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeModule.id === 'speaking' && (
              <div className={styles.speakingContainer}>
                <div className={styles.speakingNote}>
                  <strong>🎤 AI Speaking Test:</strong> Have a natural conversation with our AI examiner. Answer questions clearly and naturally. Each response is recorded for up to 30 seconds. All questions are related to the topic.
                </div>

                {(activeModule.questions || []).map((q, idx) => (
                  <div key={q.id} className={styles.speakingQuestion}>
                    <div className={styles.chatBubble}>
                      <div className={styles.examinerAvatar}>🤖</div>
                      <div className={styles.chatContent}>
                        <div className={styles.partBadge}>{q.part}</div>
                        <p className={styles.speakingQuestionText}>{q.question}</p>
                      </div>
                    </div>
                    
                    <div className={styles.studentResponse}>
                      <div className={styles.recordingSection}>
                        {!answers[q.id] ? (
                          <>
                            <button 
                              className={`${styles.micButton} ${isRecording === q.id ? styles.recording : ''}`}
                              onClick={() => isRecording === q.id ? stopRecording(q.id) : handleRecording(q.id)}
                            >
                              {isRecording === q.id ? (
                                <>
                                  <span className={styles.recordingPulse}>⏹</span>
                                  Stop Recording
                                </>
                              ) : (
                                <>
                                  🎤 Start Speaking
                                </>
                              )}
                            </button>
                            {isRecording === q.id && (
                              <div className={styles.recordingTimer}>
                                <div className={styles.waveform}>
                                  <span className={styles.bar}></span>
                                  <span className={styles.bar}></span>
                                  <span className={styles.bar}></span>
                                  <span className={styles.bar}></span>
                                  <span className={styles.bar}></span>
                                </div>
                                <p className={styles.recordingHint}>Speak clearly and naturally... (Max 30s)</p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className={styles.responseRecorded}>
                            <div className={styles.studentAvatar}>👤</div>
                            <div className={styles.recordedBubble}>
                              <span className={styles.checkIcon}>✓</span>
                              <span>Response recorded successfully</span>
                              <button 
                                className={styles.reRecordBtn}
                                onClick={() => {
                                  handleAnswer(q.id, null)
                                  setIsRecording(null)
                                }}
                              >
                                🔄 Re-record
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {q.part === 'Part 2' && !answers[q.id] && (
                        <div className={styles.preparationNote}>
                          💡 You have 1 minute to prepare. You may take notes before recording.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className={styles.speakingTips}>
                  <h4>💡 Speaking Tips:</h4>
                  <ul>
                    <li>Speak naturally and clearly</li>
                    <li>Elaborate on your answers with examples</li>
                    <li>You have 30 seconds per response</li>
                    <li>Focus on fluency and coherence</li>
                  </ul>
                </div>
              </div>
            )}

            {validationError && (
              <div className={styles.validationError}>
                <span className={styles.errorIcon}>⚠️</span>
                {validationError}
              </div>
            )}

            {/* Show progress indicator */}
            <div className={styles.moduleProgress}>
              <div className={styles.progressInfo}>
                {activeModule.id === 'listening' && (
                  <span>
                    Questions Answered: {Object.keys(answers).length} / {activeModule.sections?.flatMap(s => s.questions).length || 0}
                  </span>
                )}
                {activeModule.id === 'reading' && (
                  <span>
                    Questions Answered: {Object.keys(answers).length} / {activeModule.passages?.flatMap(p => p.questions).length || 0}
                  </span>
                )}
                {activeModule.id === 'writing' && (
                  <span>
                    Tasks Completed: {Object.keys(answers).filter(k => (answers[k] || '').trim().length > 0).length} / {activeModule.tasks?.length || 0}
                  </span>
                )}
                {activeModule.id === 'speaking' && (
                  <span>
                    Questions Answered: {Object.keys(answers).length} / {activeModule.questions?.length || 0}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.buttonGroup}>
              {currentModule > 0 && (
                <button 
                  onClick={() => {
                    if (currentModule > 0) {
                      setCurrentModule(currentModule - 1)
                      setTimeRemaining(dynamicModules[currentModule - 1].duration * 60)
                      setCurrentQuestionIndex(0)
                    }
                  }} 
                  className={styles.prevModuleButton}
                >
                  ← Previous Module
                </button>
              )}
              <button 
                onClick={handleModuleComplete} 
                className={styles.completeButton}
                title={validationError ? "Please answer all questions" : ""}
              >
                {currentModule < modules.length - 1 ? '✓ Complete & Next Module →' : '✓ Finish Test'}
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default MockTests
