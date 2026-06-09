import { AuthContext } from '@/core/types/auth-context.type.ts'
import { ScreenType } from '@/core/entities/screen.entity.ts'

export type CreateScreenDTO = {
    authContext: AuthContext
    workspaceId: string
    name: string
    type: ScreenType
}
