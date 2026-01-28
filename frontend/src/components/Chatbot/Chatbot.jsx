import React, { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import styles from './Chatbot.module.css'

const QUICK_ACTIONS = [
  { id: 1, label: '📝 Writing Tips', prompt: 'Give me tips for IELTS Writing Task 2' },
  { id: 2, label: '🗣️ Speaking Practice', prompt: 'Suggest IELTS Speaking Part 2 topics' },
  { id: 3, label: '📚 Vocabulary', prompt: 'Teach me useful vocabulary for IELTS' },
  { id: 4, label: '📖 Grammar Help', prompt: 'Explain common grammar mistakes in IELTS' },
]

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const [userContext, setUserContext] = useState(null)
  const [followUpSuggestions, setFollowUpSuggestions] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [conversations, setConversations] = useState([])
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load user progress data and initial greeting
  useEffect(() => {
    const loadUserContext = async () => {
      if (isOpen && messages.length === 0) {
        try {
          const token = localStorage.getItem('token')
          
          // Fetch user data
          const userResponse = await fetch('http://localhost:8000/api/v1/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const userData = await userResponse.json()
          
          // Fetch user progress
          const progressResponse = await fetch('http://localhost:8000/api/v1/progress/', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const progressData = await progressResponse.json()
          
          // Store context for AI
          setUserContext({
            name: userData.full_name || 'Student',
            target_band: userData.target_band_score || 7,
            test_date: userData.test_date,
            completed_lessons: progressData.filter(p => p.completed).length,
            total_lessons: progressData.length,
            modules: progressData.reduce((acc, p) => {
              if (!acc[p.module]) acc[p.module] = { total: 0, completed: 0 }
              acc[p.module].total++
              if (p.completed) acc[p.module].completed++
              return acc
            }, {})
          })
          
          // Create personalized greeting
          const completedCount = progressData.filter(p => p.completed).length
          const greeting = `👋 Hi ${userData.full_name || 'there'}! I'm your AI IELTS tutor.

📊 **Your Progress:**
- Completed ${completedCount}/${progressData.length} lessons
- Target Band: ${userData.target_band_score || 7}
${userData.test_date ? `- Test Date: ${new Date(userData.test_date).toLocaleDateString()}` : ''}

💡 **I can help you with:**
- **Writing** - Essay tips, structure, vocabulary
- **Speaking** - Practice topics, sample answers
- **Reading & Listening** - Strategies and tips
- **Grammar** - Explanations and corrections
- **Personalized Study Plans** based on your progress

What would you like to work on today?`
          
          setMessages([{
            role: 'assistant',
            content: greeting,
            created_at: new Date().toISOString()
          }])
        } catch (error) {
          console.error('Failed to load user context:', error)
          // Fallback greeting
          setMessages([{
            role: 'assistant',
            content: `👋 Hi! I'm your IELTS tutor. How can I help you today?`,
            created_at: new Date().toISOString()
          }])
        }
      }
    }
    
    loadUserContext()
  }, [isOpen])

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return

    // Add user message to UI
    const userMessage = {
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/v1/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: messageText,
          conversation_id: conversationId,
          user_context: userContext
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      // Set conversation ID for follow-up messages
      if (!conversationId) {
        setConversationId(data.conversation_id)
      }

      // Add AI response to UI
      const aiMessage = {
        role: 'assistant',
        content: data.response,
        created_at: data.created_at
      }
      setMessages(prev => [...prev, aiMessage])
      
      // Generate follow-up suggestions based on response
      const generateFollowUps = (response) => {
        if (response.includes('Writing')) {
          return ['Show me a sample essay', 'Explain essay structure', 'Common writing mistakes']
        } else if (response.includes('Speaking')) {
          return ['Suggest speaking topics', 'How to improve fluency?', 'Common speaking errors']
        } else if (response.includes('Reading')) {
          return ['Reading strategies', 'How to improve speed?', 'Practice tips']
        } else if (response.includes('Listening')) {
          return ['Listening tips', 'How to take notes?', 'Practice resources']
        } else if (response.includes('Grammar')) {
          return ['Common grammar mistakes', 'Explain tenses', 'Sentence structure tips']
        } else {
          return ['Create study plan', 'What to focus on next?', 'How to improve faster?']
        }
      }
      
      setFollowUpSuggestions(generateFollowUps(data.response))

    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  const handleQuickAction = (prompt) => {
    sendMessage(prompt)
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  const handleNewChat = () => {
    setMessages([])
    setConversationId(null)
    setFollowUpSuggestions([])
    // Reload with fresh context
    if (isOpen) {
      setIsOpen(false)
      setTimeout(() => setIsOpen(true), 100)
    }
  }
  
  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/v1/chat/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setConversations(data)
      setShowHistory(true)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }
  
  const loadConversation = async (convId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/v1/chat/conversations/${convId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      const formattedMessages = []
      data.forEach(msg => {
        formattedMessages.push({ role: 'user', content: msg.message, created_at: msg.created_at })
        formattedMessages.push({ role: 'assistant', content: msg.response, created_at: msg.created_at })
      })
      
      setMessages(formattedMessages)
      setConversationId(convId)
      setShowHistory(false)
    } catch (error) {
      console.error('Failed to load conversation:', error)
    }
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button 
          className={styles.floatingButton}
          onClick={toggleChat}
          aria-label="Open AI Tutor Chat"
        >
          <span className={styles.icon}>💬</span>
          <span className={styles.pulse}></span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`${styles.chatWindow} ${isMaximized ? styles.maximized : ''}`}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <span className={styles.headerIcon}>🤖</span>
              <div>
                <h3 className={styles.headerTitle}>AI IELTS Tutor</h3>
                <p className={styles.headerSubtitle}>Always here to help</p>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button 
                className={styles.iconButton}
                onClick={loadConversations}
                title="Chat History"
              >
                📜
              </button>
              <button 
                className={styles.iconButton}
                onClick={handleNewChat}
                title="New Chat"
              >
                ➕
              </button>
              <button 
                className={styles.iconButton}
                onClick={() => setIsMaximized(!isMaximized)}
                title={isMaximized ? "Minimize" : "Maximize"}
              >
                {isMaximized ? '🗗' : '⛶'}
              </button>
              <button 
                className={styles.iconButton}
                onClick={toggleChat}
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className={styles.messagesContainer}>
            {showHistory ? (
              <div className={styles.historyPanel}>
                <button className={styles.backButton} onClick={() => setShowHistory(false)}>
                  ← Back to Chat
                </button>
                <h3>Your Conversations</h3>
                {conversations.length === 0 ? (
                  <p className={styles.emptyHistory}>No previous conversations</p>
                ) : (
                  conversations.map(conv => (
                    <div 
                      key={conv.conversation_id} 
                      className={styles.historyItem}
                      onClick={() => loadConversation(conv.conversation_id)}
                    >
                      <div className={styles.historyTitle}>{conv.title}</div>
                      <div className={styles.historyMeta}>
                        {conv.message_count} messages • {new Date(conv.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <>
            {messages.map((message, index) => (
              <div 
                key={index}
                className={`${styles.message} ${
                  message.role === 'user' ? styles.userMessage : styles.aiMessage
                }`}
              >
                <div className={styles.messageContent}>
                  {message.role === 'assistant' ? (
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isLoading && (
              <div className={`${styles.message} ${styles.aiMessage}`}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Follow-up Suggestions */}
          {!showHistory && followUpSuggestions.length > 0 && !isLoading && (
            <div className={styles.followUpContainer}>
              <div className={styles.followUpLabel}>💡 Quick questions:</div>
              <div className={styles.followUpButtons}>
                {followUpSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className={styles.followUpButton}
                    onClick={() => sendMessage(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {messages.length <= 1 && !isLoading && (
            <div className={styles.quickActions}>
              {QUICK_ACTIONS.map(action => (
                <button
                  key={action.id}
                  className={styles.quickActionButton}
                  onClick={() => handleQuickAction(action.prompt)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form className={styles.inputContainer} onSubmit={handleSubmit}>
            <input
              type="text"
              className={styles.input}
              placeholder="Ask me anything about IELTS..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={isLoading || !inputValue.trim()}
            >
              <span className={styles.sendIcon}>📤</span>
            </button>
          </form>
        </div>
      )}
    </>
  )
}

export default Chatbot
