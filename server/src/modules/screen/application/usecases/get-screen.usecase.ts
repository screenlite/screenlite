import { Screen } from '@/core/entities/screen.entity.ts'
import { IScreenRepository } from '../../domain/ports/screen-repository.interface.ts'
import { IWorkspaceAccessService } from '@/modules/workspace/domain/ports/workspace-access-service.interface.ts'
import { ScreenPolicy } from '../../domain/policies/screen.policy.ts'
import { NotFoundError } from '@/shared/errors/not-found.error.ts'
import { AuthContext } from '@/core/types/auth-context.type.ts'

export class GetScreenUsecase {
    constructor(
        private readonly screenRepository: IScreenRepository,
        private readonly workspaceAccessService: IWorkspaceAccessService
    ) {}

    async execute(
        screenId: string,
        workspaceId: string,
        authContext: AuthContext
    ): Promise<Screen> {
        const workspaceAccess = await this.workspaceAccessService.getWorkspaceAccess(
            workspaceId,
            authContext
        )

        ScreenPolicy.enforceViewScreens(authContext, workspaceAccess)

        const screen = await this.screenRepository.findById(screenId)

        if (!screen || screen.workspaceId !== workspaceId) {
            throw new NotFoundError({
                details: { screen: ['SCREEN_NOT_FOUND'] }
            })
        }

        return screen
    }
}
