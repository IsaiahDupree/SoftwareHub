'use client';

// SORA-002: Preview and export options
// SORA-005: Video generation queue with progress tracking
// SORA-006: Generated video library with tagging

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Generation {
  id: string;
  prompt: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  output_url?: string;
  thumbnail_url?: string;
  duration_seconds: number;
  resolution: string;
  aspect_ratio: string;
  created_at: string;
}

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  prompt_template: string;
}

export default function SoraPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'generate' | 'queue' | 'library'>('generate');
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(5);
  const [resolution, setResolution] = useState('1080p');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [genRes, tplRes] = await Promise.all([
        fetch('/api/sora/generate'),
        fetch('/api/sora/templates'),
      ]);
      const [genData, tplData] = await Promise.all([genRes.json(), tplRes.json()]);
      setGenerations(genData.generations ?? []);
      setTemplates(tplData.templates ?? []);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/sora/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, duration_seconds: duration, resolution, aspect_ratio: aspectRatio }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Generation failed');
        return;
      }
      setGenerations(prev => [data.generation, ...prev]);
      setPrompt('');
      setActiveTab('queue');
    } catch (err) {
      setError('Failed to start generation');
    } finally {
      setIsGenerating(false);
    }
  };

  const applyTemplate = (template: Template) => {
    setPrompt(template.prompt_template);
  };

  const completedGenerations = generations.filter(g => g.status === 'completed');
  const activeGenerations = generations.filter(g => g.status === 'queued' || g.status === 'processing');

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sora Video Studio</h1>
        <p className="text-gray-500 mt-1">Generate professional AI videos with OpenAI Sora</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        {(['generate', 'queue', 'library'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab}
            {tab === 'queue' && activeGenerations.length > 0 && (
              <span className="ml-2 bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                {activeGenerations.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="space-y-6">
          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Video Prompt
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe the video you want to generate in detail..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-purple-500 outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">{prompt.length}/2000</p>
          </div>

          {/* Video Settings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Duration</label>
              <select
                value={duration}
                onChange={e => setDuration(parseInt(e.target.value))}
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
              >
                {[3, 5, 10, 15, 30, 60].map(d => <option key={d} value={d}>{d}s</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Resolution</label>
              <select
                value={resolution}
                onChange={e => setResolution(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
              >
                {['480p', '720p', '1080p'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={e => setAspectRatio(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
              >
                {[['16:9', 'Landscape'], ['9:16', 'Portrait (TikTok)'], ['1:1', 'Square']].map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-colors text-lg"
          >
            {isGenerating ? '⏳ Queueing...' : '✨ Generate Video'}
          </button>

          {/* Templates */}
          {templates.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Templates</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {templates.slice(0, 6).map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => applyTemplate(tpl)}
                    className="text-left p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
                  >
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{tpl.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{tpl.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            </div>
          ) : activeGenerations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">📭</div>
              <p>No active generations. Start a new video!</p>
            </div>
          ) : (
            activeGenerations.map(gen => (
              <div key={gen.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <p className="text-gray-900 dark:text-white font-medium text-sm line-clamp-2 mb-3">{gen.prompt}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${gen.status === 'processing' ? 'bg-purple-500' : 'bg-gray-400'}`}
                      style={{ width: `${gen.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-16 text-right">{gen.status === 'queued' ? 'Queued' : `${gen.progress}%`}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Library Tab */}
      {activeTab === 'library' && (
        <div>
          {completedGenerations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">🎬</div>
              <p>No completed videos yet. Generate your first video!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {completedGenerations.map(gen => (
                <div key={gen.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                  {gen.thumbnail_url ? (
                    <img src={gen.thumbnail_url} alt="Video thumbnail" className="w-full aspect-video object-cover" />
                  ) : (
                    <div className="w-full aspect-video bg-gray-900 flex items-center justify-center text-3xl">🎬</div>
                  )}
                  <div className="p-3">
                    <p className="text-xs text-gray-500 line-clamp-2">{gen.prompt}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{gen.resolution}</span>
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{gen.duration_seconds}s</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
