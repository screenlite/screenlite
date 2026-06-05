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
        const mimeType = file?.mimeType ?? 'application/octet-stream'
        const totalSize = buffer.length

        reply.header('Accept-Ranges', 'bytes')
        reply.header('Cache-Control', 'public, max-age=3600')
        reply.header('Content-Type', mimeType)

        const rangeHeader = (request.headers as any)['range']

        if (rangeHeader) {
            const match = rangeHeader.match(/bytes=(\d+)-(\d*)/)
            if (match) {
                const start = parseInt(match[1], 10)
                const end = match[2] ? parseInt(match[2], 10) : totalSize - 1
                const chunkSize = end - start + 1

                reply.status(206)
                reply.header('Content-Range', `bytes ${start}-${end}/${totalSize}`)
                reply.header('Content-Length', chunkSize)
                return reply.send(buffer.slice(start, end + 1))
            }
        }

        reply.header('Content-Length', totalSize)
        return reply.send(buffer)
    })
}
