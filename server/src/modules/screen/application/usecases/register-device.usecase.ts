import { Device } from '@/core/entities/device.entity.ts'
import { IDeviceRepository } from '../../domain/ports/device-repository.interface.ts'
import { randomUUID } from 'crypto'
import { TokenGenerator } from '@/shared/infrastructure/services/token-generator.service.ts'

export type RegisterDeviceDTO = {
    connectionCode?: string
}

export class RegisterDeviceUsecase {
    constructor(
        private readonly deviceRepository: IDeviceRepository,
        private readonly tokenGenerator: TokenGenerator
    ) {}

    async execute(dto: RegisterDeviceDTO): Promise<Device> {
        const connectionCode = dto.connectionCode ?? this.generateConnectionCode()
        
        const existing = await this.deviceRepository.findByConnectionCode(connectionCode)
        if (existing) {
            existing.markOnline()
            await this.deviceRepository.save(existing)
            return existing
        }

        const token = await this.tokenGenerator.generate()

        const device = new Device({
            id: randomUUID(),
            screenId: null,
            token,
            connectionCode,
            createdAt: new Date(),
            updatedAt: new Date(),
            onlineAt: new Date(),
        })

        await this.deviceRepository.save(device)

        return device
    }

    private generateConnectionCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let code = ''
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return code
    }
}
