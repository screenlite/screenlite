import { Screen, ScreenType } from '@/core/entities/screen.entity.ts'
import { CreateScreenDTO } from '../dto/create-screen.dto.ts'
import { IScreenRepository } from '../../domain/ports/screen-repository.interface.ts'
import { IWorkspaceRepository } from '@/modules/workspace/domain/ports/workspace-repository.interface.ts'
import { IWorkspaceAccessService } from '@/modules/workspace/domain/ports/workspace-access-service.interface.ts'
import { ScreenPolicy } from '../../domain/policies/screen.policy.ts'
import { NotFoundError } from '@/shared/errors/not-found.error.ts'
import { randomUUID } from 'crypto'

export class CreateScreenUsecase {
    constructor(
        private readonly screenRepository: IScreenRepository,
        private readonly workspaceRepository: IWorkspaceRepository,
        private readonly workspaceAccessService: IWorkspaceAccessService
    ) {}

    async execute(dto: CreateScreenDTO): Promise<Screen> {
        const { authContext, workspaceId, name, type } = dto

        const workspace = await this.workspaceRepository.findById(workspaceId)
        if (!workspace) {
            throw new NotFoundError({
                details: { workspace: ['WORKSPACE_NOT_FOUND'] }
            })
        }

        const workspaceAccess = await this.workspaceAccessService.getWorkspaceAccess(
            workspaceId,
            authContext
        )

        ScreenPolicy.enforceManageScreens(authContext, workspaceAccess)

        const screen = new Screen({
            id: randomUUID(),
            workspaceId,
            groupId: null,
            name,
            layoutRotation: 'R0',
            resolutionWidth: 1920,
            resolutionHeight: 1080,
            type,
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        await this.screenRepository.save(screen)

        return screen
    }
}
