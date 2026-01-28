# 🏗️ Architecture Documentation

## System Overview

The IELTS Prep Platform is a full-stack web application built with modern technologies, focusing on scalability, maintainability, and user experience.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React 18 + Vite                                      │   │
│  │  - React Router (Navigation)                          │   │
│  │  - Context API + React Query (State)                  │   │
│  │  - CSS Modules (Styling)                              │   │
│  │  - Recharts (Visualization)                           │   │
│  │  - Web Speech API (Voice)                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTPS/WSS
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                              │
│                    (FastAPI Routes)                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Backend Services                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ Auth Service │  │ User Service │  │ Content Service │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  AI Service  │  │ Voice Service│  │ Progress Track  │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  PostgreSQL  │  │    Redis     │  │  File Storage   │   │
│  │  (Primary)   │  │   (Cache)    │  │  (S3/Local)     │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   External Services                           │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   Ollama     │  │  Email SMTP  │  │  Analytics      │   │
│  │  (AI Model)  │  │   Service    │  │   Service       │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

#### Core Framework
- **React 18.3**: Modern UI library with concurrent features
- **Vite 5**: Lightning-fast build tool and dev server
- **React Router v6**: Client-side routing

#### State Management
- **Context API**: Global state (auth, theme, user)
- **React Query (TanStack Query)**: Server state management, caching
- **Local Storage**: Persistence for preferences and progress

#### Styling
- **CSS Modules**: Scoped, maintainable styles
- **Design Tokens**: Centralized design system variables
- **No inline styles**: All styles in separate CSS files

#### Key Libraries
- **Recharts**: Data visualization and progress charts
- **React Hook Form**: Form handling and validation
- **Axios**: HTTP client with interceptors
- **date-fns**: Date manipulation
- **react-hot-toast**: Toast notifications

### Backend

#### Core Framework
- **FastAPI**: Modern, fast Python web framework
- **Pydantic**: Data validation and settings management
- **SQLAlchemy 2.0**: ORM for database operations
- **Alembic**: Database migrations

#### Database
- **PostgreSQL 15+**: Primary database
  - User accounts and authentication
  - Learning progress and analytics
  - Content storage
- **Redis**: Caching layer
  - Session management
  - Rate limiting
  - Real-time features

#### AI Integration
- **Ollama**: Local AI model inference
  - Llama 3 for chatbot
  - Custom fine-tuned models for IELTS feedback
- **LangChain**: AI orchestration framework
- **ChromaDB**: Vector database for semantic search

#### Authentication & Security
- **JWT tokens**: Stateless authentication
- **bcrypt**: Password hashing
- **CORS**: Cross-origin resource sharing
- **Rate limiting**: API protection

## Project Structure

### Frontend Structure

```
frontend/
├── public/                      # Static files
│   ├── fonts/                   # Custom fonts
│   ├── icons/                   # SVG icons
│   └── images/                  # Static images
├── src/
│   ├── assets/                  # Dynamic assets
│   │   ├── animations/          # Lottie files
│   │   └── sounds/              # Audio files
│   ├── components/              # Reusable components
│   │   ├── common/              # Generic components
│   │   │   ├── Button/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Button.module.css
│   │   │   │   ├── Button.test.jsx
│   │   │   │   └── index.js
│   │   │   ├── Card/
│   │   │   ├── Input/
│   │   │   └── Modal/
│   │   ├── layout/              # Layout components
│   │   │   ├── Header/
│   │   │   ├── Sidebar/
│   │   │   ├── Footer/
│   │   │   └── MainLayout/
│   │   ├── modules/             # Module-specific components
│   │   │   ├── Reading/
│   │   │   ├── Listening/
│   │   │   ├── Writing/
│   │   │   └── Speaking/
│   │   └── features/            # Feature components
│   │       ├── ProgressTracker/
│   │       ├── Chatbot/
│   │       └── VoiceRecorder/
│   ├── pages/                   # Page components
│   │   ├── Home/
│   │   ├── Login/
│   │   ├── Dashboard/
│   │   ├── LessonPlan/
│   │   ├── MockTests/
│   │   └── Profile/
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useProgress.js
│   │   └── useVoiceRecorder.js
│   ├── services/                # API services
│   │   ├── api.js               # Axios instance
│   │   ├── auth.service.js
│   │   ├── lesson.service.js
│   │   └── ai.service.js
│   ├── context/                 # React Context
│   │   ├── AuthContext.jsx
│   │   ├── ThemeContext.jsx
│   │   └── ProgressContext.jsx
│   ├── utils/                   # Utility functions
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   └── constants.js
│   ├── styles/                  # Global styles
│   │   ├── tokens.css           # Design tokens
│   │   ├── global.css           # Global styles
│   │   ├── animations.css       # Keyframe animations
│   │   └── utilities.css        # Utility classes
│   ├── App.jsx                  # Root component
│   ├── main.jsx                 # Entry point
│   └── router.jsx               # Route configuration
├── .env.example                 # Environment variables template
├── vite.config.js               # Vite configuration
├── package.json
└── README.md
```

### Backend Structure

