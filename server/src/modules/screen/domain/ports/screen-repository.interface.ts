import { Screen } from '@/core/entities/screen.entity.ts'

export interface IScreenRepository {
    findById(id: string): Promise<Screen | null>
    findByWorkspaceId(workspaceId: string): Promise<Screen[]>
    save(screen: Screen): Promise<void>
    deleteMany(ids: string[]): Promise<void>
}
