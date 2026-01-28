# 🗄️ IELTS Prep Platform - Database Schema Documentation

## Overview
This document provides a comprehensive overview of all database tables, their relationships, and usage patterns in the IELTS Preparation Platform.

---

## 📊 Database Tables

### 1. **users** - User Authentication & Profile
Primary table storing user account information and preferences.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Auto-incrementing user ID |
| `email` | VARCHAR | UNIQUE, NOT NULL, INDEXED | User's email (login username) |
| `hashed_password` | VARCHAR | NOT NULL | Bcrypt hashed password |
| `full_name` | VARCHAR | NULLABLE | User's display name |
| `is_active` | BOOLEAN | DEFAULT TRUE | Account active status |
| `is_superuser` | BOOLEAN | DEFAULT FALSE | Admin privileges flag |
| `target_band_score` | INTEGER | DEFAULT 7 | User's target IELTS band score (1-9) |
| `test_date` | TIMESTAMP | NULLABLE | Scheduled IELTS test date |
| `created_at` | TIMESTAMP WITH TZ | DEFAULT NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMP WITH TZ | ON UPDATE NOW() | Last profile update timestamp |

**Relationships:**
- One-to-Many with `lesson_progress`
- One-to-Many with `user_activity`
- One-to-Many with `lesson_attempts`

**Indexes:**
- Primary: `id`
- Unique: `email`

**Usage:**
- Authentication & authorization
- User profile management
- Target score and test date tracking

---

### 2. **lesson_progress** - Lesson Completion Tracking
Tracks which lessons users have completed (simple completion flag).

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Auto-incrementing progress ID |
| `user_id` | INTEGER | FOREIGN KEY (users.id), NOT NULL | Reference to user |
| `lesson_id` | VARCHAR | NOT NULL | Lesson identifier (e.g., "1", "2", "3") |
| `module` | VARCHAR | NOT NULL | Module name: reading, listening, writing, speaking |
| `completed` | BOOLEAN | DEFAULT TRUE | Completion status (always true when created) |
| `completed_at` | TIMESTAMP WITH TZ | DEFAULT NOW() | When lesson was marked complete |

**Relationships:**
- Many-to-One with `users` (user_id → users.id)

**Indexes:**
- Primary: `id`
- Composite: `(user_id, lesson_id, module)` for uniqueness checking

**Usage:**
- Simple completion tracking
- Progress calculations (X/Y lessons completed)
- Streak calculations based on completion dates
- Module-specific progress queries

**API Endpoints:**
- `POST /api/v1/lesson-progress/complete` - Mark lesson complete
- `GET /api/v1/lesson-progress/` - Get all user completions
- `GET /api/v1/lesson-progress/{module}` - Get module-specific completions

**Business Logic:**
- Prevents duplicate completions (checks existing before inserting)
- Used for dashboard statistics
- Synced with localStorage in frontend

---

### 3. **user_activity** - Activity Logging
Comprehensive activity log for admin panel analytics and user behavior tracking.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Auto-incrementing activity ID |
| `user_id` | INTEGER | FOREIGN KEY (users.id), NOT NULL | Reference to user |
| `activity_type` | VARCHAR | NOT NULL | Activity category (see types below) |
| `module` | VARCHAR | NULLABLE | Module if lesson-related |
| `lesson_id` | VARCHAR | NULLABLE | Lesson ID if applicable |
| `details` | TEXT | NULLABLE | JSON string with additional metadata |
| `created_at` | TIMESTAMP WITH TZ | DEFAULT NOW() | Activity timestamp |

**Activity Types:**
- `login` - User logged in
- `logout` - User logged out
- `lesson_start` - User started a lesson
- `lesson_complete` - User completed a lesson
- `test_start` - User started a practice test
- `test_complete` - User completed a practice test

**Relationships:**
- Many-to-One with `users` (user_id → users.id)

**Indexes:**
- Primary: `id`
- Foreign: `user_id`
- Composite: `(user_id, created_at)` for timeline queries

**Usage:**
- Admin analytics dashboard
- User behavior tracking
- Engagement metrics
- Activity timeline generation

**Details JSON Structure:**
```json
{
  "lesson": "reading-1",
  "score": 85,
  "time_spent": 1800,
  "device": "mobile",
  "ip_address": "192.168.1.1"
}
```

---

