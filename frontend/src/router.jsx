import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

// Layout
import MainLayout from './components/layout/MainLayout'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword/ForgotPassword'
import ResetPassword from './pages/ResetPassword/ResetPassword'
import Dashboard from './pages/Dashboard'
import LessonPlan from './pages/LessonPlan'
import ReadingModule from './pages/modules/Reading'
import ListeningModule from './pages/modules/Listening'
import WritingModule from './pages/modules/Writing'
import SpeakingModule from './pages/modules/Speaking'
import MockTests from './pages/MockTests'
import TestHistory from './pages/TestHistory/TestHistory'
import LessonDetail from './pages/LessonDetail/LessonDetail'
import Profile from './pages/Profile'
import Videos from './pages/Videos/Videos'
import VideoPlayer from './pages/VideoPlayer/VideoPlayer'
import WritingPractice from './pages/WritingPractice/WritingPractice'
import SpeakingPractice from './pages/SpeakingPractice/SpeakingPractice'
import Admin from './pages/Admin/Admin'
import NotFound from './pages/NotFound'

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  
  if (isLoading) {
    return <div className="loading-screen">Loading...</div>
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Protected routes */}
      <Route element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/lesson-plan" element={<LessonPlan />} />
        <Route path="/lessons" element={<LessonPlan />} />
        <Route path="/lessons/:module/:lessonId" element={<LessonDetail />} />
        <Route path="/reading" element={<ReadingModule />} />
        <Route path="/listening" element={<ListeningModule />} />
        <Route path="/writing" element={<WritingModule />} />
        <Route path="/speaking" element={<SpeakingModule />} />
        <Route path="/mock-tests" element={<MockTests />} />
        <Route path="/test-history" element={<TestHistory />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/videos/:videoId" element={<VideoPlayer />} />
        <Route path="/writing-practice" element={<WritingPractice />} />
        <Route path="/speaking-practice" element={<SpeakingPractice />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRouter
