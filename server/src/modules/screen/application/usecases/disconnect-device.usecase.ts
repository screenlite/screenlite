import { DisconnectDeviceDTO } from '../dto/disconnect-device.dto.ts'
import { IScreenRepository } from '../../domain/ports/screen-repository.interface.ts'
import { IDeviceRepository } from '../../domain/ports/device-repository.interface.ts'
import { IWorkspaceAccessService } from '@/modules/workspace/domain/ports/workspace-access-service.interface.ts'
import { ScreenPolicy } from '../../domain/policies/screen.policy.ts'
import { NotFoundError } from '@/shared/errors/not-found.error.ts'

export class DisconnectDeviceUsecase {
    constructor(
        private readonly screenRepository: IScreenRepository,
        private readonly deviceRepository: IDeviceRepository,
        private readonly workspaceAccessService: IWorkspaceAccessService
    ) {}

    async execute(dto: DisconnectDeviceDTO): Promise<void> {
        const { authContext, workspaceId, screenId } = dto

        const workspaceAccess = await this.workspaceAccessService.checkAccess(
            workspaceId,
            authContext
        )

        ScreenPolicy.enforceManageScreens(authContext, workspaceAccess)

        const screen = await this.screenRepository.findById(screenId)
        if (!screen || screen.workspaceId !== workspaceId) {
            throw new NotFoundError({
                details: { screen: ['SCREEN_NOT_FOUND'] }
            })
        }

        const device = await this.deviceRepository.findByScreenId(screenId)
        if (!device) {
            throw new NotFoundError({
                details: { device: ['DEVICE_NOT_FOUND'] }
            })
        }

        device.disconnectFromScreen()
        await this.deviceRepository.save(device)
    }
}
