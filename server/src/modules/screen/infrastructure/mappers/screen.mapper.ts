import { Screen } from '@/core/entities/screen.entity.ts'

export type ScreenDTO = {
    id: string
    workspaceId: string
    groupId: string | null
    name: string
    layoutRotation: string
    layoutResolution: { width: number, height: number }
    resolutionWidth: number
    resolutionHeight: number
    type: string
    createdAt: string
    updatedAt: string
    playlists?: { playlistId: string }[]
    _count: { playlists: number }
    device: {
        id: string
        connectionCode: string
        onlineAt: string
        createdAt: string
        updatedAt: string
        isOnline: boolean
    } | null
}

export class ScreenMapper {
    toDTO(screen: Screen): ScreenDTO {
        return {
            id: screen.id,
            workspaceId: screen.workspaceId,
            groupId: screen.groupId,
            name: screen.name,
            layoutRotation: screen.layoutRotation,
            layoutResolution: {
                width: screen.resolutionWidth ?? 1920,
                height: screen.resolutionHeight ?? 1080,
            },
            resolutionWidth: screen.resolutionWidth,
            resolutionHeight: screen.resolutionHeight,
            type: screen.type,
            createdAt: screen.createdAt.toISOString(),
            updatedAt: screen.updatedAt.toISOString(),
            playlists: screen.playlists ?? [],
            _count: { playlists: (screen.playlists ?? []).length },
            device: screen.device ? {
                id: screen.device.id,
                connectionCode: screen.device.connectionCode,
                onlineAt: screen.device.onlineAt.toISOString(),
                createdAt: screen.device.createdAt.toISOString(),
                updatedAt: screen.device.updatedAt.toISOString(),
                isOnline: (Date.now() - screen.device.onlineAt.getTime()) < 60000,
            } : null,
        }
    }
}
