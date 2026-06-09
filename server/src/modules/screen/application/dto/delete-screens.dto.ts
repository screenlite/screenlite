import { AuthContext } from '@/core/types/auth-context.type.ts'

export type DeleteScreensDTO = {
    authContext: AuthContext
    workspaceId: string
    screenIds: string[]
}
