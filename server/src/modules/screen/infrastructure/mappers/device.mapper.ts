import { Device } from '@/core/entities/device.entity.ts'

export type DeviceDTO = {
    id: string
    screenId: string | null
    connectionCode: string
    createdAt: string
    updatedAt: string
    onlineAt: string
}

export class DeviceMapper {
    toDTO(device: Device): DeviceDTO {
        return {
            id: device.id,
            screenId: device.screenId,
            connectionCode: device.connectionCode,
            createdAt: device.createdAt.toISOString(),
            updatedAt: device.updatedAt.toISOString(),
            onlineAt: device.onlineAt.toISOString(),
        }
    }
}