### 4. **lesson_attempts** - Detailed Performance Tracking
Comprehensive tracking of user performance within each lesson, including every answer, result, and time spent.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Auto-incrementing attempt ID |
| `user_id` | INTEGER | FOREIGN KEY (users.id), NOT NULL | Reference to user |
| `lesson_id` | VARCHAR | NOT NULL | Lesson identifier (e.g., "1", "2", "3") |
| `module` | VARCHAR | NOT NULL | Module name: reading, listening, writing, speaking |
| `exercises_attempted` | INTEGER | DEFAULT 0 | Number of exercises user tried |
| `exercises_correct` | INTEGER | DEFAULT 0 | Number of correct answers |
| `exercises_total` | INTEGER | DEFAULT 0 | Total exercises in lesson |
| `user_answers` | TEXT | NULLABLE | JSON string of user's answers |
| `exercise_results` | TEXT | NULLABLE | JSON string of correct/incorrect results |
| `time_spent_seconds` | INTEGER | DEFAULT 0 | Total time spent on lesson (seconds) |
| `started_at` | TIMESTAMP WITH TZ | DEFAULT NOW() | When attempt was started |
| `completed_at` | TIMESTAMP WITH TZ | NULLABLE | When lesson was completed |
| `last_accessed_at` | TIMESTAMP WITH TZ | DEFAULT NOW(), ON UPDATE | Last interaction timestamp |
| `is_completed` | BOOLEAN | DEFAULT FALSE | Completion status |
| `score_percentage` | INTEGER | DEFAULT 0 | Final score (0-100) |

**Relationships:**
- Many-to-One with `users` (user_id → users.id)

**Indexes:**
- Primary: `id`
- Foreign: `user_id`
- Composite: `(user_id, lesson_id, module)` for attempt queries
- Index: `is_completed` for filtering

**JSON Field Structures:**

**user_answers:**
```json
{
  "0": "option B",
  "1": "option A",
  "2": "option C"
}
```

**exercise_results:**
```json
{
  "0": true,
  "1": false,
  "2": true
}
```

**Usage:**
- Real-time performance tracking
- Detailed analytics per lesson
- Resume incomplete lessons
- Calculate accurate band scores
- Study time tracking
- Answer history for review

**API Endpoints:**
- `POST /api/v1/lesson-attempts/start` - Start new attempt
- `PUT /api/v1/lesson-attempts/{id}` - Update attempt progress
- `GET /api/v1/lesson-attempts/lesson/{module}/{lesson_id}` - Get specific attempt
- `GET /api/v1/lesson-attempts/` - Get all user attempts

**Business Logic:**
- Checks for existing incomplete attempts before creating new
- Updates `last_accessed_at` on every interaction
- Sets `completed_at` when `is_completed` becomes true
- Allows resuming incomplete lessons
- Calculates real-time accuracy: `(exercises_correct / exercises_total) * 100`

---

## 🔗 Entity Relationships

```
users (1) ──────┬──────> (*) lesson_progress
                │
                ├──────> (*) user_activity
                │
                └──────> (*) lesson_attempts
```

**Cascade Behavior:**
- Deleting a user should cascade to all related records
- Currently NOT IMPLEMENTED (manual cleanup required)
- Future: Add `ON DELETE CASCADE` to foreign keys

---

## 📈 Data Flow Patterns

### 1. **User Completes a Lesson**

```
1. Frontend: User clicks "Complete Lesson"
   ↓
2. LessonDetail.jsx: completeLesson()
   ↓
3. Update localStorage: Add lesson_id to completedLessons[]
   ↓
4. API Call 1: PUT /lesson-attempts/{id}
   - Save final score, time, answers, results
   - Set is_completed = true
   ↓
5. API Call 2: POST /lesson-progress/complete
   - Create completion record (if not exists)
   ↓
6. Backend: Track activity
   - Insert into user_activity: type="lesson_complete"
   ↓
7. Frontend: Update Dashboard
   - Reload stats from backend
   - Show updated progress
```

### 2. **Dashboard Statistics Calculation**

```
1. Dashboard loads
   ↓
2. Load localStorage completedLessons
   ↓
3. API Call 1: GET /lesson-progress/
   - Get all completions
   - Merge with localStorage
   - Deduplicate
   ↓
4. API Call 2: GET /lesson-attempts/
   - Get all completed attempts
   - Calculate real study time: SUM(time_spent_seconds)
   - Calculate accuracy: SUM(exercises_correct) / SUM(exercises_total)
   ↓
5. Calculate band score:
   - If accuracy >= 97.5%: Band 9.0
   - If accuracy >= 92.5%: Band 8.5
   - If accuracy >= 87.5%: Band 8.0
   - If accuracy >= 75%: Band 7.0
   - ... (IELTS scoring scale)
   ↓
6. Calculate streak:
   - Get unique completion dates
   - Check consecutive days
   - Break if gap > 1 day
   ↓
7. Display stats
```

### 3. **Resume Incomplete Lesson**

