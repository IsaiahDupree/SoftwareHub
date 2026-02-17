// SORA-002: Preview and export options for Sora Video desktop app
import React, { useState, useRef } from 'react';

interface Generation {
  id: string;
  prompt: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  output_url?: string;
  thumbnail_url?: string;
  duration_seconds: number;
  resolution: string;
  aspect_ratio: string;
}

interface PreviewExportProps {
  generation: Generation;
  onExport: (format: ExportFormat, options: ExportOptions) => Promise<void>;
  onSaveToLibrary: (title: string, tags: string[]) => Promise<void>;
}

type ExportFormat = 'mp4' | 'mov' | 'gif' | 'webm';

interface ExportOptions {
  resolution: '480p' | '720p' | '1080p' | '4k';
  fps: 24 | 30 | 60;
  quality: 'low' | 'medium' | 'high' | 'lossless';
  include_audio: boolean;
  trim_start?: number;
  trim_end?: number;
}

const EXPORT_FORMATS: { id: ExportFormat; label: string; description: string }[] = [
  { id: 'mp4', label: 'MP4 (H.264)', description: 'Best compatibility, recommended for most uses' },
  { id: 'mov', label: 'MOV (ProRes)', description: 'Professional quality for editing workflows' },
  { id: 'webm', label: 'WebM (VP9)', description: 'Optimized for web, smaller file size' },
  { id: 'gif', label: 'Animated GIF', description: 'For social media reactions, no audio' },
];

const RESOLUTIONS = ['480p', '720p', '1080p', '4k'] as const;
const FPS_OPTIONS = [24, 30, 60] as const;

export const PreviewExport: React.FC<PreviewExportProps> = ({
  generation,
  onExport,
  onSaveToLibrary,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('mp4');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    resolution: '1080p',
    fps: 30,
    quality: 'high',
    include_audio: true,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveTags, setSaveTags] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(selectedFormat, exportOptions);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSave = async () => {
    const tags = saveTags.split(',').map(t => t.trim()).filter(Boolean);
    await onSaveToLibrary(saveTitle || generation.prompt.slice(0, 50), tags);
    setShowSaveDialog(false);
  };

  if (generation.status !== 'completed' || !generation.output_url) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-900 rounded-lg">
        {generation.status === 'processing' ? (
          <>
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white text-lg font-medium">Generating video...</p>
            <div className="mt-3 w-48 bg-gray-700 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${generation.progress}%` }}
              />
            </div>
            <p className="text-gray-400 text-sm mt-2">{generation.progress}% complete</p>
          </>
        ) : generation.status === 'queued' ? (
          <>
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-white text-lg">Queued for generation...</p>
            <p className="text-gray-400 text-sm mt-1">Estimated wait: 2-5 minutes</p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-3">❌</div>
            <p className="text-red-400 text-lg">Generation failed</p>
            <p className="text-gray-400 text-sm mt-1">Please try again with a different prompt</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Video Preview */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={generation.output_url}
          controls
          loop
          className="w-full max-h-96 object-contain"
          poster={generation.thumbnail_url}
        />
        <div className="absolute top-3 right-3 flex gap-2">
          <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">
            {generation.resolution}
          </span>
          <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">
            {generation.duration_seconds}s
          </span>
          <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">
            {generation.aspect_ratio}
          </span>
        </div>
      </div>

      {/* Prompt */}
      <div className="bg-gray-800 rounded-lg p-4">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Prompt</p>
        <p className="text-white text-sm">{generation.prompt}</p>
      </div>

      {/* Export Options */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4">Export Settings</h3>

        {/* Format */}
        <div className="mb-4">
          <label className="text-gray-400 text-xs uppercase tracking-wider block mb-2">Format</label>
          <div className="grid grid-cols-2 gap-2">
            {EXPORT_FORMATS.map(fmt => (
              <button
                key={fmt.id}
                onClick={() => setSelectedFormat(fmt.id)}
                className={`p-3 rounded-lg text-left transition-colors ${
                  selectedFormat === fmt.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <div className="font-medium text-sm">{fmt.label}</div>
                <div className="text-xs opacity-70 mt-0.5">{fmt.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Resolution & FPS */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider block mb-2">Resolution</label>
            <select
              value={exportOptions.resolution}
              onChange={e => setExportOptions(o => ({ ...o, resolution: e.target.value as ExportOptions['resolution'] }))}
              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
            >
              {RESOLUTIONS.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wider block mb-2">Frame Rate</label>
            <select
              value={exportOptions.fps}
              onChange={e => setExportOptions(o => ({ ...o, fps: parseInt(e.target.value) as ExportOptions['fps'] }))}
              className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
            >
              {FPS_OPTIONS.map(fps => <option key={fps} value={fps}>{fps} FPS</option>)}
            </select>
          </div>
        </div>

        {/* Include Audio */}
        {selectedFormat !== 'gif' && (
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="include-audio"
              checked={exportOptions.include_audio}
              onChange={e => setExportOptions(o => ({ ...o, include_audio: e.target.checked }))}
              className="w-4 h-4 accent-purple-500"
            />
            <label htmlFor="include-audio" className="text-gray-300 text-sm">Include audio track</label>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {isExporting ? 'Exporting...' : `Export as ${selectedFormat.toUpperCase()}`}
        </button>
        <button
          onClick={() => setShowSaveDialog(true)}
          className="px-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
          title="Save to Library"
        >
          💾
        </button>
      </div>

      {/* Save to Library Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-96">
            <h3 className="text-white font-semibold text-lg mb-4">Save to Library</h3>
            <div className="mb-3">
              <label className="text-gray-400 text-sm block mb-1">Title</label>
              <input
                type="text"
                value={saveTitle}
                onChange={e => setSaveTitle(e.target.value)}
                placeholder={generation.prompt.slice(0, 50)}
                className="w-full bg-gray-700 text-white rounded px-3 py-2"
              />
            </div>
            <div className="mb-4">
              <label className="text-gray-400 text-sm block mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={saveTags}
                onChange={e => setSaveTags(e.target.value)}
                placeholder="product demo, lifestyle, tiktok"
                className="w-full bg-gray-700 text-white rounded px-3 py-2"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewExport;
