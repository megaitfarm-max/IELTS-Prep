import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Button } from '@components/common/Button'
import styles from './Home.module.css'

function Home() {
  const [activeDemo, setActiveDemo] = useState(0)
  const [stats, setStats] = useState({ users: 0, lessons: 0, success: 0 })
  const [typedText, setTypedText] = useState('')
  const fullText = 'Master IELTS with AI-Powered Learning'
  
  // Speaking demo states
  const [isRecording, setIsRecording] = useState(false)
  const [recordingStep, setRecordingStep] = useState('idle') // idle, recording, transcribing, analyzing, complete
  const [transcribedText, setTranscribedText] = useState('')

  // Writing demo states
  const [writingStep, setWritingStep] = useState('idle') // idle, writing, analyzing, complete
  const [writtenText, setWrittenText] = useState('')
  const [currentSentence, setCurrentSentence] = useState(0)

  // Chatbot demo states
  const [chatStep, setChatStep] = useState('idle') // idle, user-typing, ai-thinking, ai-responding, complete
  const [chatMessages, setChatMessages] = useState([])
  const [currentMessage, setCurrentMessage] = useState('')

  // Typing animation effect
  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index))
        index++
      } else {
        clearInterval(timer)
      }
    }, 50)
    return () => clearInterval(timer)
  }, [])

  // Auto demo carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveDemo((prev) => (prev + 1) % demoFeatures.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  // Animated stats counter
  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = {
      users: Math.ceil(5000 / steps),
      lessons: Math.ceil(500 / steps),
      success: Math.ceil(95 / steps)
    }

    let current = 0
    const timer = setInterval(() => {
      current++
      setStats({
        users: Math.min(current * increment.users, 5000),
        lessons: Math.min(current * increment.lessons, 500),
        success: Math.min(current * increment.success, 95)
      })
      if (current >= steps) clearInterval(timer)
    }, duration / steps)

    return () => clearInterval(timer)
  }, [])
  
  // Demo speaking practice simulation
  const handleRecordDemo = () => {
    if (recordingStep !== 'idle') return
    
    // Step 1: Recording
    setRecordingStep('recording')
    setIsRecording(true)
    
    setTimeout(() => {
      // Step 2: Transcribing
      setRecordingStep('transcribing')
      setIsRecording(false)
      
      // Simulate typing transcription
      const fullTranscript = "I visited the Grand Canyon last summer, and it was absolutely breathtaking. The vast expanse of the canyon stretched before me, with layers of red and orange rock formations. I felt so small compared to the magnificent landscape."
      let index = 0
      const transcribeInterval = setInterval(() => {
        if (index <= fullTranscript.length) {
          setTranscribedText(fullTranscript.slice(0, index))
          index += 2
        } else {
          clearInterval(transcribeInterval)
          
          // Step 3: Analyzing
          setTimeout(() => {
            setRecordingStep('analyzing')
            
            // Step 4: Complete
            setTimeout(() => {
              setRecordingStep('complete')
            }, 1500)
          }, 500)
        }
      }, 30)
    }, 3000)
  }
  
  const resetDemo = () => {
    setRecordingStep('idle')
    setIsRecording(false)
    setTranscribedText('')
  }

  // Writing demo workflow
  const handleStartWriting = () => {
    if (writingStep !== 'idle') return

    // Step 1: Writing simulation (5 seconds)
    setWritingStep('writing')
    setWrittenText('')
    setCurrentSentence(0)

    const sentences = [
      "The environment is one of the most pressing issues facing humanity today. ",
      "Climate change, pollution, and deforestation are threatening our planet's future. ",
      "It is crucial that we take immediate action to protect our natural resources and ecosystems."
    ]

    let sentenceIndex = 0
    const typeSentence = () => {
      if (sentenceIndex < sentences.length) {
        const sentence = sentences[sentenceIndex]
        let charIndex = 0
        const typeInterval = setInterval(() => {
          if (charIndex <= sentence.length) {
            setWrittenText(sentences.slice(0, sentenceIndex).join('') + sentence.slice(0, charIndex))
            charIndex++
          } else {
            clearInterval(typeInterval)
            sentenceIndex++
            setCurrentSentence(sentenceIndex)
            if (sentenceIndex < sentences.length) {
              setTimeout(typeSentence, 300)
            } else {
              // Step 2: Analyzing (2 seconds)
              setTimeout(() => {
                setWritingStep('analyzing')
                
                // Step 3: Complete (show results)
                setTimeout(() => {
                  setWritingStep('complete')
                }, 2000)
              }, 500)
            }
          }
        }, 40)
      }
    }

    typeSentence()
  }

  const resetWritingDemo = () => {
    setWritingStep('idle')
    setWrittenText('')
    setCurrentSentence(0)
  }

  // Chatbot demo workflow
  const handleStartChat = () => {
    if (chatStep !== 'idle') return

    setChatMessages([])
    setCurrentMessage('')
    
    // Step 1: Show AI greeting
    setChatStep('ai-responding')
    const greeting = "👋 Hi! I'm your AI IELTS tutor. I can help you with Writing, Speaking, Reading, and Listening. What would you like to practice today?"
    
    let charIndex = 0
    const typeGreeting = setInterval(() => {
      if (charIndex <= greeting.length) {
        setCurrentMessage(greeting.slice(0, charIndex))
        charIndex++
      } else {
        clearInterval(typeGreeting)
        setChatMessages([{ role: 'assistant', content: greeting }])
        setCurrentMessage('')
        
        // Step 2: User types question
        setTimeout(() => {
          setChatStep('user-typing')
          const userQuestion = "How can I improve my Writing Task 2 score?"
          let userCharIndex = 0
          const typeUser = setInterval(() => {
            if (userCharIndex <= userQuestion.length) {
              setCurrentMessage(userQuestion.slice(0, userCharIndex))
              userCharIndex++
            } else {
              clearInterval(typeUser)
              setChatMessages(prev => [...prev, { role: 'user', content: userQuestion }])
              setCurrentMessage('')
              
              // Step 3: AI thinking
              setTimeout(() => {
                setChatStep('ai-thinking')
                
                // Step 4: AI response
                setTimeout(() => {
                  setChatStep('ai-responding')
                  const aiResponse = "Great question! Here are 3 key tips to improve your Task 2 score:\n\n1️⃣ **Clear Structure** - Use 4 paragraphs (intro, 2 body, conclusion)\n\n2️⃣ **Strong Arguments** - Support each point with examples\n\n3️⃣ **Advanced Vocabulary** - Use topic-specific words and collocations\n\nWould you like me to show you a sample essay?"
                  
                  let aiCharIndex = 0
                  const typeAI = setInterval(() => {
                    if (aiCharIndex <= aiResponse.length) {
                      setCurrentMessage(aiResponse.slice(0, aiCharIndex))
                      aiCharIndex += 2
                    } else {
                      clearInterval(typeAI)
                      setChatMessages(prev => [...prev, { role: 'assistant', content: aiResponse }])
                      setCurrentMessage('')
                      setChatStep('complete')
                    }
                  }, 20)
                }, 1500)
              }, 500)
            }
          }, 50)
        }, 1000)
      }
    }, 30)
  }

  const resetChatDemo = () => {
    setChatStep('idle')
    setChatMessages([])
    setCurrentMessage('')
  }

  return (
    <div className={styles.home}>
      {/* Animated Background */}
      <div className={styles.backgroundAnimation}>
        <div className={styles.circle1}></div>
        <div className={styles.circle2}></div>
        <div className={styles.circle3}></div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🎓</span>
          <span>IELTS Prep</span>
        </div>
        <div className={styles.navLinks}>
          <Link to="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link to="/register">
            <Button variant="primary">Get Started</Button>
          </Link>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <span className={styles.badgePulse}>🔥</span>
            <span>Trusted by 5,000+ Students</span>
          </div>
          
          <h1 className={styles.heroTitle}>
            {typedText}
            <span className={styles.cursor}>|</span>
          </h1>
          
          <p className={styles.heroSubtitle}>
            Engage with <strong>interactive lessons</strong>, practice with <strong>AI feedback</strong>, 
            and track your progress with <strong>gamified learning</strong> designed to help you achieve your target band score.
          </p>
          
          <div className={styles.heroCta}>
            <Link to="/register">
              <Button variant="primary" size="lg">
                Start Learning Free
                <span className={styles.arrow}>→</span>
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">I Have an Account</Button>
            </Link>
          </div>

          {/* Live Stats */}
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{stats.users.toLocaleString()}+</div>
              <div className={styles.statLabel}>Active Learners</div>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{stats.lessons}+</div>
              <div className={styles.statLabel}>Lessons Available</div>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{stats.success}%</div>
              <div className={styles.statLabel}>Success Rate</div>
            </div>
          </div>
        </div>
        
        <div className={styles.heroImage}>
          {/* Animated Demo Card */}
          <div className={styles.demoContainer}>
            <div className={styles.demoCard}>
              <div className={styles.demoHeader}>
                <span className={styles.demoTitle}>Live Demo</span>
                <div className={styles.demoIndicators}>
                  {demoFeatures.map((_, index) => (
                    <div
                      key={index}
                      className={`${styles.indicator} ${index === activeDemo ? styles.active : ''}`}
                    />
                  ))}
                </div>
              </div>
              
              <div className={styles.demoContent}>
                <div className={styles.demoIcon}>{demoFeatures[activeDemo].icon}</div>
                <h3 className={styles.demoFeatureTitle}>{demoFeatures[activeDemo].title}</h3>
                <p className={styles.demoFeatureDesc}>{demoFeatures[activeDemo].description}</p>
                
                <div className={styles.demoVisual}>
                  {demoFeatures[activeDemo].visual}
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className={styles.floatingCard} style={{ top: '10%', right: '-20px' }}>
              <span>🎯</span>
              <span>Band 8.5</span>
            </div>
            <div className={styles.floatingCard} style={{ bottom: '20%', left: '-20px' }}>
              <span>⚡</span>
              <span>15 Day Streak</span>
            </div>
          </div>
        </div>
      </section>

      {/* Module Preview Section */}
      <section className={styles.modules}>
        <h2 className={styles.sectionTitle}>
          Complete IELTS Preparation Modules
        </h2>
        <p className={styles.sectionSubtitle}>
          Everything you need to ace all four sections of the IELTS exam
        </p>
        
        <div className={styles.moduleGrid}>
          {modules.map((module, index) => (
            <div
              key={index}
              className={styles.moduleCard}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={styles.moduleIcon}>{module.icon}</div>
              <h3 className={styles.moduleTitle}>{module.title}</h3>
              <p className={styles.moduleDescription}>{module.description}</p>
              <div className={styles.moduleStats}>
                <span>📚 {module.lessons} Lessons</span>
                <span>⏱️ {module.duration}</span>
              </div>
              <div className={styles.moduleProgress}>
                <div className={styles.moduleProgressBar} style={{ width: `${module.completion}%` }}></div>
              </div>
              <span className={styles.moduleCompletion}>{module.completion}% Average Completion</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>Powerful Features to Accelerate Your Learning</h2>
        <div className={styles.featureGrid}>
          {features.map((feature, index) => (
            <div
              key={index}
              className={styles.featureCard}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
              {feature.badge && <span className={styles.featureBadge}>{feature.badge}</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Demos Section */}
      <section className={styles.demoSection}>
        <h2 className={styles.sectionTitle}>Try Our Features - No Signup Required</h2>
        <p className={styles.sectionSubtitle}>
          Experience our AI-powered learning tools right now
        </p>
        
        <div className={styles.demoGrid}>
          {/* Speaking Practice Demo */}
          <div className={styles.liveDemoCard}>
            <div className={styles.demoHeader}>
              <span className={styles.demoIcon}>🎤</span>
              <h3 className={styles.demoCardTitle}>AI Speaking Practice</h3>
              <span className={styles.liveBadge}>Live Demo</span>
            </div>
            <div className={styles.demoPreview}>
              <div className={styles.speakingDemo}>
                <div className={styles.questionBox}>
                  <span className={styles.questionLabel}>Part 2 Question:</span>
                  <p className={styles.questionText}>
                    "Describe a place you visited that left a strong impression on you."
                  </p>
                </div>
                
                {recordingStep === 'idle' && (
                  <div className={styles.recordingInterface}>
                    <div className={styles.waveform}>
                      <div className={styles.wave} style={{height: '30%'}}></div>
                      <div className={styles.wave} style={{height: '30%'}}></div>
                      <div className={styles.wave} style={{height: '30%'}}></div>
                      <div className={styles.wave} style={{height: '30%'}}></div>
                      <div className={styles.wave} style={{height: '30%'}}></div>
                      <div className={styles.wave} style={{height: '30%'}}></div>
                      <div className={styles.wave} style={{height: '30%'}}></div>
                      <div className={styles.wave} style={{height: '30%'}}></div>
                    </div>
                    <button className={styles.recordButton} onClick={handleRecordDemo}>
                      <span className={styles.micIcon}>🎙️</span>
                      <span>Click to Start Recording</span>
                    </button>
                  </div>
                )}
                
                {recordingStep === 'recording' && (
                  <div className={styles.recordingInterface}>
                    <div className={styles.recordingStatus}>
                      <span className={styles.recordingDot}></span>
                      <span>Recording... Speak now!</span>
                    </div>
                    <div className={styles.waveform}>
                      <div className={styles.wave} style={{height: '40%', animation: 'waveAnimation 0.5s ease-in-out infinite'}}></div>
                      <div className={styles.wave} style={{height: '70%', animation: 'waveAnimation 0.5s ease-in-out infinite 0.1s'}}></div>
                      <div className={styles.wave} style={{height: '50%', animation: 'waveAnimation 0.5s ease-in-out infinite 0.2s'}}></div>
                      <div className={styles.wave} style={{height: '85%', animation: 'waveAnimation 0.5s ease-in-out infinite 0.3s'}}></div>
                      <div className={styles.wave} style={{height: '60%', animation: 'waveAnimation 0.5s ease-in-out infinite 0.4s'}}></div>
                      <div className={styles.wave} style={{height: '90%', animation: 'waveAnimation 0.5s ease-in-out infinite 0.5s'}}></div>
                      <div className={styles.wave} style={{height: '45%', animation: 'waveAnimation 0.5s ease-in-out infinite 0.6s'}}></div>
                      <div className={styles.wave} style={{height: '75%', animation: 'waveAnimation 0.5s ease-in-out infinite 0.7s'}}></div>
                    </div>
                    <div className={styles.timer}>00:{String(3).padStart(2, '0')}</div>
                  </div>
                )}
                
                {recordingStep === 'transcribing' && (
                  <div className={styles.transcribingBox}>
                    <div className={styles.statusHeader}>
                      <span className={styles.spinner}></span>
                      <span>Transcribing your speech...</span>
                    </div>
                    <div className={styles.transcriptText}>
                      {transcribedText}
                      <span className={styles.typingCursor}>|</span>
                    </div>
                  </div>
                )}
                
                {recordingStep === 'analyzing' && (
                  <div className={styles.analyzingBox}>
                    <div className={styles.transcriptBox}>
                      <span className={styles.transcriptLabel}>Your Answer:</span>
                      <p className={styles.finalTranscript}>{transcribedText}</p>
                    </div>
                    <div className={styles.statusHeader}>
                      <span className={styles.spinner}></span>
                      <span>Analyzing fluency, pronunciation, and grammar...</span>
                    </div>
                  </div>
                )}
                
                {recordingStep === 'complete' && (
                  <>
                    <div className={styles.transcriptBox}>
                      <span className={styles.transcriptLabel}>Your Answer:</span>
                      <p className={styles.finalTranscript}>{transcribedText}</p>
                    </div>
                    <div className={styles.feedbackPreview}>
                      <div className={styles.scoreItem}>
                        <span className={styles.scoreLabel}>Fluency</span>
                        <div className={styles.scoreBar}>
                          <div className={styles.scoreProgress} style={{width: '85%'}}></div>
                        </div>
                        <span className={styles.scoreValue}>8.5</span>
                      </div>
                      <div className={styles.scoreItem}>
                        <span className={styles.scoreLabel}>Pronunciation</span>
                        <div className={styles.scoreBar}>
                          <div className={styles.scoreProgress} style={{width: '78%'}}></div>
                        </div>
                        <span className={styles.scoreValue}>7.8</span>
                      </div>
                      <div className={styles.scoreItem}>
                        <span className={styles.scoreLabel}>Grammar</span>
                        <div className={styles.scoreBar}>
                          <div className={styles.scoreProgress} style={{width: '90%'}}></div>
                        </div>
                        <span className={styles.scoreValue}>9.0</span>
                      </div>
                    </div>
                    <button className={styles.tryAgainButton} onClick={resetDemo}>
                      🔄 Try Again
                    </button>
                  </>
                )}
              </div>
            </div>
            <Link to="/register" className={styles.demoCtaLink}>
              <Button variant="primary" size="sm">Try Full Speaking Practice →</Button>
            </Link>
          </div>

          {/* Writing Practice Demo */}
          <div className={styles.liveDemoCard}>
            <div className={styles.demoHeader}>
              <span className={styles.demoIcon}>✍️</span>
              <h3 className={styles.demoCardTitle}>AI Writing Feedback</h3>
              <span className={styles.liveBadge}>Live Demo</span>
            </div>
            <div className={styles.demoPreview}>
              <div className={styles.writingDemo}>
                {/* Idle State */}
                {writingStep === 'idle' && (
                  <>
                    <div className={styles.writingPrompt}>
                      <span className={styles.taskLabel}>Task 2 Essay Prompt:</span>
                      <p className={styles.promptText}>
                        Some people believe that protecting the environment is the responsibility of governments, 
                        while others think individuals should take action. Discuss both views and give your opinion.
                      </p>
                    </div>
                    <button className={styles.startWritingButton} onClick={handleStartWriting}>
                      <span className={styles.writeIcon}>✍️</span>
                      Click to Start Writing Demo
                    </button>
                  </>
                )}

                {/* Writing State */}
                {writingStep === 'writing' && (
                  <>
                    <div className={styles.writingStatus}>
                      <span className={styles.writingDot}></span>
                      <span>Writing in progress...</span>
                    </div>
                    <div className={styles.essayEditor}>
                      <div className={styles.essayContent}>
                        {writtenText}
                        <span className={styles.typingCursor}>|</span>
                      </div>
                    </div>
                    <div className={styles.wordCount}>
                      Word count: {writtenText.split(' ').filter(w => w).length} words
                    </div>
                  </>
                )}

                {/* Analyzing State */}
                {writingStep === 'analyzing' && (
                  <>
                    <div className={styles.essayEditor}>
                      <div className={styles.essayContent}>
                        {writtenText}
                      </div>
                    </div>
                    <div className={styles.analyzingStatus}>
                      <span className={styles.spinner}></span>
                      <span>Analyzing essay for grammar, vocabulary, coherence, and task achievement...</span>
                    </div>
                  </>
                )}

                {/* Complete State */}
                {writingStep === 'complete' && (
                  <>
                    <div className={styles.essayBox}>
                      <span className={styles.taskLabel}>Your Essay:</span>
                      <div className={styles.essayText}>
                        <p>
                          The <span className={styles.highlight} data-tip="Excellent word choice">environment</span> is one of the most <span className={styles.highlight} data-tip="Strong vocabulary">pressing</span> issues facing humanity today. Climate change, <span className={styles.highlight} data-tip="Good examples">pollution</span>, and deforestation are threatening our planet's future. It is <span className={styles.highlight} data-tip="Clear stance">crucial</span> that we take immediate action to protect our natural resources and ecosystems.
                        </p>
                      </div>
                    </div>
                    <div className={styles.aiSuggestions}>
                      <div className={styles.suggestion}>
                        <span className={styles.suggestionIcon}>✓</span>
                        <span className={styles.suggestionText}>Excellent: Strong topic sentence with clear position</span>
                      </div>
                      <div className={styles.suggestion}>
                        <span className={styles.suggestionIcon}>✓</span>
                        <span className={styles.suggestionText}>Good: Relevant examples (climate change, pollution)</span>
                      </div>
                      <div className={styles.suggestion}>
                        <span className={styles.suggestionIcon}>💡</span>
                        <span className={styles.suggestionText}>Tip: Add more supporting details in body paragraphs</span>
                      </div>
                    </div>
                    <div className={styles.scoreBreakdown}>
                      <div className={styles.miniScore}>
                        <span>Task Achievement</span>
                        <strong>7.5</strong>
                      </div>
                      <div className={styles.miniScore}>
                        <span>Coherence</span>
                        <strong>7.5</strong>
                      </div>
                      <div className={styles.miniScore}>
                        <span>Vocabulary</span>
                        <strong>8.0</strong>
                      </div>
                      <div className={styles.miniScore}>
                        <span>Grammar</span>
                        <strong>8.0</strong>
                      </div>
                    </div>
                    <button className={styles.tryAgainButton} onClick={resetWritingDemo}>
                      🔄 Try Again
                    </button>
                  </>
                )}
              </div>
            </div>
            {writingStep === 'idle' && (
              <Link to="/register" className={styles.demoCtaLink}>
                <Button variant="primary" size="sm">Try Full Writing Practice →</Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Chatbot Demo */}
      <section className={styles.chatbotDemoSection}>
        <h2 className={styles.sectionTitle}>24/7 AI IELTS Tutor</h2>
        <p className={styles.sectionSubtitle}>Get instant answers to your IELTS questions anytime</p>
        
        <div className={styles.chatbotDemoContainer}>
          <div className={styles.chatbotCard}>
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderLeft}>
                <span className={styles.chatbotAvatar}>🤖</span>
                <div>
                  <h4 className={styles.chatbotName}>AI IELTS Tutor</h4>
                  <span className={styles.chatStatus}>● Online</span>
                </div>
              </div>
              {chatStep === 'idle' && (
                <button className={styles.startChatButton} onClick={handleStartChat}>
                  💬 Start Demo
                </button>
              )}
              {chatStep !== 'idle' && chatStep !== 'complete' && (
                <span className={styles.typingIndicator}>typing...</span>
              )}
            </div>

            <div className={styles.chatMessagesContainer}>
              {chatStep === 'idle' && (
                <div className={styles.chatPlaceholder}>
                  <span className={styles.chatPlaceholderIcon}>💬</span>
                  <h3>Chat with Your AI IELTS Tutor</h3>
                  <p>Ask questions about Writing, Speaking, Reading, Listening, Grammar, Vocabulary, and more!</p>
                  <ul className={styles.chatFeatures}>
                    <li>✓ Instant answers to IELTS questions</li>
                    <li>✓ Personalized study tips</li>
                    <li>✓ Available 24/7</li>
                    <li>✓ Based on your progress</li>
                  </ul>
                </div>
              )}

              {chatStep !== 'idle' && (
                <div className={styles.chatMessages}>
                  {chatMessages.map((msg, index) => (
                    <div key={index} className={msg.role === 'user' ? styles.userMessage : styles.aiMessage}>
                      {msg.role === 'assistant' && <span className={styles.messageAvatar}>🤖</span>}
                      <div className={styles.messageContent}>
                        {msg.content.split('\n').map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                      {msg.role === 'user' && <span className={styles.messageAvatar}>👤</span>}
                    </div>
                  ))}

                  {/* Current typing message */}
                  {currentMessage && (
                    <div className={chatStep === 'user-typing' ? styles.userMessage : styles.aiMessage}>
                      {chatStep === 'ai-responding' && <span className={styles.messageAvatar}>🤖</span>}
                      <div className={styles.messageContent}>
                        {currentMessage.split('\n').map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                        <span className={styles.typingCursor}>|</span>
                      </div>
                      {chatStep === 'user-typing' && <span className={styles.messageAvatar}>👤</span>}
                    </div>
                  )}

                  {/* AI thinking state */}
                  {chatStep === 'ai-thinking' && (
                    <div className={styles.aiMessage}>
                      <span className={styles.messageAvatar}>🤖</span>
                      <div className={styles.thinkingDots}>
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {chatStep === 'complete' && (
              <div className={styles.chatActions}>
                <button className={styles.tryAgainButton} onClick={resetChatDemo}>
                  🔄 Try Again
                </button>
                <Link to="/register">
                  <Button variant="primary" size="sm">Start Real Conversation →</Button>
                </Link>
              </div>
            )}

            {chatStep === 'idle' && (
              <div className={styles.quickActions}>
                <span className={styles.quickActionsLabel}>Quick questions:</span>
                <div className={styles.quickActionButtons}>
                  <button>📝 Writing Tips</button>
                  <button>🗣️ Speaking Practice</button>
                  <button>📚 Vocabulary Help</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={styles.testimonials}>
        <h2 className={styles.sectionTitle}>Success Stories</h2>
        <div className={styles.testimonialGrid}>
          {testimonials.map((testimonial, index) => (
            <div key={index} className={styles.testimonialCard}>
              <div className={styles.testimonialRating}>
                {'⭐'.repeat(5)}
              </div>
              <p className={styles.testimonialText}>"{testimonial.text}"</p>
              <div className={styles.testimonialAuthor}>
                <div className={styles.testimonialAvatar}>{testimonial.avatar}</div>
                <div>
                  <div className={styles.testimonialName}>{testimonial.name}</div>
                  <div className={styles.testimonialScore}>Band Score: {testimonial.score}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.finalCta}>
        <div className={styles.finalCtaContent}>
          <h2 className={styles.finalCtaTitle}>Ready to Achieve Your Target Band Score?</h2>
          <p className={styles.finalCtaSubtitle}>
            Join thousands of successful IELTS candidates. Start your journey today for free!
          </p>
          <Link to="/register">
            <Button variant="primary" size="lg">
              Get Started Now - It's Free
              <span className={styles.arrow}>→</span>
            </Button>
          </Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <span className={styles.logoIcon}>🎓</span>
            <span>IELTS Prep Platform</span>
          </div>
          <p>© 2026 IELTS Prep Platform. Empowering learners worldwide.</p>
        </div>
      </footer>
    </div>
  )
}

const demoFeatures = [
  {
    icon: '🎤',
    title: 'AI Voice Analysis',
    description: 'Real-time pronunciation feedback and fluency scoring',
    visual: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: 1, height: '6px', background: '#10B981', borderRadius: '3px' }}></div>
          <span style={{ fontSize: '12px' }}>Fluency: 85%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: 1, height: '6px', background: '#3B82F6', borderRadius: '3px', width: '90%' }}></div>
          <span style={{ fontSize: '12px' }}>Pronunciation: 90%</span>
        </div>
      </div>
    )
  },
  {
    icon: '✍️',
    title: 'Smart Writing Assistant',
    description: 'Grammar, vocabulary, and coherence suggestions',
    visual: (
      <div style={{ marginTop: '16px', padding: '12px', background: '#F3F4F6', borderRadius: '8px', fontSize: '13px' }}>
        <p style={{ margin: 0, color: '#4B5563' }}>
          "The <span style={{ background: '#FEF3C7', padding: '2px 4px', borderRadius: '3px' }}>enviroment</span> is important..."
        </p>
        <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#059669' }}>
          ✓ Suggested: "environment"
        </p>
      </div>
    )
  },
  {
    icon: '📊',
    title: 'Progress Analytics',
    description: 'Track your improvement with detailed insights',
    visual: (
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-around' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6366F1' }}>7.5</div>
          <div style={{ fontSize: '11px', color: '#6B7280' }}>Current Band</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981' }}>+1.5</div>
          <div style={{ fontSize: '11px', color: '#6B7280' }}>Improvement</div>
        </div>
      </div>
    )
  },
  {
    icon: '🤖',
    title: '24/7 AI Tutor',
    description: 'Get instant answers to your IELTS questions',
    visual: (
      <div style={{ marginTop: '16px' }}>
        <div style={{ padding: '8px 12px', background: '#EFF6FF', borderRadius: '8px', marginBottom: '8px', fontSize: '12px' }}>
          How to improve Task 2?
        </div>
        <div style={{ padding: '8px 12px', background: '#F3F4F6', borderRadius: '8px', fontSize: '12px' }}>
          Focus on: 1) Clear thesis 2) Examples 3) Cohesion...
        </div>
      </div>
    )
  }
]

const modules = [
  {
    icon: '📖',
    title: 'Reading',
    description: 'Master different question types with timed practice and strategies',
    lessons: 25,
    duration: '6 hours',
    completion: 78
  },
  {
    icon: '🎧',
    title: 'Listening',
    description: 'Improve comprehension with authentic audio materials',
    lessons: 20,
    duration: '5 hours',
    completion: 82
  },
  {
    icon: '✍️',
    title: 'Writing',
    description: 'Learn Task 1 & 2 with AI feedback on every essay',
    lessons: 15,
    duration: '8 hours',
    completion: 65
  },
  {
    icon: '🎤',
    title: 'Speaking',
    description: 'Practice all three parts with AI voice analysis',
    lessons: 18,
    duration: '4 hours',
    completion: 71
  }
]

const features = [
  {
    icon: '🤖',
    title: 'AI-Powered Feedback',
    description: 'Get instant, personalized feedback on your speaking and writing',
    badge: 'Most Popular'
  },
  {
    icon: '🎯',
    title: 'Adaptive Learning',
    description: 'Smart algorithms that adapt to your level and create custom study plans'
  },
  {
    icon: '🎮',
    title: 'Gamified Experience',
    description: 'Earn streaks, badges, and level up while preparing for your exam',
    badge: 'Fun'
  },
  {
    icon: '📊',
    title: 'Progress Tracking',
    description: 'Visualize your improvement with detailed analytics and insights'
  },
  {
    icon: '🎤',
    title: 'Voice Practice',
    description: 'Practice speaking with voice recognition and pronunciation feedback'
  },
  {
    icon: '💬',
    title: '24/7 AI Chatbot',
    description: 'Get help anytime with our intelligent assistant',
    badge: 'New'
  },
]

const videoFeatures = [
  {
    icon: '🎤',
    title: 'AI Speaking Practice',
    description: 'See how our voice recognition technology analyzes your pronunciation and fluency in real-time',
    duration: '2:45',
    tag: 'Speaking',
    views: '12.5K'
  },
  {
    icon: '🎧',
    title: 'Interactive Listening',
    description: 'Experience adaptive listening exercises with instant feedback and detailed explanations',
    duration: '3:20',
    tag: 'Listening',
    views: '10.2K'
  },
  {
    icon: '✍️',
    title: 'Smart Writing Feedback',
    description: 'Watch AI analyze essays for grammar, vocabulary, coherence, and task achievement',
    duration: '4:15',
    tag: 'Writing',
    views: '15.8K'
  },
  {
    icon: '💬',
    title: '24/7 AI Chatbot Assistant',
    description: 'Discover how our intelligent chatbot answers IELTS questions and provides study guidance',
    duration: '2:10',
    tag: 'Chatbot',
    views: '8.9K'
  }
]

const testimonials = [
  {
    text: 'This platform helped me jump from 6.5 to 8.0 in just 2 months! The AI feedback was incredibly accurate.',
    name: 'Sarah Johnson',
    avatar: '👩‍🎓',
    score: '8.0'
  },
  {
    text: 'The speaking practice with AI is a game-changer. I felt so much more confident in my actual exam.',
    name: 'Mohammed Ali',
    avatar: '👨‍💼',
    score: '7.5'
  },
  {
    text: 'Best IELTS prep platform I\'ve used. The gamification keeps me motivated every single day!',
    name: 'Priya Sharma',
    avatar: '👩‍💻',
    score: '8.5'
  }
]

export default Home