```
1. User enters lesson
   ↓
2. Check localStorage: Is it completed?
   ↓
3. If completed:
   - API: GET /lesson-attempts/lesson/{module}/{id}
   - Load previous answers and results
   - Display in review mode
   ↓
4. If not completed:
   - API: POST /lesson-attempts/start
   - Check for existing incomplete attempt
   - Resume if exists, create new if not
   ↓
5. As user answers:
   - PUT /lesson-attempts/{id}
   - Save answers and results in real-time
```

---

## 🎯 Performance Considerations

### Indexes for Optimization

```sql
-- User lookups by email (login)
CREATE INDEX idx_users_email ON users(email);

-- Lesson progress queries
CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_composite ON lesson_progress(user_id, module);

-- Activity timeline queries
CREATE INDEX idx_user_activity_user_time ON user_activity(user_id, created_at DESC);

-- Attempt lookups
CREATE INDEX idx_lesson_attempts_user ON lesson_attempts(user_id);
CREATE INDEX idx_lesson_attempts_lookup ON lesson_attempts(user_id, lesson_id, module);
CREATE INDEX idx_lesson_attempts_completed ON lesson_attempts(user_id, is_completed);
```

### Query Patterns

**Fast Queries:**
- Get user by email: O(1) with hash index
- Get user's completed lessons: O(log n) with user_id index
- Get specific attempt: O(1) with composite index

**Slow Queries (need optimization):**
- Get all user activities across all users (admin dashboard)
- Calculate global leaderboard rankings
- Generate engagement reports

---

## 🔒 Security Considerations

1. **Password Storage**
   - Uses bcrypt hashing (not plaintext)
   - Salt rounds: 12 (adjustable in code)

2. **SQL Injection**
   - SQLAlchemy ORM prevents injection
   - Parameterized queries only

3. **Data Privacy**
   - User answers stored as JSON (encrypted at rest if needed)
   - No PII in activity logs
   - Email is only PII field

4. **Access Control**
   - JWT tokens for authentication
   - Users can only access their own data
   - Superuser flag for admin access

---

## 📊 Storage Estimates

Assuming 1000 users completing 8 lessons each:

| Table | Rows | Avg Size/Row | Total Size |
|-------|------|--------------|------------|
| users | 1,000 | 500 bytes | ~500 KB |
| lesson_progress | 8,000 | 100 bytes | ~800 KB |
| user_activity | 50,000 | 200 bytes | ~10 MB |
| lesson_attempts | 8,000 | 2 KB | ~16 MB |
| **TOTAL** | | | **~27 MB** |

At 100,000 users: ~2.7 GB (easily manageable with PostgreSQL)

---

## 🚀 Future Enhancements

### Planned Tables

1. **badges**
   - id, name, description, icon, requirement
   - Track achievement badges

2. **user_badges**
   - user_id, badge_id, earned_at
   - Link users to earned badges

3. **study_plans**
   - user_id, target_score, test_date, plan_json
   - AI-generated personalized plans

4. **practice_tests**
   - id, module, difficulty, questions_json
   - Full practice test data

5. **test_attempts**
   - user_id, test_id, answers, score, time
   - Track practice test results

6. **ai_feedback**
   - user_id, lesson_id, feedback_type, content
   - Store AI-generated feedback

7. **chat_history**
   - user_id, message, response, timestamp
   - Chatbot conversation history

8. **youtube_progress**
   - user_id, video_id, watched_percentage, last_position
   - Track video watching progress

### Schema Migrations

Using Alembic for migrations:
```bash
# Create migration
alembic revision --autogenerate -m "Add new table"

# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## 📝 Maintenance Tasks

### Daily
- Monitor slow queries
- Check error logs
- Backup database

### Weekly
- Analyze table sizes
- Vacuum tables (PostgreSQL)
- Review unused indexes

### Monthly
- Archive old activity logs (>90 days)
- Generate usage reports
- Update statistics

---

## 🔧 Database Configuration

**Current Setup:**
- **Engine**: PostgreSQL 14+
- **Connection Pool**: 5-20 connections
- **Max Connections**: 100
- **Timeout**: 30 seconds

**Environment Variables:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/ielts_prep
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20
```

---

## 📚 References

- [SQLAlchemy ORM Documentation](https://docs.sqlalchemy.org/)
- [PostgreSQL Best Practices](https://www.postgresql.org/docs/)
- [FastAPI Database Guide](https://fastapi.tiangolo.com/tutorial/sql-databases/)

---

**Last Updated**: January 28, 2026  
**Database Version**: 1.0  
**Schema Version**: 4 tables (users, lesson_progress, user_activity, lesson_attempts)
