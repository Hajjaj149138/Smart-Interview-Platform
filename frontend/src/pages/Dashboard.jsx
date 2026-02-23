import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { interviewApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { Brain, LogOut, Plus, Trophy, Target, Zap, ChevronRight, Clock } from 'lucide-react'
import NewInterviewModal from '../components/NewInterviewModal'

const DIFFICULTY_COLORS = {
  Easy: 'bg-green-900/50 text-green-300 border border-green-700',
  Medium: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700',
  Hard: 'bg-red-900/50 text-red-300 border border-red-700',
}

const scoreColor = (score) => {
  if (score >= 8) return 'text-green-400'
  if (score >= 5) return 'text-yellow-400'
  return 'text-red-400'
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await interviewApi.getDashboard()
      setStats(res.data)
    } catch (err) {
      console.error('Failed to load dashboard', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleStartInterview = (jobRole, difficulty) => {
    setShowModal(false)
    navigate('/interview', { state: { jobRole, difficulty } })
  }

  // Chart data: last 10 completed sessions
  const chartData = stats?.recentSessions
    ?.filter(s => s.score != null)
    .slice(0, 10)
    .reverse()
    .map((s, i) => ({
      name: `#${i + 1}`,
      score: s.score,
      role: s.jobRole,
    })) || []

  const radarData = [
    { subject: 'Technical', A: stats?.recentSessions?.filter(s => s.technicalAccuracy)
        .reduce((acc, s) => acc + s.technicalAccuracy, 0) /
        (stats?.recentSessions?.filter(s => s.technicalAccuracy).length || 1) || 0 },
    { subject: 'Communication', A: stats?.recentSessions?.filter(s => s.communicationClarity)
        .reduce((acc, s) => acc + s.communicationClarity, 0) /
        (stats?.recentSessions?.filter(s => s.communicationClarity).length || 1) || 0 },
    { subject: 'Consistency', A: stats?.completedSessions > 0 ? Math.min(10, stats.completedSessions) : 0 },
    { subject: 'Avg Score', A: stats?.averageScore || 0 },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold text-white">SmartInterview</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">Hi, <span className="text-white font-medium">{user?.username}</span></span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 transition-colors text-sm">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-900/50 rounded-xl flex items-center justify-center">
              <Target size={22} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Sessions</p>
              <p className="text-2xl font-bold text-white">{stats?.totalSessions || 0}</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 bg-green-900/50 rounded-xl flex items-center justify-center">
              <Trophy size={22} className="text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-white">{stats?.completedSessions || 0}</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-900/50 rounded-xl flex items-center justify-center">
              <Zap size={22} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Avg Score</p>
              <p className={`text-2xl font-bold ${scoreColor(stats?.averageScore || 0)}`}>
                {stats?.averageScore || '—'}{stats?.averageScore ? '/10' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Charts */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="card lg:col-span-2">
              <h2 className="text-white font-semibold mb-4">Score Progress</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 10]} stroke="#6b7280" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#e5e7eb' }}
                    itemStyle={{ color: '#818cf8' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={2} dot={{ fill: '#818cf8' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h2 className="text-white font-semibold mb-4">Skills Radar</h2>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1f2937" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <Radar dataKey="A" stroke="#818cf8" fill="#818cf8" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* New Interview Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Interview History</h2>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> New Interview
          </button>
        </div>

        {/* History List */}
        {stats?.recentSessions?.length === 0 ? (
          <div className="card text-center py-16">
            <Brain size={48} className="text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No interviews yet</h3>
            <p className="text-gray-400 mb-6">Start your first AI-powered technical interview practice session.</p>
            <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center gap-2">
              <Plus size={18} /> Start Interview
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {stats?.recentSessions?.map(session => (
              <div key={session.id} className="card hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-semibold text-indigo-400">{session.jobRole}</span>
                      {session.difficultyLevel && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[session.difficultyLevel] || 'bg-gray-800 text-gray-400'}`}>
                          {session.difficultyLevel}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm line-clamp-2">{session.question}</p>
                    {session.feedback && (
                      <p className="text-gray-500 text-xs mt-1 line-clamp-1">{session.feedback}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {session.score != null ? (
                      <div>
                        <span className={`text-2xl font-bold ${scoreColor(session.score)}`}>{session.score}</span>
                        <span className="text-gray-500 text-sm">/10</span>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">Pending</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <NewInterviewModal
          onClose={() => setShowModal(false)}
          onStart={handleStartInterview}
        />
      )}
    </div>
  )
}
