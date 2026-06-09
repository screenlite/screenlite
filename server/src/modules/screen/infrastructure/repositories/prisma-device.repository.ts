import { Prisma, PrismaClient } from '@/generated/prisma/client.ts'
import { IDeviceRepository } from '../../domain/ports/device-repository.interface.ts'
import { Device } from '@/core/entities/device.entity.ts'

export class PrismaDeviceRepository implements IDeviceRepository {
    constructor(private readonly prisma: PrismaClient | Prisma.TransactionClient) {}

    async findById(id: string): Promise<Device | null> {
        const data = await this.prisma.device.findUnique({
            where: { id }
        })
        return data ? this.toDomain(data) : null
    }

    async findByScreenId(screenId: string): Promise<Device | null> {
        const data = await this.prisma.device.findFirst({
            where: { screenId }
        })
        return data ? this.toDomain(data) : null
    }

    async findByConnectionCode(connectionCode: string): Promise<Device | null> {
        const data = await this.prisma.device.findUnique({
            where: { connectionCode }
        })
        return data ? this.toDomain(data) : null
    }

    async findByToken(token: string): Promise<Device | null> {
        const data = await this.prisma.device.findUnique({
            where: { token }
        })
        return data ? this.toDomain(data) : null
    }

    async save(device: Device): Promise<void> {
        await this.prisma.device.upsert({
            where: { id: device.id },
            create: {
                id: device.id,
                screenId: device.screenId,
                token: device.token,
                connectionCode: device.connectionCode,
                onlineAt: device.onlineAt,
            },
            update: {
                screenId: device.screenId,
                onlineAt: device.onlineAt,
                updatedAt: device.updatedAt,
            }
        })
    }

    async delete(id: string): Promise<void> {
        await this.prisma.device.delete({
            where: { id }
        })
    }

    private toDomain(data: any): Device {
        return new Device({
            id: data.id,
            screenId: data.screenId,
            token: data.token,
            connectionCode: data.connectionCode,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            onlineAt: data.onlineAt,
        })
    }
}
