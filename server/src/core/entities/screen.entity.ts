import { Device } from './device.entity.ts'

export type ScreenType =
    | 'consumer_tv'
    | 'commercial_display'
    | 'touchscreen_display'
    | 'video_wall'
    | 'led_screen'
    | 'kiosk'
    | 'projector'
    | 'tablet'
    | 'smartphone'
    | 'digital_frame'
    | 'other'

export type LayoutRotation = 'R0' | 'R90' | 'R180' | 'R270'

export type ScreenProps = {
    id: string
    workspaceId: string
    groupId: string | null
    name: string
    layoutRotation: LayoutRotation
    resolutionWidth: number
    resolutionHeight: number
    type: ScreenType
    createdAt: Date
    updatedAt: Date
    playlists?: { playlistId: string }[]
    device?: Device | null
}

export class Screen {
    public readonly id: string
    public readonly workspaceId: string
    public groupId: string | null
    public name: string
    public layoutRotation: LayoutRotation
    public resolutionWidth: number
    public resolutionHeight: number
    public type: ScreenType
    public readonly createdAt: Date
    public updatedAt: Date
    public playlists: { playlistId: string }[]
    public device: Device | null

    constructor(props: ScreenProps) {
        this.id = props.id
        this.workspaceId = props.workspaceId
        this.groupId = props.groupId
        this.name = props.name
        this.layoutRotation = props.layoutRotation
        this.resolutionWidth = props.resolutionWidth
        this.resolutionHeight = props.resolutionHeight
        this.type = props.type
        this.createdAt = props.createdAt
        this.updatedAt = props.updatedAt
        this.playlists = props.playlists ?? []
        this.device = props.device ?? null
    }
}
