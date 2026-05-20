import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { PrismaClient } from '@/generated/prisma/client.ts'

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
            return reply.send({ success: true })
        }
    })
}

export default playlistGlobalRoutes