```
backend/
├── app/
│   ├── api/                     # API routes
│   │   ├── v1/
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── lessons.py
│   │   │   ├── progress.py
│   │   │   ├── ai.py
│   │   │   └── voice.py
│   │   └── __init__.py
│   ├── models/                  # Database models
│   │   ├── user.py
│   │   ├── lesson.py
│   │   ├── progress.py
│   │   └── achievement.py
│   ├── schemas/                 # Pydantic schemas
│   │   ├── user.py
│   │   ├── lesson.py
│   │   └── response.py
│   ├── services/                # Business logic
│   │   ├── auth_service.py
│   │   ├── ai_service.py
│   │   ├── voice_service.py
│   │   └── progress_service.py
│   ├── core/                    # Core functionality
│   │   ├── config.py            # Configuration
│   │   ├── security.py          # Security utilities
│   │   └── database.py          # Database connection
│   ├── utils/                   # Helper functions
│   │   ├── email.py
│   │   └── file_handler.py
│   └── __init__.py
├── alembic/                     # Database migrations
│   └── versions/
├── tests/                       # Test files
│   ├── test_auth.py
│   └── test_lessons.py
├── .env.example
├── requirements.txt
├── requirements-dev.txt
└── main.py                      # Application entry
```

## Data Flow

### Authentication Flow

```
1. User submits login form
   ↓
2. Frontend sends POST /api/v1/auth/login
   ↓
3. Backend validates credentials
   ↓
4. Backend generates JWT token
   ↓
5. Frontend stores token in localStorage
   ↓
6. Frontend adds token to all subsequent requests
   ↓
7. Backend validates token on protected routes
```

### Learning Content Flow

```
1. User selects lesson
   ↓
2. Frontend fetches lesson data (cached with React Query)
   ↓
3. User completes lesson
   ↓
4. Frontend sends progress update
   ↓
5. Backend updates database
   ↓
6. Backend triggers achievement check
   ↓
7. Frontend receives updated progress + achievements
   ↓
8. Frontend updates UI with animations
```

### AI Interaction Flow

```
1. User sends message to chatbot
   ↓
2. Frontend sends POST /api/v1/ai/chat
   ↓
3. Backend retrieves conversation history
   ↓
4. Backend sends prompt to Ollama
   ↓
5. Ollama processes with context
   ↓
6. Backend receives AI response
   ↓
7. Backend saves to conversation history
   ↓
8. Frontend receives response (streaming)
   ↓
9. Frontend displays with typewriter effect
```

## Key Design Patterns

### Frontend Patterns

#### Component Composition
```jsx
// Composable components
<Card>
  <Card.Header>
    <Card.Title>Reading Module</Card.Title>
  </Card.Header>
  <Card.Body>
    <ProgressBar value={70} />
  </Card.Body>
</Card>
```

#### Custom Hooks
```javascript
// Encapsulate complex logic
const { user, login, logout, isLoading } = useAuth();
const { progress, updateProgress } = useProgress();
```

#### HOC for Authentication
```javascript
// Protected route wrapper
export const withAuth = (Component) => {
  return (props) => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" />;
    return <Component {...props} />;
  };
};
```

### Backend Patterns

#### Dependency Injection
```python
# FastAPI dependency injection
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/users/me")
async def get_current_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return current_user
```

#### Service Layer
```python
# Separate business logic from routes
class LessonService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_lesson(self, lesson_id: int) -> Lesson:
        # Business logic here
        pass
```

#### Repository Pattern
```python
# Abstract database operations
class UserRepository:
    def get_by_email(self, email: str) -> User:
        return self.db.query(User).filter(User.email == email).first()
```

## Performance Optimization

### Frontend
- Code splitting with React.lazy()
- Image optimization and lazy loading
- React Query caching (5-minute stale time)
- Debounced search inputs
- Virtualized lists for long content
- Service Worker for offline support

### Backend
- Redis caching for frequently accessed data
- Database query optimization with indexes
- Connection pooling
- Async operations where possible
- Rate limiting to prevent abuse
- CDN for static assets

## Security Measures

### Frontend
- XSS protection (React escapes by default)
- CSRF token for state-changing operations
- Secure token storage
- Input validation
- Content Security Policy headers

### Backend
- Password hashing with bcrypt (12 rounds)
- JWT with short expiration (15 minutes access, 7 days refresh)
- SQL injection prevention (ORM)
- Rate limiting (100 requests/minute per user)
- CORS configuration
- Environment variable secrets
- API key rotation

## Deployment Architecture

### Development
```
Docker Compose:
- Frontend container (Vite dev server)
- Backend container (FastAPI with hot reload)
- PostgreSQL container
- Redis container
- Ollama container
```

### Production
```
- Frontend: Vercel/Netlify (CDN, auto-scaling)
- Backend: Railway/Render (containerized, auto-scaling)
- Database: Supabase/Railway (managed PostgreSQL)
- Redis: Upstash (managed Redis)
- AI: Self-hosted Ollama or cloud GPU
```

## Monitoring & Logging

### Frontend
- Error tracking: Sentry
- Analytics: Plausible (privacy-friendly)
- Performance monitoring: Web Vitals

### Backend
- Logging: Python logging + Loguru
- Error tracking: Sentry
- APM: New Relic / Datadog
- Uptime monitoring: UptimeRobot

## Future Enhancements

- Microservices architecture for scaling
- GraphQL API alongside REST
- WebSockets for real-time features
- Mobile apps (React Native)
- Progressive Web App (PWA)
- Kubernetes deployment
- CI/CD pipeline (GitHub Actions)

---

**Last Updated**: January 2026
