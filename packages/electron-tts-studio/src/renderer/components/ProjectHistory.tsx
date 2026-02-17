import React, { useEffect, useState } from 'react'
import type { TTSProject } from '../types'

interface Props {
  onLoadProject: (project: TTSProject) => void
}

function ProjectCard({
  project,
  onLoad,
  onDelete,
}: {
  project: TTSProject
  onLoad: () => void
  onDelete: () => void
}) {
  const preview = project.text.length > 100 ? project.text.slice(0, 100) + '…' : project.text
  const date = new Date(project.updatedAt).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="flex items-start gap-3 p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-colors group">
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-900/60 to-cyan-900/60 border border-teal-800/40 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-slate-200 text-sm font-medium truncate">{project.name}</p>
          {project.outputFormat && (
            <span className="px-1.5 py-0.5 bg-slate-800 text-slate-500 text-xs rounded-md uppercase shrink-0">
              {project.outputFormat}
            </span>
          )}
        </div>
        <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{preview}</p>
        <p className="text-slate-600 text-xs mt-1.5">{date}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={onLoad}
          className="px-3 py-1.5 bg-teal-900/30 hover:bg-teal-900/50 text-teal-400 text-xs font-medium rounded-lg border border-teal-900/50 transition-colors"
        >
          Load
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-slate-600 hover:text-red-400 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export function ProjectHistory({ onLoadProject }: Props) {
  const [projects, setProjects] = useState<TTSProject[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadProjects = async () => {
    setLoading(true)
    try {
      const result = await window.electronAPI.tts.listProjects() as { projects: TTSProject[] }
      setProjects(result.projects ?? [])
    } catch {
      // API offline
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleDelete = async (projectId: string) => {
    await window.electronAPI.tts.deleteProject(projectId)
    setProjects((prev) => prev.filter((p) => p.id !== projectId))
  }

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
    || p.text.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      {/* Search header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-slate-800 shrink-0">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-xl text-sm placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>
        <button
          onClick={loadProjects}
          className="p-2 text-slate-500 hover:text-slate-300 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <svg className="w-6 h-6 text-slate-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
            <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-slate-500 text-sm">
              {search ? 'No projects match your search' : 'No saved projects yet'}
            </p>
            {!search && (
              <p className="text-slate-600 text-xs">
                Generate audio and save your scripts to see them here
              </p>
            )}
          </div>
        ) : (
          filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onLoad={() => onLoadProject(project)}
              onDelete={() => handleDelete(project.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
