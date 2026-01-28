import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Videos.module.css'

function Videos() {
  const [videos, setVideos] = useState([])
  const [filteredVideos, setFilteredVideos] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadVideos()
  }, [])

  useEffect(() => {
    filterVideos()
  }, [activeFilter, videos])

  const loadVideos = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const response = await fetch('http://localhost:8000/api/v1/videos/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setVideos(data)
      }
    } catch (error) {
      console.error('Failed to load videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterVideos = () => {
    if (activeFilter === 'all') {
      setFilteredVideos(videos)
    } else if (activeFilter === 'long') {
      setFilteredVideos(videos.filter(v => v.video_type === 'long'))
    } else if (activeFilter === 'short') {
      setFilteredVideos(videos.filter(v => v.video_type === 'short'))
    } else {
      setFilteredVideos(videos.filter(v => v.module === activeFilter))
    }
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleVideoClick = (video) => {
    if (!video.is_unlocked && video.video_type === 'long') {
      showToast(`🔒 Complete 1 lesson in ${video.module} module to unlock this video!`, 'warning')
      setTimeout(() => navigate(`/${video.module}`), 1500)
      return
    }
    navigate(`/videos/${video.id}`)
  }

  const longVideos = filteredVideos.filter(v => v.video_type === 'long')
  const shortVideos = filteredVideos.filter(v => v.video_type === 'short')

  if (loading) {
    return (
      <div className={styles.videosPage}>
        <div className={styles.header}>
          <h1>Loading videos...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.videosPage}>
      <div className={styles.header}>
        <h1>📹 Video Library</h1>
        <p>Watch expert tutorials and tips to boost your IELTS preparation</p>
      </div>

      <div className={styles.filters}>
        <button
          className={`${styles.filterButton} ${activeFilter === 'all' ? styles.active : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All Videos
        </button>
        <button
          className={`${styles.filterButton} ${activeFilter === 'long' ? styles.active : ''}`}
          onClick={() => setActiveFilter('long')}
        >
          📺 Full Length
        </button>
        <button
          className={`${styles.filterButton} ${activeFilter === 'short' ? styles.active : ''}`}
          onClick={() => setActiveFilter('short')}
        >
          ⚡ Quick Tips
        </button>
        <button
          className={`${styles.filterButton} ${activeFilter === 'reading' ? styles.active : ''}`}
          onClick={() => setActiveFilter('reading')}
        >
          📖 Reading
        </button>
        <button
          className={`${styles.filterButton} ${activeFilter === 'listening' ? styles.active : ''}`}
          onClick={() => setActiveFilter('listening')}
        >
          🎧 Listening
        </button>
        <button
          className={`${styles.filterButton} ${activeFilter === 'writing' ? styles.active : ''}`}
          onClick={() => setActiveFilter('writing')}
        >
          ✍️ Writing
        </button>
        <button
          className={`${styles.filterButton} ${activeFilter === 'speaking' ? styles.active : ''}`}
          onClick={() => setActiveFilter('speaking')}
        >
          🗣️ Speaking
        </button>
      </div>

      <div className={styles.content}>
        {longVideos.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>📺</span>
              <h2>Full Length Videos (5 min)</h2>
            </div>
            <div className={styles.videosGrid}>
              {longVideos.map(video => (
                <div
                  key={video.id}
                  className={styles.videoCard}
                  onClick={() => handleVideoClick(video)}
                >
                  <div 
                    className={styles.thumbnail}
                    style={{
                      backgroundImage: `url(https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg)`
                    }}
                  >
                    {video.watched_percentage >= 95 && (
                      <div className={styles.completedBadge}>
                        ✓ COMPLETED
                      </div>
                    )}
                    {!video.is_unlocked && (
                      <div className={styles.lockedBadge}>
                        🔒 LOCKED
                      </div>
                    )}
                    <div className={styles.thumbnailOverlay}>
                      <div className={styles.playIcon}>▶</div>
                    </div>
                    <div className={styles.duration}>
                      {formatDuration(video.duration_seconds)}
                    </div>
                    {video.watched_percentage > 0 && video.watched_percentage < 95 && (
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${video.watched_percentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className={styles.videoInfo}>
                    <h3 className={styles.videoTitle}>{video.title}</h3>
                    <p className={styles.videoDescription}>{video.description}</p>
                    <div className={styles.videoMeta}>
                      <span className={`${styles.tag} ${styles.long}`}>Full Length</span>
                      <span className={styles.tag}>{video.module.toUpperCase()}</span>
                      {video.difficulty && (
                        <span className={styles.tag}>{video.difficulty}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {shortVideos.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>⚡</span>
              <h2>Quick Tips (Under 1 min)</h2>
            </div>
            <div className={styles.reelsGrid}>
              {shortVideos.map(video => (
                <div
                  key={video.id}
                  className={styles.reelCard}
                  onClick={() => handleVideoClick(video)}
                >
                  <div 
                    className={styles.reelThumbnail}
                    style={{
                      backgroundImage: `url(https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg)`
                    }}
                  >
                    {video.watched_percentage >= 95 && (
                      <div className={styles.reelCompletedBadge}>
                        ✓
                      </div>
                    )}
                    <div className={styles.reelOverlay}>
                      <div className={styles.reelPlayIcon}>▶</div>
                    </div>
                    <div className={styles.reelDuration}>
                      {video.duration_seconds}s
                    </div>
                    {video.watched_percentage > 0 && video.watched_percentage < 95 && (
                      <div className={styles.reelProgress}>
                        <div
                          className={styles.reelProgressFill}
                          style={{ height: `${video.watched_percentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className={styles.reelInfo}>
                    <h4 className={styles.reelTitle}>{video.title.replace('Quick Tip: ', '')}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredVideos.length === 0 && (
          <div className={styles.emptyState}>
            <h3>No videos found</h3>
            <p>Try changing your filter selection</p>
          </div>
        )}
      </div>

      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default Videos
