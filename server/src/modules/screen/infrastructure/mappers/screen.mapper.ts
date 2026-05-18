import { Screen } from '@/core/entities/screen.entity.ts'

export type ScreenDTO = {
    id: string
    workspaceId: string
    groupId: string | null
    name: string
    layoutRotation: string
    resolutionWidth: number
    resolutionHeight: number
    type: string
    createdAt: string
    updatedAt: string
}

export class ScreenMapper {
    toDTO(screen: Screen): ScreenDTO {
        return {
            id: screen.id,
            workspaceId: screen.workspaceId,
            groupId: screen.groupId,
            name: screen.name,
            layoutRotation: screen.layoutRotation,
            resolutionWidth: screen.resolutionWidth,
            resolutionHeight: screen.resolutionHeight,
            type: screen.type,
            createdAt: screen.createdAt.toISOString(),
            updatedAt: screen.updatedAt.toISOString(),
        }
    }
}
