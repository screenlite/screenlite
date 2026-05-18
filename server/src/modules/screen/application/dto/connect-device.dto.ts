import { AuthContext } from '@/core/types/auth-context.type.ts'

export type ConnectDeviceDTO = {
    authContext: AuthContext
    workspaceId: string
    screenId: string
    connectionCode: string
}
