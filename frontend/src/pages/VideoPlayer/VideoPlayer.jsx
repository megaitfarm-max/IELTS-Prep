import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styles from './VideoPlayer.module.css'

function VideoPlayer() {
  const { videoId } = useParams()
  const [video, setVideo] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [watchedPercentage, setWatchedPercentage] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const navigate = useNavigate()
  const progressIntervalRef = useRef(null)
  const playerRef = useRef(null)
  const ytPlayerRef = useRef(null)

  useEffect(() => {
    loadVideo()
    loadRecommendations()

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      if (ytPlayerRef.current) {
        saveProgress()
      }
    }
  }, [videoId])

  useEffect(() => {
    if (video) {
      loadYouTubeAPI()
    }
  }, [video])

  const loadYouTubeAPI = () => {
    // Load YouTube iframe API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = initializePlayer
    } else {
      initializePlayer()
    }
  }

  const initializePlayer = () => {
    if (!video || !window.YT || !window.YT.Player) return

    setTimeout(() => {
      const iframe = document.getElementById(`youtube-player-${video.id}`)
      if (iframe && !ytPlayerRef.current) {
        try {
          ytPlayerRef.current = new window.YT.Player(iframe, {
            events: {
              onReady: onPlayerReady,
              onStateChange: onPlayerStateChange
            }
          })
        } catch (error) {
          console.error('Error initializing YouTube player:', error)
        }
      }
    }, 500)
  }

  const onPlayerReady = (event) => {
    console.log('YouTube player ready')
    // Seek to last watched position if available
    if (video.last_position_seconds && video.last_position_seconds > 0) {
      event.target.seekTo(video.last_position_seconds, true)
    }
  }

  const onPlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      console.log('Video is playing, starting progress tracking')
      // Start tracking progress when video is playing
      if (!progressIntervalRef.current) {
        progressIntervalRef.current = setInterval(() => {
          trackProgress()
        }, 2000) // Check every 2 seconds
      }
      trackProgress() // Track immediately
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      console.log('Video paused, saving progress')
      trackProgress()
      saveProgress()
    } else if (event.data === window.YT.PlayerState.ENDED) {
      console.log('Video ended')
      trackProgress()
      setWatchedPercentage(100) // Mark as 100% when finished
      saveProgress()
    }
  }

  const trackProgress = () => {
    if (!ytPlayerRef.current || !video) return

    try {
      if (typeof ytPlayerRef.current.getCurrentTime === 'function') {
        const current = ytPlayerRef.current.getCurrentTime()
        const duration = video.duration_seconds
        const percentage = Math.min(100, Math.max(0, (current / duration) * 100))
        
        console.log(`Progress: ${current}s / ${duration}s = ${percentage.toFixed(1)}%`)
        
        setCurrentTime(current)
        setWatchedPercentage(percentage)
      }
    } catch (error) {
      console.error('Error tracking progress:', error)
    }
  }

  const loadVideo = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/api/v1/videos/${videoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setVideo(data)
        setWatchedPercentage(data.watched_percentage || 0)
      }
    } catch (error) {
      console.error('Failed to load video:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRecommendations = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/api/v1/videos/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        // Get random 3 videos excluding current
        const filtered = data.filter(v => v.id !== parseInt(videoId))
        const shuffled = filtered.sort(() => 0.5 - Math.random())
        setRecommendations(shuffled.slice(0, 3))
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error)
    }
  }

  const saveProgress = async () => {
    if (!video || watchedPercentage === 0) return

    try {
      const token = localStorage.getItem('token')
      
      const progressData = {
        video_id: parseInt(videoId),
        last_position_seconds: Math.floor(currentTime),
        watched_percentage: Math.floor(watchedPercentage)
      }

      console.log('Saving progress:', progressData)

      const response = await fetch('http://localhost:8000/api/v1/videos/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(progressData)
      })

      if (response.ok) {
        console.log('Progress saved successfully')
      }
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }

  const handleUnlockClick = () => {
    navigate(`/${video.module}`)
  }

  const handleRecommendationClick = (recVideoId) => {
    navigate(`/videos/${recVideoId}`)
    window.scrollTo(0, 0)
  }

  if (loading || !video) {
    return (
      <div className={styles.videoPlayerPage}>
        <div className={styles.container}>
          <p>Loading video...</p>
        </div>
      </div>
    )
  }

  const showLockedOverlay = !video.is_unlocked && video.video_type === 'long'
  const embedUrl = `https://www.youtube.com/embed/${video.youtube_id}?enablejsapi=1&autoplay=0&rel=0`

  return (
    <div className={styles.videoPlayerPage}>
      <div className={styles.container}>
        <button className={styles.backButton} onClick={() => navigate('/videos')}>
          ← Back to Videos
        </button>

        <div className={styles.playerContainer}>
          <div className={styles.videoWrapper} ref={playerRef}>
            <iframe
              id={`youtube-player-${video.id}`}
              src={embedUrl}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            
            {showLockedOverlay && (
              <div className={styles.lockedOverlay}>
                <div className={styles.unlockMessage}>
                  <div className={styles.lockIcon}>🔒</div>
                  <h3>Unlock Full Video</h3>
                  <p>Complete just 1 lesson in {video.module} module to unlock</p>
                  <button className={styles.unlockButton} onClick={handleUnlockClick}>
                    Go to {video.module.charAt(0).toUpperCase() + video.module.slice(1)} Lessons
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className={styles.videoInfo}>
            <div className={styles.videoHeader}>
              <h1 className={styles.videoTitle}>{video.title}</h1>
              {video.watched_percentage >= 95 && (
                <div className={styles.completedBadge}>
                  ✓ Completed
                </div>
              )}
            </div>

            <div className={styles.tags}>
              <span className={styles.tag}>
                {video.video_type === 'long' ? '📺 Full Length' : '⚡ Quick Tip'}
              </span>
              <span className={styles.tag}>
                {video.module.toUpperCase()}
              </span>
              {video.difficulty && (
                <span className={styles.tag}>{video.difficulty}</span>
              )}
              <span className={styles.tag}>
                {Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toString().padStart(2, '0')}
              </span>
            </div>

            <p className={styles.videoDescription}>{video.description}</p>

            <div className={styles.progressSection}>
              <div className={styles.progressHeader}>
                <span className={styles.progressLabel}>Your Progress</span>
                <span className={styles.progressPercentage}>{Math.round(watchedPercentage)}%</span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${watchedPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className={styles.recommendations}>
            <h2>Recommended Videos</h2>
            <div className={styles.recommendationsGrid}>
              {recommendations.map(rec => (
                <div
                  key={rec.id}
                  className={styles.recommendationCard}
                  onClick={() => handleRecommendationClick(rec.id)}
                >
                  <h3>{rec.title}</h3>
                  <p>{rec.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VideoPlayer
