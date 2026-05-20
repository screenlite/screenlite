import { Screen } from '@/core/entities/screen.entity.ts'
import { IScreenRepository } from '../../domain/ports/screen-repository.interface.ts'
import { IWorkspaceAccessService } from '@/modules/workspace/domain/ports/workspace-access-service.interface.ts'
import { ScreenPolicy } from '../../domain/policies/screen.policy.ts'
import { AuthContext } from '@/core/types/auth-context.type.ts'

export class GetWorkspaceScreensUsecase {
    constructor(
        private readonly screenRepository: IScreenRepository,
        private readonly workspaceAccessService: IWorkspaceAccessService
    ) {}

    async execute(
        workspaceId: string,
        authContext: AuthContext
    ): Promise<Screen[]> {
        const workspaceAccess = await this.workspaceAccessService.checkAccess(
            workspaceId,
            authContext
        )

        ScreenPolicy.enforceViewScreens(authContext, workspaceAccess)

        return this.screenRepository.findByWorkspaceId(workspaceId)
    }
}
