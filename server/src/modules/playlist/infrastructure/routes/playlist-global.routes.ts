import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { PrismaClient } from '@/generated/prisma/client.ts'

const buildPlaylistPayload = async (prisma: PrismaClient, playlistId: string) => {
    const playlist = await prisma.playlist.findUnique({
        where: { id: playlistId },
        include: { playlistLayout: true }
    })

    const sections: any[] = playlist?.playlistLayout ? await prisma.$queryRaw`
        SELECT * FROM "PlaylistLayoutSection"
        WHERE "playlistLayoutId" = ${playlist.playlistLayout.id}
    ` : []

    const items: any[] = await prisma.$queryRaw`
        SELECT pi.*, f.id as file_id, f.name as file_name, f."mimeType", f.path
        FROM "PlaylistItem" pi
        LEFT JOIN "File" f ON f.id = pi."fileId"
        WHERE pi."playlistId" = ${playlistId}
        ORDER BY pi."order" ASC
    `

    return {
        id: playlistId,
        name: playlist?.name,
        layout: playlist?.playlistLayout ? {
            id: playlist.playlistLayout.id,
            resolutionWidth: playlist.playlistLayout.resolutionWidth,
            resolutionHeight: playlist.playlistLayout.resolutionHeight,
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

const playlistGlobalRoutes = async (fastify: FastifyInstance) => {
    const ztp = fastify.withTypeProvider<ZodTypeProvider>()
    const prisma = (fastify as any).prisma as PrismaClient

    ztp.get('/:playlistId/screens', {
        schema: { params: z.object({ playlistId: z.string() }) },
        handler: async (request, reply) => {
            const screens = await prisma.$queryRaw`
                SELECT s.* FROM "PlaylistScreen" ps
                JOIN "Screen" s ON s.id = ps."screenId"
                WHERE ps."playlistId" = ${request.params.playlistId}
            `
            return reply.send({ screens })
        }
    })

    ztp.post('/addScreens', {
        schema: { body: z.object({ playlistId: z.string(), screenIds: z.array(z.string()) }) },
        handler: async (request, reply) => {
            const { playlistId, screenIds } = request.body

            for (const screenId of screenIds) {
                await prisma.$executeRaw`
                    INSERT INTO "PlaylistScreen" ("playlistId", "screenId")
                    VALUES (${playlistId}, ${screenId})
                    ON CONFLICT ("playlistId", "screenId") DO NOTHING
                `
            }

            // Broadcast playlist_updated to each newly assigned screen
            try {
                const playlist = await buildPlaylistPayload(prisma, playlistId)
                const message = JSON.stringify({ type: 'playlist_updated', playlist })
                for (const screenId of screenIds) {
                    await fastify.websocket.broadcaster.broadcastToChannel(
                        `screen:${screenId}`,
                        message
                    )
                }
            } catch (e) {
                fastify.log.error('Failed to broadcast playlist_updated after addScreens: ' + e)
            }

            return reply.send({ success: true })
        }
    })

    ztp.post('/removeScreens', {
        schema: { body: z.object({ playlistId: z.string(), screenIds: z.array(z.string()) }) },
        handler: async (request, reply) => {
            const { playlistId, screenIds } = request.body

            await prisma.$executeRaw`
                DELETE FROM "PlaylistScreen"
                WHERE "playlistId" = ${playlistId}
                AND "screenId" = ANY(${screenIds}::text[])
            `

            // Broadcast empty playlist to disconnected screens
            try {
                const message = JSON.stringify({ type: 'playlist_updated', playlist: null })
                for (const screenId of screenIds) {
                    await fastify.websocket.broadcaster.broadcastToChannel(
                        `screen:${screenId}`,
                        message
                    )
                }
            } catch (e) {
                fastify.log.error('Failed to broadcast playlist_updated after removeScreens: ' + e)
            }

            return reply.send({ success: true })
        }
    })
}

export default playlistGlobalRoutes
