import { useState, useEffect } from 'react'
import { useAuth } from '@context/AuthContext'
import { Card } from '@components/common/Card'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '@utils/api'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import styles from './Admin.module.css'

function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalLessons: 8,
    completedAttempts: 0,
    averageScore: 0,
    todaySignups: 0,
  })
  const [users, setUsers] = useState([])
  const [attempts, setAttempts] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [modal, setModal] = useState({ show: false, type: 'info', message: '' })
  const [activities, setActivities] = useState([])
  const [testHistory, setTestHistory] = useState([])
  const [analyticsData, setAnalyticsData] = useState({
    userGrowth: [],
    completionRates: [],
    averageScores: [],
    peakHours: []
  })

  useEffect(() => {
    // Check if user is admin
    if (!user?.is_admin) {
      setModal({ 
        show: true, 
        type: 'error', 
        message: 'Access Denied: Admin privileges required' 
      })
      setTimeout(() => navigate('/dashboard'), 2000)
      return
    }
    loadAdminData()
    loadAnalytics()
    loadTestHistory()
  }, [user])

  const loadAdminData = async () => {
    setLoading(true)
    const token = localStorage.getItem('token')
    
    if (!token) {
      navigate('/login')
      return
    }

    try {
      // Load users
      const usersResponse = await apiRequest('/api/v1/admin/users')
      
      if (usersResponse.status === 403) {
        setModal({ 
          show: true, 
          type: 'error', 
          message: 'Access Denied: Admin privileges required' 
        })
        setTimeout(() => navigate('/dashboard'), 2000)
        return
      }
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData)
        
        // Calculate stats
        const activeUsers = usersData.filter(u => u.is_active).length
        const todaySignups = usersData.filter(u => {
          const createdDate = new Date(u.created_at)
          const today = new Date()
          return createdDate.toDateString() === today.toDateString()
        }).length

        setStats(prev => ({
          ...prev,
          totalUsers: usersData.length,
          activeUsers,
          todaySignups,
        }))
      }

      // Load lesson attempts
      const attemptsResponse = await apiRequest('/api/v1/admin/attempts')
      
      if (attemptsResponse.ok) {
        const attemptsData = await attemptsResponse.json()
        setAttempts(attemptsData)
        
        // Calculate average score
        const completedAttempts = attemptsData.filter(a => a.is_completed)
        const totalScore = completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0)
        const avgScore = completedAttempts.length > 0 ? totalScore / completedAttempts.length : 0

        setStats(prev => ({
          ...prev,
          completedAttempts: completedAttempts.length,
          averageScore: avgScore.toFixed(1),
        }))
      }
    } catch (error) {
      console.error('Failed to load admin data:', error)
      setModal({ show: true, type: 'error', message: 'Failed to load admin data' })
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      // Load activities
      const activitiesRes = await apiRequest('/api/v1/admin/activities?limit=50')
      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json()
        setActivities(activitiesData)
      }

      // Load user growth analytics
      const userGrowthRes = await apiRequest('/api/v1/admin/analytics/user-growth?days=30')
      if (userGrowthRes.ok) {
        const userGrowthData = await userGrowthRes.json()
        setAnalyticsData(prev => ({ ...prev, userGrowth: userGrowthData }))
      }

      // Load completion rates
      const completionRes = await apiRequest('/api/v1/admin/analytics/completion-rates')
      if (completionRes.ok) {
        const completionData = await completionRes.json()
        setAnalyticsData(prev => ({ ...prev, completionRates: completionData }))
      }

      // Load average scores
      const scoresRes = await apiRequest('/api/v1/admin/analytics/average-scores')
      if (scoresRes.ok) {
        const scoresData = await scoresRes.json()
        setAnalyticsData(prev => ({ ...prev, averageScores: scoresData }))
      }

      // Load peak hours
      const peakHoursRes = await apiRequest('/api/v1/admin/analytics/peak-hours')
      if (peakHoursRes.ok) {
        const peakHoursData = await peakHoursRes.json()
        setAnalyticsData(prev => ({ ...prev, peakHours: peakHoursData }))
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
    }
  }

  const loadTestHistory = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await apiRequest('/api/v1/admin/test-history?limit=100')
      if (response.ok) {
        const data = await response.json()
        setTestHistory(data)
      }
    } catch (error) {
      console.error('Failed to load test history:', error)
    }
  }

  const getActivityIcon = (activityType) => {
    const icons = {
      login: '🔑',
      logout: '👋',
      lesson_start: '📖',
      lesson_complete: '✅',
      test_start: '📝',
      test_complete: '🎯'
    }
    return icons[activityType] || '📌'
  }

  const getModuleIcon = (module) => {
    const icons = {
      reading: '📖',
      listening: '🎧',
      writing: '✍️',
      speaking: '🗣️'
    }
    return icons[module?.toLowerCase()] || '📚'
  }

  const formatActivityType = (type) => {
    return type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || ''
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    const token = localStorage.getItem('token')
    try {
      const response = await apiRequest(`/api/v1/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setModal({ show: true, type: 'info', message: 'User deleted successfully' })
        loadAdminData()
      } else {
        setModal({ show: true, type: 'error', message: 'Failed to delete user' })
      }
    } catch (error) {
      setModal({ show: true, type: 'error', message: 'Failed to delete user' })
    }
  }

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const token = localStorage.getItem('token')
    try {
      const response = await apiRequest(`/api/v1/admin/users/${userId}/toggle`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !currentStatus })
      })

      if (response.ok) {
        setModal({ show: true, type: 'info', message: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully` })
        loadAdminData()
      } else {
        setModal({ show: true, type: 'error', message: 'Failed to update user status' })
      }
    } catch (error) {
      setModal({ show: true, type: 'error', message: 'Failed to update user status' })
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className={styles.admin}>
        <Card padding="xl">
          <div className={styles.loading}>Loading admin panel...</div>
        </Card>
      </div>
    )
  }

  return (
    <div className={styles.admin}>
      <div className={styles.header}>
        <h1>🔐 Admin Dashboard</h1>
        <p>Manage users, monitor activity, and view system statistics</p>
      </div>

      <div className={styles.statsGrid}>
        <Card padding="md" hover>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.totalUsers}</div>
              <div className={styles.statLabel}>Total Users</div>
            </div>
          </div>
        </Card>

        <Card padding="md" hover>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.activeUsers}</div>
              <div className={styles.statLabel}>Active Users</div>
            </div>
          </div>
        </Card>

        <Card padding="md" hover>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📝</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.completedAttempts}</div>
              <div className={styles.statLabel}>Completed Attempts</div>
            </div>
          </div>
        </Card>

        <Card padding="md" hover>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.averageScore}</div>
              <div className={styles.statLabel}>Average Score</div>
            </div>
          </div>
        </Card>

        <Card padding="md" hover>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🆕</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.todaySignups}</div>
              <div className={styles.statLabel}>Today's Signups</div>
            </div>
          </div>
        </Card>

        <Card padding="md" hover>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📚</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.totalLessons}</div>
              <div className={styles.statLabel}>Total Lessons</div>
            </div>
          </div>
        </Card>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'dashboard' ? styles.active : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'users' ? styles.active : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users Management
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'attempts' ? styles.active : ''}`}
          onClick={() => setActiveTab('attempts')}
        >
          Lesson Attempts
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'analytics' ? styles.active : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'test-history' ? styles.active : ''}`}
          onClick={() => setActiveTab('test-history')}
        >
          Test History
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className={styles.tabContent}>
          <Card padding="lg">
            <div className={styles.dashboardHeader}>
              <h2>📊 Recent User Activity</h2>
              <button onClick={loadAnalytics} className={styles.refreshButton}>🔄 Refresh</button>
            </div>
            <div className={styles.activityList}>
              {activities.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No recent activities found</p>
                </div>
              ) : (
                activities.map((activity, index) => (
                  <div key={index} className={styles.activityItem}>
                    <div className={styles.activityIcon}>
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    <div className={styles.activityContent}>
                      <p className={styles.activityText}>
                        <strong>{activity.user_name || activity.user_email}</strong>{' '}
                        {formatActivityType(activity.activity_type)}
                        {activity.module && (
                          <span className={styles.moduleTag}>
                            {getModuleIcon(activity.module)} {activity.module}
                          </span>
                        )}
                        {activity.lesson_id && (
                          <span className={styles.lessonTag}>
                            Lesson: {activity.lesson_id}
                          </span>
                        )}
                      </p>
                      <span className={styles.activityTime}>{formatTime(activity.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <div className={styles.tabContent}>
          <Card padding="lg">
            <div className={styles.tableHeader}>
              <h2>All Users ({users.length})</h2>
              <input
                type="text"
                placeholder="Search users..."
                className={styles.searchInput}
              />
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Full Name</th>
                    <th>Target Score</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.email}</td>
                      <td>{user.full_name}</td>
                      <td>{user.target_band_score || 'N/A'}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${user.is_active ? styles.active : styles.inactive}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            className={styles.toggleButton}
                            onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                          >
                            {user.is_active ? '🔒 Deactivate' : '✅ Activate'}
                          </button>
                          <button
                            className={styles.viewButton}
                            onClick={() => setSelectedUser(user)}
                          >
                            👁️ View
                          </button>
                          <button
                            className={styles.deleteButton}
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'attempts' && (
        <div className={styles.tabContent}>
          <Card padding="lg">
            <h2>All Lesson Attempts ({attempts.length})</h2>
            {attempts.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No lesson attempts recorded yet. Attempts will appear here when users complete lessons with scoring.</p>
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>User</th>
                      <th>Lesson ID</th>
                      <th>Score</th>
                      <th>Correct/Total</th>
                      <th>Time Spent</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((attempt) => (
                      <tr key={attempt.id}>
                        <td>{attempt.id}</td>
                        <td>{attempt.user_email}</td>
                        <td>{attempt.lesson_id}</td>
                        <td>{attempt.score || 'N/A'}</td>
                        <td>{attempt.exercises_correct || 0} / {attempt.exercises_total || 0}</td>
                        <td>{Math.floor((attempt.time_spent_seconds || 0) / 60)}m</td>
                        <td>
                          <span className={`${styles.statusBadge} ${attempt.is_completed ? styles.completed : styles.pending}`}>
                            {attempt.is_completed ? 'Completed' : 'Pending'}
                          </span>
                        </td>
                        <td>{formatDate(attempt.started_at || attempt.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className={styles.tabContent}>
          <Card padding="lg">
            <h2>📈 Platform Analytics</h2>
            <div className={styles.analyticsGrid}>
              {/* User Growth Chart */}
              <div className={styles.analyticsCard}>
                <h3>User Growth (Last 30 Days)</h3>
                {analyticsData.userGrowth.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#888"
                        tick={{ fill: '#888' }}
                      />
                      <YAxis stroke="#888" tick={{ fill: '#888' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1a1a1a', 
                          border: '1px solid #444',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="signups" 
                        stroke="#6366F1" 
                        strokeWidth={2}
                        dot={{ fill: '#6366F1', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={styles.chartPlaceholder}>
                    <p>No user growth data available</p>
                  </div>
                )}
              </div>

              {/* Completion Rates Chart */}
              <div className={styles.analyticsCard}>
                <h3>Lesson Completion Rate by Module</h3>
                {analyticsData.completionRates.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.completionRates}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis 
                        dataKey="module" 
                        stroke="#888"
                        tick={{ fill: '#888' }}
                      />
                      <YAxis stroke="#888" tick={{ fill: '#888' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1a1a1a', 
                          border: '1px solid #444',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="completion_rate" 
                        fill="#10B981"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={styles.chartPlaceholder}>
                    <p>No completion data available</p>
                  </div>
                )}
              </div>

              {/* Average Scores Chart */}
              <div className={styles.analyticsCard}>
                <h3>Average Scores by Module</h3>
                {analyticsData.averageScores.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.averageScores}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis 
                        dataKey="module" 
                        stroke="#888"
                        tick={{ fill: '#888' }}
                      />
                      <YAxis stroke="#888" tick={{ fill: '#888' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1a1a1a', 
                          border: '1px solid #444',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="average_score" 
                        fill="#F59E0B"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={styles.chartPlaceholder}>
                    <p>No score data available</p>
                  </div>
                )}
              </div>

              {/* Peak Hours Chart */}
              <div className={styles.analyticsCard}>
                <h3>Peak Usage Hours</h3>
                {analyticsData.peakHours.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.peakHours}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis 
                        dataKey="hour" 
                        stroke="#888"
                        tick={{ fill: '#888' }}
                      />
                      <YAxis stroke="#888" tick={{ fill: '#888' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1a1a1a', 
                          border: '1px solid #444',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="activity_count" 
                        fill="#8B5CF6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={styles.chartPlaceholder}>
                    <p>No activity data available</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'test-history' && (
        <div className={styles.tabContent}>
          <Card padding="lg">
            <h2>All Test History ({testHistory.length})</h2>
            {testHistory.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No test history recorded yet</p>
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>User</th>
                      <th>Test Date</th>
                      <th>Overall</th>
                      <th>Listening</th>
                      <th>Reading</th>
                      <th>Writing</th>
                      <th>Speaking</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testHistory.map((test) => (
                      <tr key={test.id}>
                        <td>{test.id}</td>
                        <td>
                          <div>
                            <div>{test.user_name}</div>
                            <div style={{ fontSize: '11px', color: '#888' }}>{test.user_email}</div>
                          </div>
                        </td>
                        <td>{formatDate(test.test_date)}</td>
                        <td><strong>Band {test.overall_score}</strong></td>
                        <td>{test.listening_score} ({test.listening_correct}/{test.listening_total})</td>
                        <td>{test.reading_score} ({test.reading_correct}/{test.reading_total})</td>
                        <td>{test.writing_score || 'N/A'}</td>
                        <td>{test.speaking_score || 'N/A'}</td>
                        <td>{Math.floor((test.time_spent || 0) / 60)}m</td>
                        <td>
                          <span className={`${styles.statusBadge} ${test.completed ? styles.completed : styles.pending}`}>
                            {test.completed ? 'Completed' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className={styles.modalOverlay} onClick={() => setSelectedUser(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>User Details</h2>
            <div className={styles.userDetails}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>ID:</span>
                <span className={styles.detailValue}>{selectedUser.id}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Email:</span>
                <span className={styles.detailValue}>{selectedUser.email}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Full Name:</span>
                <span className={styles.detailValue}>{selectedUser.full_name}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Target Band Score:</span>
                <span className={styles.detailValue}>{selectedUser.target_band_score || 'N/A'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Test Date:</span>
                <span className={styles.detailValue}>{selectedUser.test_date || 'Not set'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Status:</span>
                <span className={`${styles.statusBadge} ${selectedUser.is_active ? styles.active : styles.inactive}`}>
                  {selectedUser.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Created At:</span>
                <span className={styles.detailValue}>{formatDate(selectedUser.created_at)}</span>
              </div>
            </div>
            <button
              className={styles.closeButton}
              onClick={() => setSelectedUser(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {modal.show && (
        <div className={styles.modalOverlay} onClick={() => setModal({ ...modal, show: false })}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={`${styles.modalIcon} ${styles[modal.type]}`}>
              {modal.type === 'error' ? '❌' : modal.type === 'warning' ? '⚠️' : 'ℹ️'}
            </div>
            <p className={styles.modalMessage}>{modal.message}</p>
            <button
              className={styles.modalOk}
              onClick={() => setModal({ ...modal, show: false })}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin
