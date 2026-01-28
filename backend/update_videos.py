import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.youtube_video import YouTubeVideo

def update_videos():
    """Update videos with real YouTube IDs and fix durations."""
    db = SessionLocal()
    
    try:
        # Real YouTube video IDs for IELTS preparation
        video_updates = {
            "Reading Strategies Deep Dive": {
                "youtube_id": "LgE9Ay48das",  # IELTS Reading (5:11)
                "duration_seconds": 311
            },
            "Listening Techniques Masterclass": {
                "youtube_id": "i2-NCNijZ2U",  # IELTS Listening (7:10)
                "duration_seconds": 430
            },
            "Writing Task 1 Complete Guide": {
                "youtube_id": "cLVKHRU9k_g",  # IELTS Writing Task 1 (5:36)
                "duration_seconds": 336
            },
            "Writing Task 2 Complete Guide": {
                "youtube_id": "RBwKVy6apcY",  # IELTS Writing Task 2 (5:21)
                "duration_seconds": 321
            },
            "Speaking Confidence Builder": {
                "youtube_id": "i5aVDcqBaek",  # IELTS Speaking (5:09)
                "duration_seconds": 309
            },
            # Short videos (under 1 minute)
            "Quick Tip: Time Management": {
                "youtube_id": "8DYPkNeyMWo",  # Time Management (0:59)
                "duration_seconds": 59
            },
            "Quick Tip: Handling Nervousness": {
                "youtube_id": "Sb63l0EWlx0",  # Handling Nervousness (0:45)
                "duration_seconds": 45
            },
            "Quick Tip: Common Mistakes": {
                "youtube_id": "YIEHQ-zqC14",  # Common Mistakes (0:58)
                "duration_seconds": 58
            },
            "Quick Tip: Vocabulary Boosters": {
                "youtube_id": "4fpHd5foKJQ",  # Vocabulary Booster (0:40)
                "duration_seconds": 40
            },
            "Quick Tip: Test Day Checklist": {
                "youtube_id": "qTerWx8-vQ4",  # Test Day Checklist (0:55)
                "duration_seconds": 55
            }
        }
        
        print("Updating videos with real YouTube IDs...")
        
        for title, data in video_updates.items():
            video = db.query(YouTubeVideo).filter(YouTubeVideo.title == title).first()
            if video:
                video.youtube_id = data["youtube_id"]
                video.duration_seconds = data["duration_seconds"]
                print(f"✅ Updated: {title} ({data['duration_seconds']}s)")
        
        db.commit()
        print("\n✅ All videos updated successfully!")
        
        # Verify
        videos = db.query(YouTubeVideo).all()
        print(f"\n📹 Total videos: {len(videos)}")
        print("\nShort videos:")
        for v in videos:
            if v.video_type == "short":
                print(f"  - {v.title}: {v.duration_seconds}s (ID: {v.youtube_id})")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_videos()
