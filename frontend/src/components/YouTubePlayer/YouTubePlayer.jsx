import React from 'react'
import styles from './YouTubePlayer.module.css'

const YouTubePlayer = ({ videoId, title = "IELTS Listening Audio" }) => {
  if (!videoId) return null
  
  // Extract video ID from URL if full URL is provided
  const extractVideoId = (url) => {
    if (!url) return null
    
    // If it's already just an ID
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      return url
    }
    
    // Extract from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&]+)/,
      /(?:youtube\.com\/embed\/)([^?]+)/,
      /(?:youtu\.be\/)([^?]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    
    return null
  }
  
  const id = extractVideoId(videoId)
  
  if (!id) {
    console.error('Invalid YouTube video ID or URL:', videoId)
    return null
  }
  
  return (
    <div className={styles.playerContainer}>
      <div className={styles.playerWrapper}>
        <iframe
          className={styles.iframe}
          src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  )
}

export default YouTubePlayer
