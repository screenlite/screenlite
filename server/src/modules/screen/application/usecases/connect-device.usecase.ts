import { Device } from '@/core/entities/device.entity.ts'
import { ConnectDeviceDTO } from '../dto/connect-device.dto.ts'
import { IScreenRepository } from '../../domain/ports/screen-repository.interface.ts'
import { IDeviceRepository } from '../../domain/ports/device-repository.interface.ts'
import { IWorkspaceAccessService } from '@/modules/workspace/domain/ports/workspace-access-service.interface.ts'
import { ScreenPolicy } from '../../domain/policies/screen.policy.ts'
import { NotFoundError } from '@/shared/errors/not-found.error.ts'
import { randomUUID } from 'crypto'
import { TokenGenerator } from '@/shared/infrastructure/services/token-generator.service.ts'

export class ConnectDeviceUsecase {
    constructor(
        private readonly screenRepository: IScreenRepository,
        private readonly deviceRepository: IDeviceRepository,
        private readonly workspaceAccessService: IWorkspaceAccessService,
        private readonly tokenGenerator: TokenGenerator
    ) {}

    async execute(dto: ConnectDeviceDTO): Promise<Device> {
        const { authContext, workspaceId, screenId, connectionCode } = dto

        const workspaceAccess = await this.workspaceAccessService.getWorkspaceAccess(
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

        const device = await this.deviceRepository.findByConnectionCode(connectionCode)
        if (!device) {
            throw new NotFoundError({
                details: { device: ['DEVICE_NOT_FOUND'] }
            })
        }

        device.connectToScreen(screenId)
        device.markOnline()

        await this.deviceRepository.save(device)

        return device
    }
}
