import { WebSocketConnection } from '@/core/entities/websocket-connection.entity.ts'
import { PrismaClient } from '@/generated/prisma/client.ts'
import { IWebSocketSubscriptionRepository } from '@/core/ports/websocket-subscription.repository.interface.ts'
import { randomUUID } from 'crypto'

export const createTelemetryHandler = (
    prisma: PrismaClient,
    subscriptionRepository: IWebSocketSubscriptionRepository
) => {
    return async (connection: WebSocketConnection, message: any) => {
        const { data } = message

        if (!data) return

        // Get screenId from subscriptions
        const channels = await subscriptionRepository.getSubscribedChannels(connection.id)
        const screenChannel = channels.find(c => c.startsWith('screen:'))
        if (!screenChannel) return

        const screenId = screenChannel.replace('screen:', '')

        // Find device by screenId
        const device = await prisma.device.findFirst({ where: { screenId } })
        if (!device) return

        // Get public IP from socket
        const publicIpAddress = (connection.socket as any)._socket?.remoteAddress
            ?? (connection as any).remoteAddress
            ?? data.publicIpAddress
            ?? null

        // Delete old telemetry and insert fresh
        await prisma.deviceTelemetry.deleteMany({ where: { deviceId: device.id } })

        await prisma.deviceTelemetry.create({
            data: {
                id: randomUUID(),
                deviceId: device.id,
                softwareVersion: data.softwareVersion ?? null,
                platform: data.platform ?? null,
                hostname: data.hostname ?? null,
                timezone: data.timezone ?? null,
                localIpAddress: data.localIpAddress ?? null,
                publicIpAddress: publicIpAddress,
                macAddress: data.macAddress ?? null,
                osRelease: data.osRelease ?? null,
            }
        })
    }
}
