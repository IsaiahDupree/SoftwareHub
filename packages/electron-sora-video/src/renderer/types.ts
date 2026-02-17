export type GenerationStatus = 'pending' | 'generating' | 'completed' | 'failed'
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3'
export type Duration = 5 | 10 | 15 | 20
export type Quality = 'draft' | 'standard' | 'high'

export interface Project {
  id: string
  name: string
  createdAt: string
}

export interface Generation {
  id: string
  projectId: string
  prompt: string
  aspectRatio: AspectRatio
  duration: Duration
  quality: Quality
  status: GenerationStatus
  videoUrl?: string
  errorMessage?: string
  createdAt: string
}
