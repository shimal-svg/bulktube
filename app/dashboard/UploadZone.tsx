'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'

type Orientation = 'portrait' | 'landscape' | 'square'
type Privacy = 'public' | 'unlisted' | 'private'
type UploadStatus = 'idle' | 'uploading' | 'success' | 'failed'

interface VideoItem {
  id: string
  file: File
  title: string
  orientation: Orientation | null
  duration: number | null
  loading: boolean
  uploadStatus: UploadStatus
  progress: number
  uploadId?: string
  youtubeVideoId?: string
  youtubeUrl?: string
  uploadError?: string
}

interface BatchSettings {
  privacy: Privacy
  madeForKids: boolean
  titleSuffix: string
}

// ─── helpers ────────────────────────────────────────────────────────────────

function formatUploadDate(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  return `${yyyy}${dd}${mm}`
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m${String(s).padStart(2, '0')}s` : `${s}s`
}

function buildTitle(file: File, orientation: Orientation, duration: number): string {
  const stem = file.name.replace(/\.[^.]+$/, '')
  return `${stem}_${orientation}_${formatDuration(duration)}_${formatUploadDate()}`
}

async function readVideoMeta(
  file: File
): Promise<{ orientation: Orientation; duration: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      const duration = Math.round(video.duration)
      const w = video.videoWidth
      const h = video.videoHeight
      const orientation: Orientation =
        h > w ? 'portrait' : w > h ? 'landscape' : 'square'
      URL.revokeObjectURL(url)
      resolve({ orientation, duration })
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read video metadata'))
    }
    video.src = url
  })
}

function xhrUpload(
  url: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    })
    xhr.addEventListener('load', () => {
      console.log('[xhrUpload] load — status:', xhr.status, '| body[:120]:', xhr.responseText.slice(0, 120))
      if (xhr.status === 200 || xhr.status === 201) {
        try {
          resolve(JSON.parse(xhr.responseText).id)
        } catch {
          reject(new Error('Invalid YouTube response'))
        }
      } else {
        let msg = `Upload failed (${xhr.status})`
        try {
          msg = JSON.parse(xhr.responseText)?.error?.message || msg
        } catch {}
        reject(new Error(msg))
      }
    })
    xhr.addEventListener('error', () => {
      console.log('[xhrUpload] error event — readyState:', xhr.readyState, '| status:', xhr.status)
      reject(new Error('Network error during upload'))
    })
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')))
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4')
    xhr.send(file)
  })
}

// ─── component ──────────────────────────────────────────────────────────────

export default function UploadZone() {
  const [items, setItems] = useState<VideoItem[]>([])
  const [dragging, setDragging] = useState(false)
  const [batchUploading, setBatchUploading] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [batchSettings, setBatchSettings] = useState<BatchSettings>({
    privacy: 'unlisted',
    madeForKids: false,
    titleSuffix: '',
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const sessionIdRef = useRef<string | null>(null)
  const router = useRouter()

  function patchItem(id: string, patch: Partial<VideoItem>) {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)))
  }

  async function processFiles(files: File[]) {
    const videos = files.filter(f => f.type.startsWith('video/'))
    const slots = 20 - items.length
    const toAdd = videos.slice(0, slots)
    if (!toAdd.length) return

    const newItems: VideoItem[] = toAdd.map((file, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random()}`,
      file,
      title: file.name.replace(/\.[^.]+$/, ''),
      orientation: null,
      duration: null,
      loading: true,
      uploadStatus: 'idle',
      progress: 0,
    }))

    setItems(prev => [...prev, ...newItems])

    for (const item of newItems) {
      try {
        const { orientation, duration } = await readVideoMeta(item.file)
        patchItem(item.id, {
          orientation,
          duration,
          title: buildTitle(item.file, orientation, duration),
          loading: false,
        })
      } catch {
        patchItem(item.id, { loading: false })
      }
    }
  }

  async function ensureSession(): Promise<string | null> {
    if (sessionIdRef.current) return sessionIdRef.current
    const res = await fetch('/api/upload/session', { method: 'POST' })
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Could not create upload session' }))
      setSessionError(error)
      return null
    }
    const { sessionId } = await res.json()
    sessionIdRef.current = sessionId
    return sessionId
  }

  async function uploadItem(item: VideoItem, settings: BatchSettings) {
    patchItem(item.id, { uploadStatus: 'uploading', progress: 0, uploadError: undefined })

    const effectiveTitle = settings.titleSuffix
      ? `${item.title}_${settings.titleSuffix}`
      : item.title

    // Step 1 — init: server checks credits & gets YouTube resumable URI
    let uploadUrl: string
    let uploadId: string
    try {
      const res = await fetch('/api/upload/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: effectiveTitle,
          filename: item.file.name,
          orientation: item.orientation,
          duration: item.duration,
          privacy: settings.privacy,
          madeForKids: settings.madeForKids,
          fileSize: item.file.size,
          contentType: item.file.type || 'video/mp4',
          sessionId: sessionIdRef.current,
        }),
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Init failed' }))
        patchItem(item.id, { uploadStatus: 'failed', uploadError: error })
        return
      }
      ;({ uploadUrl, uploadId } = await res.json())
      patchItem(item.id, { uploadId })
    } catch {
      patchItem(item.id, { uploadStatus: 'failed', uploadError: 'Network error' })
      return
    }

    // Step 2 — upload directly to YouTube (XHR for progress events).
    // If the XHR error event fires (browser CORS blocks the response even though
    // YouTube received the bytes), fall back to a server-side status check that
    // asks YouTube whether the upload completed and retrieves the video ID.
    let xhrErr: string | null = null
    const youtubeVideoId = await (async () => {
      try {
        return await xhrUpload(uploadUrl, item.file, (pct) =>
          setItems(prev =>
            prev.map(i => (i.id === item.id ? { ...i, progress: pct } : i))
          )
        )
      } catch (err) {
        xhrErr = (err as Error).message
        console.log('[uploadItem] XHR failed:', xhrErr, '— querying upload status server-side')
        try {
          const res = await fetch('/api/upload/recover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uploadUrl, fileSize: item.file.size }),
          })
          if (res.ok) {
            const { videoId } = await res.json()
            if (videoId) {
              console.log('[uploadItem] recovery succeeded — videoId:', videoId)
              return videoId as string
            }
          }
        } catch (recoveryErr) {
          console.log('[uploadItem] recovery fetch failed:', (recoveryErr as Error).message)
        }
        return null
      }
    })()

    if (!youtubeVideoId) {
      patchItem(item.id, {
        uploadStatus: 'failed',
        uploadError: xhrErr ?? 'Upload failed',
      })
      return
    }

    // Step 3 — complete: server records video & deducts credit
    try {
      const res = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId, youtubeVideoId }),
      })
      if (!res.ok) {
        // Video IS on YouTube — surface the ID so the user isn't left wondering
        patchItem(item.id, {
          uploadStatus: 'success',
          youtubeVideoId,
          youtubeUrl: `https://youtu.be/${youtubeVideoId}`,
          progress: 100,
          uploadError: `Uploaded (ID: ${youtubeVideoId}) but not saved to drrop.io — contact support`,
        })
        return
      }
    } catch {
      patchItem(item.id, {
        uploadStatus: 'success',
        youtubeVideoId,
        youtubeUrl: `https://youtu.be/${youtubeVideoId}`,
        progress: 100,
        uploadError: `Uploaded (ID: ${youtubeVideoId}) but not saved to drrop.io — contact support`,
      })
      return
    }

    patchItem(item.id, {
      uploadStatus: 'success',
      youtubeVideoId,
      youtubeUrl: `https://youtu.be/${youtubeVideoId}`,
      progress: 100,
    })
  }

  async function startUpload() {
    // Include previously failed items so clicking Upload again retries them
    const targets = items.filter(i => !i.loading && (i.uploadStatus === 'idle' || i.uploadStatus === 'failed'))
    if (!targets.length) return

    // Clear error state on failed items immediately so the UI doesn't show
    // stale error messages while the new attempt is in progress
    setItems(prev =>
      prev.map(i =>
        i.uploadStatus === 'failed'
          ? { ...i, uploadStatus: 'idle', progress: 0, uploadError: undefined }
          : i
      )
    )

    setSessionError(null)
    setBatchUploading(true)

    const sessionId = await ensureSession()
    if (!sessionId) {
      setBatchUploading(false)
      return
    }

    // Snapshot settings at click time
    const settings = { ...batchSettings }
    const queue = [...targets]

    const worker = async () => {
      while (queue.length) {
        const item = queue.shift()!
        await uploadItem(item, settings)
      }
    }

    await Promise.all(Array.from({ length: Math.min(3, targets.length) }, worker))

    // Refresh the server component so the free-uploads counter reflects
    // any credits deducted during this batch
    router.refresh()

    setBatchUploading(false)
  }

  async function retryItem(item: VideoItem) {
    patchItem(item.id, { uploadStatus: 'idle', progress: 0, uploadError: undefined })
    setSessionError(null)
    const sessionId = await ensureSession()
    if (!sessionId) return
    await uploadItem(
      { ...item, uploadStatus: 'idle', progress: 0, uploadError: undefined },
      batchSettings
    )
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    processFiles(Array.from(e.dataTransfer.files))
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      processFiles(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  const atLimit = items.length >= 20
  const anyLoading = items.some(i => i.loading)
  const idleItems = items.filter(i => !i.loading && i.uploadStatus === 'idle')
  const hasIdle = idleItems.length > 0

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onClick={() => !atLimit && inputRef.current?.click()}
        className={[
          'rounded-xl border-2 border-dashed p-12 text-center transition-colors',
          atLimit
            ? 'cursor-not-allowed opacity-50 border-zinc-200 bg-white'
            : 'cursor-pointer border-zinc-300 bg-white hover:border-zinc-400',
          dragging && !atLimit ? 'border-zinc-500 bg-zinc-50' : '',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
        <p className="text-zinc-400 text-sm">
          {atLimit
            ? 'Maximum 20 videos reached'
            : 'Drag & drop videos here, or click to select'}
        </p>
        <p className="text-zinc-300 text-xs mt-1">{items.length} / 20 videos</p>
      </div>

      {items.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-700">
            Preview — edit titles before uploading
          </h2>

          {/* Video list */}
          <ul className="space-y-2">
            {items.map(item => (
              <li
                key={item.id}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-3 space-y-2"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    {item.loading ? (
                      <div className="h-4 w-56 animate-pulse rounded bg-zinc-100" />
                    ) : item.uploadStatus === 'success' ? (
                      <p className="text-sm font-medium text-zinc-800 truncate">
                        {item.title}
                        {batchSettings.titleSuffix ? `_${batchSettings.titleSuffix}` : ''}
                      </p>
                    ) : (
                      <input
                        type="text"
                        value={item.title}
                        onChange={e =>
                          setItems(prev =>
                            prev.map(i =>
                              i.id === item.id ? { ...i, title: e.target.value } : i
                            )
                          )
                        }
                        disabled={item.uploadStatus === 'uploading'}
                        className="w-full text-sm text-zinc-800 bg-transparent border-b border-transparent hover:border-zinc-300 focus:border-zinc-500 focus:outline-none py-0.5 disabled:opacity-60"
                      />
                    )}
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">
                      {item.file.name}
                      {item.orientation ? ` · ${item.orientation}` : ''}
                      {item.duration != null ? ` · ${formatDuration(item.duration)}` : ''}
                      {batchSettings.titleSuffix && item.uploadStatus !== 'success'
                        ? ` · +_${batchSettings.titleSuffix}`
                        : ''}
                    </p>
                  </div>

                  {/* Per-item action */}
                  {item.uploadStatus === 'success' && (
                    <a
                      href={item.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-xs text-green-600 hover:underline"
                    >
                      ✓ View
                    </a>
                  )}
                  {item.uploadStatus === 'failed' && (
                    <button
                      onClick={() => retryItem(item)}
                      className="shrink-0 text-xs font-medium text-red-500 hover:text-red-700 transition"
                    >
                      Retry
                    </button>
                  )}
                  {item.uploadStatus === 'idle' && !item.loading && (
                    <button
                      onClick={() =>
                        setItems(prev => prev.filter(i => i.id !== item.id))
                      }
                      aria-label="Remove"
                      className="shrink-0 text-zinc-300 hover:text-red-400 transition text-xs leading-none"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                {item.uploadStatus === 'uploading' && (
                  <div className="w-full h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      className="h-full bg-zinc-900 rounded-full transition-all duration-150"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}

                {/* Error */}
                {item.uploadError && (
                  <p className="text-xs text-red-500">{item.uploadError}</p>
                )}
              </li>
            ))}
          </ul>

          {/* Batch settings */}
          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-4 space-y-3">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              Batch settings
            </p>
            <div className="flex flex-wrap gap-5">
              {/* Privacy */}
              <div className="space-y-1.5">
                <p className="text-xs text-zinc-500">Privacy</p>
                <div className="flex gap-1">
                  {(['public', 'unlisted', 'private'] as Privacy[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setBatchSettings(s => ({ ...s, privacy: p }))}
                      className={[
                        'px-2.5 py-1 text-xs rounded-md border transition capitalize',
                        batchSettings.privacy === p
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400',
                      ].join(' ')}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Made for kids */}
              <div className="space-y-1.5">
                <p className="text-xs text-zinc-500">Made for kids</p>
                <div className="flex gap-1">
                  {[false, true].map(val => (
                    <button
                      key={String(val)}
                      onClick={() => setBatchSettings(s => ({ ...s, madeForKids: val }))}
                      className={[
                        'px-2.5 py-1 text-xs rounded-md border transition',
                        batchSettings.madeForKids === val
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400',
                      ].join(' ')}
                    >
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title suffix */}
              <div className="space-y-1.5 flex-1 min-w-48">
                <p className="text-xs text-zinc-500">
                  Title suffix{' '}
                  <span className="text-zinc-300 font-normal">
                    appended to every title on upload
                  </span>
                </p>
                <input
                  type="text"
                  value={batchSettings.titleSuffix}
                  onChange={e =>
                    setBatchSettings(s => ({ ...s, titleSuffix: e.target.value }))
                  }
                  placeholder="e.g. sponsored_may2026"
                  className="w-full text-sm px-2.5 py-1 rounded-md border border-zinc-200 focus:border-zinc-500 focus:outline-none bg-white text-zinc-800 placeholder-zinc-300"
                />
              </div>
            </div>
          </div>

          {/* Session error */}
          {sessionError && (
            <p className="text-xs text-red-500">{sessionError}</p>
          )}

          {/* Upload button — only when there are idle videos */}
          {hasIdle && (
            <button
              onClick={startUpload}
              disabled={anyLoading || batchUploading}
              className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {anyLoading
                ? 'Reading metadata…'
                : batchUploading
                ? 'Uploading…'
                : `Upload ${idleItems.length} video${idleItems.length !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
