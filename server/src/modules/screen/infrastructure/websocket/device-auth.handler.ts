import { WebSocketConnection } from '@/core/entities/websocket-connection.entity.ts'
import { PrismaClient } from '@/generated/prisma/client.ts'
import { PrismaDeviceRepository } from '../repositories/prisma-device.repository.ts'
import { IWebSocketSubscriptionRepository } from '@/core/ports/websocket-subscription.repository.interface.ts'

export const createDeviceAuthHandler = (
    prisma: PrismaClient,
    subscriptionRepository: IWebSocketSubscriptionRepository
) => {
    return async (connection: WebSocketConnection, message: any) => {
        const { token } = message

        if (!token) {
            connection.socket.send(JSON.stringify({ type: 'auth_error', message: 'Token required' }))
            return
        }

        const deviceRepository = new PrismaDeviceRepository(prisma)
        const device = await deviceRepository.findByToken(token)

        if (!device || !device.screenId) {
            connection.socket.send(JSON.stringify({ type: 'auth_error', message: 'Invalid token or device not connected to screen' }))
            return
        }

        const channel = `screen:${device.screenId}`
        await subscriptionRepository.subscribe(connection.id, channel)

        const screen = await prisma.screen.findUnique({
            where: { id: device.screenId }
        })

        if (!screen) {
            connection.socket.send(JSON.stringify({ type: 'auth_error', message: 'Screen not found' }))
            return
        }

        // Get playlist via raw SQL since PlaylistScreen has no Prisma model
        const playlistRows: any[] = await prisma.$queryRaw`
            SELECT p.*, pl.id as layout_id, pl."resolutionWidth", pl."resolutionHeight"
            FROM "PlaylistScreen" ps
            JOIN "Playlist" p ON p.id = ps."playlistId"
            LEFT JOIN "PlaylistLayout" pl ON pl.id = p."playlistLayoutId"
            WHERE ps."screenId" = ${device.screenId}
            LIMIT 1
        `

        const playlistRow = playlistRows[0] ?? null

        let playlist = null
        if (playlistRow) {
            const sections: any[] = playlistRow.layout_id ? await prisma.$queryRaw`
                SELECT * FROM "PlaylistLayoutSection"
                WHERE "playlistLayoutId" = ${playlistRow.layout_id}
            ` : []

            const items: any[] = await prisma.$queryRaw`
                SELECT pi.*, f.id as file_id, f.name as file_name, f."mimeType", f.path
                FROM "PlaylistItem" pi
                LEFT JOIN "File" f ON f.id = pi."fileId"
                WHERE pi."playlistId" = ${playlistRow.id}
                ORDER BY pi."order" ASC
            `

            playlist = {
                id: playlistRow.id,
                name: playlistRow.name,
                layout: playlistRow.layout_id ? {
                    id: playlistRow.layout_id,
                    resolutionWidth: playlistRow.resolutionWidth,
                    resolutionHeight: playlistRow.resolutionHeight,
                    sections,
                } : null,
                items: items.map((item: any) => ({
                    id: item.id,
                    type: item.type,
                    duration: item.duration,
                    playlistLayoutSectionId: item.playlistLayoutSectionId,
                    file: item.file_id ? {
                        id: item.file_id,
                        name: item.file_name,
                        mimeType: item.mimeType,
                        path: item.path,
                    } : null,
                })),
            }
        }

        connection.socket.send(JSON.stringify({
            type: 'auth_success',
            screen: {
                id: screen.id,
                name: screen.name,
                resolutionWidth: screen.resolutionWidth,
                resolutionHeight: screen.resolutionHeight,
            },
            playlist
        }))
    }
}
