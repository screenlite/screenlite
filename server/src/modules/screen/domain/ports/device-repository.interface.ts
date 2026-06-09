import { Device } from '@/core/entities/device.entity.ts'

export interface IDeviceRepository {
    findById(id: string): Promise<Device | null>
    findByScreenId(screenId: string): Promise<Device | null>
    findByConnectionCode(connectionCode: string): Promise<Device | null>
    findByToken(token: string): Promise<Device | null>
    save(device: Device): Promise<void>
    delete(id: string): Promise<void>
}
