import { useState } from 'react'
import { X, Briefcase } from 'lucide-react'

const JOB_ROLES = [
  { id: 'Frontend Developer', icon: '⚛️', desc: 'React, CSS, JavaScript, UI/UX' },
  { id: 'Backend Developer', icon: '⚙️', desc: 'APIs, Databases, System Design' },
  { id: 'Full Stack Developer', icon: '🖥️', desc: 'End-to-end web development' },
  { id: 'DevOps Engineer', icon: '🔧', desc: 'CI/CD, Docker, Kubernetes, Cloud' },
  { id: 'Data Scientist', icon: '📊', desc: 'ML, Python, Statistics, Analytics' },
  { id: 'Cloud Engineer', icon: '☁️', desc: 'AWS, Azure, GCP, Infrastructure' },
  { id: 'Mobile Developer', icon: '📱', desc: 'iOS, Android, React Native, Flutter' },
  { id: 'Security Engineer', icon: '🔒', desc: 'Cybersecurity, Penetration Testing' },
]

const DIFFICULTIES = [
  { id: 'Easy', label: 'Easy', desc: 'Fundamentals & basics', color: 'border-green-600 bg-green-900/20 text-green-300' },
  { id: 'Medium', label: 'Medium', desc: 'Practical problem solving', color: 'border-yellow-600 bg-yellow-900/20 text-yellow-300' },
  { id: 'Hard', label: 'Hard', desc: 'Advanced & system design', color: 'border-red-600 bg-red-900/20 text-red-300' },
]

export default function NewInterviewModal({ onClose, onStart }) {
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('Medium')

  const handleStart = () => {
    if (!selectedRole) return
    onStart(selectedRole, selectedDifficulty)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Briefcase size={20} className="text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">New Interview Session</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Job Role */}
          <div>
            <h3 className="text-white font-medium mb-3">Select Job Role</h3>
            <div className="grid grid-cols-2 gap-2">
              {JOB_ROLES.map(role => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                    selectedRole === role.id
                      ? 'border-indigo-500 bg-indigo-900/30'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
                >
                  <span className="text-xl">{role.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{role.id}</p>
                    <p className="text-xs text-gray-400">{role.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <h3 className="text-white font-medium mb-3">Difficulty Level</h3>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDifficulty(d.id)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    selectedDifficulty === d.id
                      ? d.color
                      : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <p className="font-semibold">{d.label}</p>
                  <p className="text-xs mt-0.5 opacity-70">{d.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-800 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleStart}
            className="btn-primary flex-1"
            disabled={!selectedRole}
          >
            Start Interview
          </button>
        </div>
      </div>
    </div>
  )
}
