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
            _count: { playlists: 0 },
        }
    }
}
