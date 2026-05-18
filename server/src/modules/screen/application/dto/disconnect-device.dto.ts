import { AuthContext } from '@/core/types/auth-context.type.ts'

export type DisconnectDeviceDTO = {
    authContext: AuthContext
    workspaceId: string
    screenId: string
}
