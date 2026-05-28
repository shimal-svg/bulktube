'use client'

import { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react'
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

interface AdsAccount {
  id: string
  name: string
  formattedId: string
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

function formatCustomerId(id: string): string {
  const d = id.replace(/\D/g, '')
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : id
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

// ─── Toggle ─────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  size = 'md',
  id,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  size?: 'sm' | 'md'
  id?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-lime',
        size === 'md' ? 'h-5 w-9' : 'h-4 w-7',
        checked ? 'bg-lime' : 'bg-drrop-border',
      ].join(' ')}
    >
      <span
        className={[
          'pointer-events-none inline-block rounded-full bg-white shadow transform transition-transform duration-200',
          size === 'md' ? 'h-4 w-4' : 'h-3 w-3',
          checked
            ? size === 'md' ? 'translate-x-4' : 'translate-x-3'
            : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  )
}

// ─── component ──────────────────────────────────────────────────────────────

export default function UploadZone() {
  // ── existing state ─────────────────────────────────────────────────────
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

  // ── destination toggle state ────────────────────────────────────────────
  const [uploadToYouTube, setUploadToYouTube] = useState(false)
  const [uploadToGoogleAds, setUploadToGoogleAds] = useState(false)
  const [rememberChannel, setRememberChannel] = useState(false)
  const [rememberAdsAccount, setRememberAdsAccount] = useState(false)

  // ── Google Ads account state ────────────────────────────────────────────
  const [adsAccounts, setAdsAccounts] = useState<AdsAccount[]>([])
  const [adsAccountsLoading, setAdsAccountsLoading] = useState(false)
  const [adsAccountsError, setAdsAccountsError] = useState<string | null>(null)
  const [adsSearch, setAdsSearch] = useState('')
  const [adsDropdownOpen, setAdsDropdownOpen] = useState(false)
  const [selectedAdsAccount, setSelectedAdsAccount] = useState<AdsAccount | null>(null)

  // ── load persisted preferences on mount ────────────────────────────────
  useEffect(() => {
    const rc = localStorage.getItem('drrop_remember_channel') === 'true'
    const ra = localStorage.getItem('drrop_remember_ads') === 'true'
    setRememberChannel(rc)
    setRememberAdsAccount(ra)

    if (rc) {
      setUploadToYouTube(localStorage.getItem('drrop_yt_enabled') === 'true')
    }
    if (ra) {
      setUploadToGoogleAds(localStorage.getItem('drrop_ads_enabled') === 'true')
      const savedId = localStorage.getItem('drrop_ads_customer_id')
      const savedName = localStorage.getItem('drrop_ads_customer_name')
      if (savedId && savedName) {
        setSelectedAdsAccount({ id: savedId, name: savedName, formattedId: formatCustomerId(savedId) })
      }
    }
  }, [])

  // ── destination toggle handlers ─────────────────────────────────────────
  function handleToggleYouTube(v: boolean) {
    setUploadToYouTube(v)
    if (rememberChannel) localStorage.setItem('drrop_yt_enabled', String(v))
  }

  function handleToggleGoogleAds(v: boolean) {
    setUploadToGoogleAds(v)
    if (rememberAdsAccount) localStorage.setItem('drrop_ads_enabled', String(v))
    if (v && adsAccounts.length === 0 && !adsAccountsLoading) fetchAdsAccounts()
  }

  function handleRememberChannel(v: boolean) {
    setRememberChannel(v)
    localStorage.setItem('drrop_remember_channel', String(v))
    if (v) localStorage.setItem('drrop_yt_enabled', String(uploadToYouTube))
  }

  function handleRememberAds(v: boolean) {
    setRememberAdsAccount(v)
    localStorage.setItem('drrop_remember_ads', String(v))
    if (v && selectedAdsAccount) {
      localStorage.setItem('drrop_ads_customer_id', selectedAdsAccount.id)
      localStorage.setItem('drrop_ads_customer_name', selectedAdsAccount.name)
      saveAdsAccountToDb(selectedAdsAccount)
    }
  }

  // ── Google Ads account helpers ──────────────────────────────────────────
  async function fetchAdsAccounts() {
    setAdsAccountsLoading(true)
    setAdsAccountsError(null)
    try {
      const res = await fetch('/api/google-ads/customers')
      const data = await res.json()
      if (data.error) setAdsAccountsError(data.error)
      else setAdsAccounts(data.customers ?? [])
    } catch {
      setAdsAccountsError('Failed to load accounts')
    } finally {
      setAdsAccountsLoading(false)
    }
  }

  function saveAdsAccountToDb(account: AdsAccount) {
    fetch('/api/user/ads-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: account.id, customerName: account.name }),
    }).catch(() => {})
  }

  function selectAdsAccount(account: AdsAccount) {
    setSelectedAdsAccount(account)
    setAdsDropdownOpen(false)
    setAdsSearch('')
    localStorage.setItem('drrop_ads_customer_id', account.id)
    localStorage.setItem('drrop_ads_customer_name', account.name)
    if (rememberAdsAccount) saveAdsAccountToDb(account)
  }

  // ── computed ────────────────────────────────────────────────────────────
  const activeDestinations = (uploadToYouTube ? 1 : 0) + (uploadToGoogleAds ? 1 : 0)
  const creditCount = items.length * activeDestinations
  const filteredAdsAccounts = adsAccounts.filter(
    (a) =>
      adsSearch === '' ||
      a.name.toLowerCase().includes(adsSearch.toLowerCase()) ||
      a.formattedId.includes(adsSearch)
  )

  // ── existing helpers ────────────────────────────────────────────────────
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
    const targets = items.filter(i => !i.loading && (i.uploadStatus === 'idle' || i.uploadStatus === 'failed'))
    if (!targets.length) return

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

    const settings = { ...batchSettings }
    const queue = [...targets]

    const worker = async () => {
      while (queue.length) {
        const item = queue.shift()!
        await uploadItem(item, settings)
      }
    }

    await Promise.all(Array.from({ length: Math.min(3, targets.length) }, worker))

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
    <div className="space-y-4">

      {/* ── Credit counter ─────────────────────────────────────────────── */}
      {creditCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-lime/10 border border-lime/20 px-4 py-2.5">
          <span className="text-lime font-semibold text-sm">
            Uploading {creditCount} Video{creditCount !== 1 ? 's' : ''}
          </span>
          <span className="text-drrop-muted text-xs">
            {items.length} {items.length !== 1 ? 'videos' : 'video'} × {activeDestinations} destination{activeDestinations !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* ── Destination toggles ────────────────────────────────────────── */}
      <div className="rounded-xl border border-drrop-border bg-surface px-4 py-3 space-y-3">
        <p className="text-xs font-semibold text-drrop-muted uppercase tracking-wide">
          Upload destinations
        </p>

        {/* YouTube */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Toggle checked={uploadToYouTube} onChange={handleToggleYouTube} id="toggle-yt" />
            <label htmlFor="toggle-yt" className="text-sm font-medium text-drrop-text cursor-pointer select-none">
              Upload to YouTube
            </label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-drrop-muted">Remember</span>
            <Toggle size="sm" checked={rememberChannel} onChange={handleRememberChannel} id="remember-yt" />
          </div>
        </div>

        {/* Google Ads */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Toggle checked={uploadToGoogleAds} onChange={handleToggleGoogleAds} id="toggle-ads" />
              <label htmlFor="toggle-ads" className="text-sm font-medium text-drrop-text cursor-pointer select-none">
                Upload to Google Ads
              </label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-drrop-muted">Remember</span>
              <Toggle size="sm" checked={rememberAdsAccount} onChange={handleRememberAds} id="remember-ads" />
            </div>
          </div>

          {/* Account dropdown — visible when Google Ads toggle is ON */}
          {uploadToGoogleAds && (
            <div className="relative ml-0">
              <input
                type="text"
                placeholder={
                  selectedAdsAccount
                    ? `${selectedAdsAccount.name} — ${selectedAdsAccount.formattedId}`
                    : adsAccountsLoading
                    ? 'Loading accounts…'
                    : 'Search accounts…'
                }
                value={adsSearch}
                onChange={(e) => { setAdsSearch(e.target.value); setAdsDropdownOpen(true) }}
                onFocus={() => { setAdsDropdownOpen(true); if (adsAccounts.length === 0 && !adsAccountsLoading) fetchAdsAccounts() }}
                onBlur={() => setTimeout(() => setAdsDropdownOpen(false), 150)}
                disabled={adsAccountsLoading}
                className="w-full text-sm px-3 py-2 rounded-lg border border-drrop-border bg-drrop text-drrop-text placeholder:text-drrop-muted focus:border-lime focus:outline-none disabled:opacity-50"
              />

              {adsDropdownOpen && !adsAccountsLoading && (
                <div className="absolute top-full mt-1 left-0 right-0 z-20 rounded-lg border border-drrop-border bg-surface shadow-xl max-h-56 overflow-y-auto">
                  {adsAccountsError && (
                    <p className="px-3 py-3 text-sm text-red-400">{adsAccountsError}</p>
                  )}
                  {!adsAccountsError && filteredAdsAccounts.length === 0 && (
                    <p className="px-3 py-4 text-sm text-drrop-muted text-center">No accounts found</p>
                  )}
                  {!adsAccountsError && filteredAdsAccounts.map((account) => (
                    <button
                      key={account.id}
                      onMouseDown={() => selectAdsAccount(account)}
                      className="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-lime/5 transition text-left"
                    >
                      <span className="text-drrop-text truncate">{account.name}</span>
                      <span className="text-drrop-muted text-xs ml-3 shrink-0">{account.formattedId}</span>
                    </button>
                  ))}
                </div>
              )}

              {selectedAdsAccount && !adsDropdownOpen && (
                <p className="mt-1.5 text-xs text-lime">
                  ✓ {selectedAdsAccount.name} — {selectedAdsAccount.formattedId}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Drop zone ──────────────────────────────────────────────────── */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onClick={() => !atLimit && inputRef.current?.click()}
        className={[
          'rounded-xl border-2 border-dashed p-12 text-center transition-colors',
          atLimit
            ? 'cursor-not-allowed opacity-50 border-drrop-border bg-surface'
            : 'cursor-pointer border-drrop-border bg-surface hover:border-lime/50',
          dragging && !atLimit ? 'border-lime bg-lime/5' : '',
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
        <p className="text-drrop-muted text-sm">
          {atLimit
            ? 'Maximum 20 videos reached'
            : 'Drag & drop videos here, or click to select'}
        </p>
        <p className="text-drrop-border text-xs mt-1">{items.length} / 20 videos</p>
      </div>

      {items.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-drrop-subtle">
            Preview — edit titles before uploading
          </h2>

          {/* Video list */}
          <ul className="space-y-2">
            {items.map(item => (
              <li
                key={item.id}
                className="rounded-lg border border-drrop-border bg-surface px-4 py-3 space-y-2"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    {item.loading ? (
                      <div className="h-4 w-56 animate-pulse rounded bg-drrop-border" />
                    ) : item.uploadStatus === 'success' ? (
                      <p className="text-sm font-medium text-drrop-text truncate">
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
                        className="w-full text-sm text-drrop-text bg-transparent border-b border-transparent hover:border-drrop-border focus:border-lime focus:outline-none py-0.5 disabled:opacity-60"
                      />
                    )}
                    <p className="text-xs text-drrop-muted mt-0.5 truncate">
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
                      className="shrink-0 text-xs text-lime hover:underline"
                    >
                      ✓ View
                    </a>
                  )}
                  {item.uploadStatus === 'failed' && (
                    <button
                      onClick={() => retryItem(item)}
                      className="shrink-0 text-xs font-medium text-red-400 hover:text-red-300 transition"
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
                      className="shrink-0 text-drrop-border hover:text-red-400 transition text-xs leading-none"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                {item.uploadStatus === 'uploading' && (
                  <div className="w-full h-1.5 rounded-full bg-drrop-border overflow-hidden">
                    <div
                      className="h-full bg-lime rounded-full transition-all duration-150"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}

                {/* Error */}
                {item.uploadError && (
                  <p className="text-xs text-red-400">{item.uploadError}</p>
                )}
              </li>
            ))}
          </ul>

          {/* Batch settings */}
          <div className="rounded-lg border border-drrop-border bg-surface px-4 py-4 space-y-3">
            <p className="text-xs font-semibold text-drrop-muted uppercase tracking-wide">
              Batch settings
            </p>
            <div className="flex flex-wrap gap-5">
              {/* Privacy */}
              <div className="space-y-1.5">
                <p className="text-xs text-drrop-muted">Privacy</p>
                <div className="flex gap-1">
                  {(['public', 'unlisted', 'private'] as Privacy[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setBatchSettings(s => ({ ...s, privacy: p }))}
                      className={[
                        'px-2.5 py-1 text-xs rounded-md border transition capitalize',
                        batchSettings.privacy === p
                          ? 'bg-lime text-drrop border-lime font-semibold'
                          : 'bg-drrop text-drrop-subtle border-drrop-border hover:border-lime/50',
                      ].join(' ')}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Made for kids */}
              <div className="space-y-1.5">
                <p className="text-xs text-drrop-muted">Made for kids</p>
                <div className="flex gap-1">
                  {[false, true].map(val => (
                    <button
                      key={String(val)}
                      onClick={() => setBatchSettings(s => ({ ...s, madeForKids: val }))}
                      className={[
                        'px-2.5 py-1 text-xs rounded-md border transition',
                        batchSettings.madeForKids === val
                          ? 'bg-lime text-drrop border-lime font-semibold'
                          : 'bg-drrop text-drrop-subtle border-drrop-border hover:border-lime/50',
                      ].join(' ')}
                    >
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title suffix */}
              <div className="space-y-1.5 flex-1 min-w-48">
                <p className="text-xs text-drrop-muted">
                  Title suffix{' '}
                  <span className="text-drrop-border font-normal">
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
                  className="w-full text-sm px-2.5 py-1 rounded-md border border-drrop-border focus:border-lime focus:outline-none bg-drrop text-drrop-text placeholder:text-drrop-muted"
                />
              </div>
            </div>
          </div>

          {/* Session error */}
          {sessionError && (
            <p className="text-xs text-red-400">{sessionError}</p>
          )}

          {/* Upload button — only when there are idle videos */}
          {hasIdle && (
            <button
              onClick={startUpload}
              disabled={anyLoading || batchUploading}
              className="w-full rounded-full bg-lime text-drrop px-4 py-2.5 text-sm font-bold tracking-[-0.02em] hover:bg-[#d9ff6a] transition disabled:opacity-40 disabled:cursor-not-allowed"
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
