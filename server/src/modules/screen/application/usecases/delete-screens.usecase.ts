import { DeleteScreensDTO } from '../dto/delete-screens.dto.ts'
import { IScreenRepository } from '../../domain/ports/screen-repository.interface.ts'
import { IWorkspaceAccessService } from '@/modules/workspace/domain/ports/workspace-access-service.interface.ts'
import { ScreenPolicy } from '../../domain/policies/screen.policy.ts'

export class DeleteScreensUsecase {
    constructor(
        private readonly screenRepository: IScreenRepository,
        private readonly workspaceAccessService: IWorkspaceAccessService
    ) {}

    async execute(dto: DeleteScreensDTO): Promise<void> {
        const { authContext, workspaceId, screenIds } = dto

        const workspaceAccess = await this.workspaceAccessService.checkAccess(
            workspaceId,
            authContext
        )

        ScreenPolicy.enforceManageScreens(authContext, workspaceAccess)

        await this.screenRepository.deleteMany(screenIds)
    }
}
