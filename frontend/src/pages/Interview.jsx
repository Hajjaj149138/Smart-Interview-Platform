import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { interviewApi } from '../services/api'
import { Brain, Send, ArrowLeft, CheckCircle, XCircle, Loader } from 'lucide-react'

const STAGES = {
  LOADING_QUESTION: 'LOADING_QUESTION',
  ANSWERING: 'ANSWERING',
  SUBMITTING: 'SUBMITTING',
  RESULTS: 'RESULTS',
  ERROR: 'ERROR',
}

const scoreColor = (score) => {
  if (score >= 8) return 'text-green-400'
  if (score >= 5) return 'text-yellow-400'
  return 'text-red-400'
}

const ScoreBar = ({ label, value }) => (
  <div>
    <div className="flex justify-between text-sm mb-1">
      <span className="text-gray-400">{label}</span>
      <span className={`font-semibold ${scoreColor(value)}`}>{value}/10</span>
    </div>
    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${value * 10}%`,
          backgroundColor: value >= 8 ? '#4ade80' : value >= 5 ? '#facc15' : '#f87171'
        }}
      />
    </div>
  </div>
)

export default function Interview() {
  const location = useLocation()
  const navigate = useNavigate()
  const { jobRole, difficulty } = location.state || {}

  const [stage, setStage] = useState(STAGES.LOADING_QUESTION)
  const [question, setQuestion] = useState(null)
  const [answer, setAnswer] = useState('')
  const [evaluation, setEvaluation] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!jobRole) {
      navigate('/dashboard')
      return
    }
    fetchQuestion()
  }, [])

  const fetchQuestion = async () => {
    setStage(STAGES.LOADING_QUESTION)
    try {
      const res = await interviewApi.getQuestion({ jobRole, difficulty: difficulty || 'Medium' })
      setQuestion(res.data)
      setStage(STAGES.ANSWERING)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate question. Please try again.')
      setStage(STAGES.ERROR)
    }
  }

  const handleSubmit = async () => {
    if (!answer.trim() || answer.trim().length < 10) return
    setStage(STAGES.SUBMITTING)
    try {
      const res = await interviewApi.evaluate({ sessionId: question.sessionId, answer })
      setEvaluation(res.data)
      setStage(STAGES.RESULTS)
    } catch (err) {
      setError(err.response?.data?.error || 'Evaluation failed. Please try again.')
      setStage(STAGES.ERROR)
    }
  }

  const difficultyStyle = {
    Easy: 'bg-green-900/50 text-green-300 border border-green-700',
    Medium: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700',
    Hard: 'bg-red-900/50 text-red-300 border border-red-700',
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Brain size={20} className="text-indigo-400" />
            <span className="font-semibold text-white">{jobRole} Interview</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">

        {/* LOADING */}
        {stage === STAGES.LOADING_QUESTION && (
          <div className="text-center py-24">
            <Loader size={40} className="animate-spin text-indigo-400 mx-auto mb-4" />
            <p className="text-gray-400">Generating your {difficulty} question for <span className="text-indigo-400">{jobRole}</span>...</p>
          </div>
        )}

        {/* ERROR */}
        {stage === STAGES.ERROR && (
          <div className="card text-center py-12">
            <XCircle size={40} className="text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Something went wrong</h3>
            <p className="text-gray-400 mb-6">{error}</p>
            <button onClick={fetchQuestion} className="btn-primary">Try Again</button>
          </div>
        )}

        {/* ANSWERING */}
        {(stage === STAGES.ANSWERING || stage === STAGES.SUBMITTING) && question && (
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-xs px-2.5 py-1 rounded-full ${difficultyStyle[question.difficultyLevel] || 'bg-gray-800 text-gray-400'}`}>
                  {question.difficultyLevel}
                </span>
                <span className="text-xs text-gray-500">{question.jobRole}</span>
              </div>
              <h2 className="text-lg font-medium text-white leading-relaxed">{question.question}</h2>
            </div>

            <div className="card">
              <label className="block text-sm font-medium text-gray-300 mb-3">Your Answer</label>
              <textarea
                className="input resize-none"
                rows={10}
                placeholder="Write your detailed answer here. Be thorough — explain concepts, mention trade-offs, and provide examples where relevant..."
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                disabled={stage === STAGES.SUBMITTING}
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-gray-500 text-sm">{answer.length} characters</span>
                <button
                  className="btn-primary flex items-center gap-2"
                  onClick={handleSubmit}
                  disabled={stage === STAGES.SUBMITTING || answer.trim().length < 10}
                >
                  {stage === STAGES.SUBMITTING ? (
                    <><Loader size={16} className="animate-spin" /> Evaluating...</>
                  ) : (
                    <><Send size={16} /> Submit Answer</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {stage === STAGES.RESULTS && evaluation && (
          <div className="space-y-6">
            {/* Score Hero */}
            <div className="card text-center py-8">
              <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
              <p className="text-gray-400 mb-2">Overall Score</p>
              <div className={`text-6xl font-bold mb-1 ${scoreColor(evaluation.score)}`}>
                {evaluation.score}
              </div>
              <p className="text-gray-500">out of 10</p>
            </div>

            {/* Score Breakdown */}
            <div className="card">
              <h3 className="text-white font-semibold mb-4">Score Breakdown</h3>
              <div className="space-y-4">
                <ScoreBar label="Technical Accuracy" value={evaluation.technicalAccuracy} />
                <ScoreBar label="Communication Clarity" value={evaluation.communicationClarity} />
              </div>
            </div>

            {/* Feedback */}
            <div className="card">
              <h3 className="text-white font-semibold mb-3">Detailed Feedback</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{evaluation.feedback}</p>
            </div>

            {evaluation.strengths && (
              <div className="card border-green-800/50">
                <h3 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle size={16} /> Strengths
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">{evaluation.strengths}</p>
              </div>
            )}

            {evaluation.improvements && (
              <div className="card border-yellow-800/50">
                <h3 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
                  <Brain size={16} /> Areas to Improve
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">{evaluation.improvements}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => { setAnswer(''); setQuestion(null); fetchQuestion() }} className="btn-primary flex-1">
                New Question
              </button>
              <button onClick={() => navigate('/dashboard')} className="btn-secondary flex-1">
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
