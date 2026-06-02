import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { fileKey } from '@/shared/schemas/file.schemas.ts'
import { PrismaClient } from '@/generated/prisma/client.ts'

export const getStreamRoute = async (fastify: FastifyInstance) => {
    fastify.withTypeProvider<ZodTypeProvider>().get('/stream/*', {
        schema: {
            params: z.object({ '*': fileKey })
        },
        config: {
            allowGuest: true,
            allowDeletedUser: true,
        }
    }, async (request, reply) => {
        const key = request.params['*']
        const prisma = fastify.prisma as PrismaClient
        const file = await prisma.file.findFirst({ where: { path: key } })
        const buffer = await fastify.storage.getFileBuffer(key)
        reply.header('Content-Type', file?.mimeType ?? 'application/octet-stream')
        reply.header('Content-Length', buffer.length)
        reply.header('Cache-Control', 'public, max-age=3600')
        reply.header('Accept-Ranges', 'bytes')
        return reply.send(buffer)
    })
}
