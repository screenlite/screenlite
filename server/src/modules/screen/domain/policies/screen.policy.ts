import { AuthContext } from '@/core/types/auth-context.type.ts'
import { WorkspaceAccess } from '@/modules/workspace/domain/value-objects/workspace-access.vo.ts'
import { ForbiddenError } from '@/shared/errors/forbidden.error.ts'

export class ScreenPolicy {
    static canManageScreens(
        authContext: AuthContext,
        workspaceAccess: WorkspaceAccess
    ): boolean {
        if (authContext.isUserContext() && workspaceAccess.hasAccess) {
            return true
        }
        if (workspaceAccess.apiKey) {
            return true
        }
        return false
    }

    static enforceManageScreens(
        authContext: AuthContext,
        workspaceAccess: WorkspaceAccess
    ): void {
        if (!this.canManageScreens(authContext, workspaceAccess)) {
            throw new ForbiddenError({
                details: {
                    permissions: ['YOU_CANNOT_MANAGE_SCREENS']
                }
            })
        }
    }

    static canViewScreens(
        authContext: AuthContext,
        workspaceAccess: WorkspaceAccess
    ): boolean {
        return this.canManageScreens(authContext, workspaceAccess)
    }

    static enforceViewScreens(
        authContext: AuthContext,
        workspaceAccess: WorkspaceAccess
    ): void {
        if (!this.canViewScreens(authContext, workspaceAccess)) {
            throw new ForbiddenError({
                details: {
                    permissions: ['YOU_CANNOT_VIEW_SCREENS']
                }
            })
        }
    }
}
