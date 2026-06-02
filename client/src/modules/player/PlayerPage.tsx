import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'

type Section = {
    id: string
    name: string
    top: number
    left: number
    width: number
    height: number
    zIndex: number
}

type FileItem = {
    id: string
    name: string
    mimeType: string
    path: string
}

type PlaylistItem = {
    id: string
    type: string
    duration: number | null
    playlistLayoutSectionId: string | null
    file: FileItem | null
}

type Layout = {
    id: string
    resolutionWidth: number
    resolutionHeight: number
    sections: Section[]
}

type Playlist = {
    id: string
    name: string
    layout: Layout | null
    items: PlaylistItem[]
}

type Screen = {
    id: string
    name: string
    resolutionWidth: number
    resolutionHeight: number
}

const CACHE_KEY = 'screenlite_cached_playlist'

const getFileUrl = (path: string) => {
    return `${window.location.origin}/api/file-delivery/stream/${path}`
}

const savePlaylistToCache = (playlist: Playlist) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(playlist))
    } catch (e) {
        console.warn('Failed to cache playlist', e)
    }
}

const loadPlaylistFromCache = (): Playlist | null => {
    try {
        const cached = localStorage.getItem(CACHE_KEY)
        return cached ? JSON.parse(cached) : null
    } catch (e) {
        return null
    }
}

const SectionPlayer = ({ section, items, resolution }: {
    section: Section
    items: PlaylistItem[]
    resolution: { width: number, height: number }
}) => {
    const sectionItems = items.filter(i => i.playlistLayoutSectionId === section.id)
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        if (sectionItems.length === 0) return
        const item = sectionItems[currentIndex]
        const duration = (item.duration ?? 10) * 1000
        const timer = setTimeout(() => {
            setCurrentIndex(prev => (prev + 1) % sectionItems.length)
        }, duration)
        return () => clearTimeout(timer)
    }, [currentIndex, sectionItems])

    const scaleX = 100 / resolution.width
    const scaleY = 100 / resolution.height

    const style = {
        position: 'absolute' as const,
        left: `${section.left * scaleX}%`,
        top: `${section.top * scaleY}%`,
        width: `${section.width * scaleX}%`,
        height: `${section.height * scaleY}%`,
        zIndex: section.zIndex,
        overflow: 'hidden' as const,
        backgroundColor: '#000',
    }

    if (sectionItems.length === 0) {
        return <div style={style} />
    }

    const current = sectionItems[currentIndex]

    return (
        <div style={style}>
            {current.file && current.file.mimeType.startsWith('video/') ? (
                <video
                    key={current.id}
                    src={getFileUrl(current.file.path)}
                    autoPlay
                    muted
                    loop
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onEnded={() => setCurrentIndex(prev => (prev + 1) % sectionItems.length)}
                />
            ) : current.file && current.file.mimeType.startsWith('image/') ? (
                <img
                    key={current.id}
                    src={getFileUrl(current.file.path)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    alt={current.file.name}
                />
            ) : (
                <div style={{ color: 'white', padding: 8 }}>{current.file?.name}</div>
            )}
        </div>
    )
}

export const PlayerPage = () => {
    const { screenId } = useParams<{ screenId: string }>()
    const [screen, setScreen] = useState<Screen | null>(null)
    const [playlist, setPlaylist] = useState<Playlist | null>(() => loadPlaylistFromCache())
    const [status, setStatus] = useState<'connecting' | 'auth_error' | 'connected' | 'no_playlist'>(
        loadPlaylistFromCache() ? 'connected' : 'connecting'
    )
    const wsRef = useRef<WebSocket | null>(null)
    const tokenRef = useRef<string | null>(null)

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const token = params.get('token')
        if (token) {
            tokenRef.current = token
            localStorage.setItem('screenlite_device_token', token)
        } else {
            tokenRef.current = localStorage.getItem('screenlite_device_token')
        }

        const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`

        const connect = () => {
            const ws = new WebSocket(wsUrl)
            wsRef.current = ws

            ws.onopen = () => {
                ws.send(JSON.stringify({ type: 'auth', token: tokenRef.current }))
            }

            ws.onmessage = (event) => {
                const msg = JSON.parse(event.data)

                if (msg.type === 'auth_success') {
                    setScreen(msg.screen)
                    if (msg.playlist) {
                        setPlaylist(msg.playlist)
                        savePlaylistToCache(msg.playlist)
                        setStatus('connected')
                    } else {
                        const cached = loadPlaylistFromCache()
                        if (cached) {
                            setPlaylist(cached)
                            setStatus('connected')
                        } else {
                            setStatus('no_playlist')
                        }
                    }
                } else if (msg.type === 'auth_error') {
                    // Don't show error if we have cached content
                    const cached = loadPlaylistFromCache()
                    if (!cached) setStatus('auth_error')
                } else if (msg.type === 'playlist_updated') {
                    if (msg.playlist) {
                        setPlaylist(msg.playlist)
                        savePlaylistToCache(msg.playlist)
                        setStatus('connected')
                    } else {
                        setStatus('no_playlist')
                    }
                }
            }

            ws.onclose = () => {
                // Keep playing cached content on disconnect
                const cached = loadPlaylistFromCache()
                if (cached && status !== 'connected') {
                    setPlaylist(cached)
                    setStatus('connected')
                }
                setTimeout(connect, 3000)
            }

            // Send heartbeat every 25 seconds to update online status
            const heartbeatInterval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'heartbeat' }))
                }
            }, 25000)

            ws.addEventListener('close', () => clearInterval(heartbeatInterval))

            ws.onerror = () => {
                ws.close()
            }
        }

        connect()

        return () => {
            wsRef.current?.close()
        }
    }, [screenId])

    if (status === 'connecting' && !playlist) {
        return (
            <div style={{ background: '#000', width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                Connecting...
            </div>
        )
    }

    if (status === 'auth_error' && !playlist) {
        return (
            <div style={{ background: '#000', width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'red' }}>
                Authentication failed. Check device token.
            </div>
        )
    }

    if ((status === 'no_playlist' || !playlist?.layout) && !playlist) {
        return (
            <div style={{ background: '#000', width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                {screen?.name} — No playlist assigned
            </div>
        )
    }

    if (!playlist?.layout) {
        return (
            <div style={{ background: '#000', width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                {screen?.name} — No layout assigned to playlist
            </div>
        )
    }

    return (
        <div style={{ background: '#000', width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
            {playlist.layout.sections.map(section => (
                <SectionPlayer
                    key={section.id}
                    section={section}
                    items={playlist.items}
                    resolution={{ width: playlist.layout!.resolutionWidth, height: playlist.layout!.resolutionHeight }}
                />
            ))}
        </div>
    )
}
