import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { PrismaClient } from '@/generated/prisma/client.ts'
import { MultipartUpload } from '@/core/entities/multipart-upload.entity.ts'

export const cancelUploadSessionRoute = async (fastify: FastifyInstance) => {
    fastify.withTypeProvider<ZodTypeProvider>().post('/uploadSessions/:sessionId/cancel', {
        schema: {
            params: z.object({
                workspaceId: z.string().uuid(),
                sessionId: z.string(),
            }),
        },
        handler: async (request, reply) => {
            const { workspaceId, sessionId } = request.params
            const prisma = fastify.prisma as PrismaClient

            const session = await prisma.fileUploadSession.findFirst({
                where: { id: sessionId, workspaceId },
            })
            if (!session) return reply.status(404).send({ message: 'Upload session not found.' })

            const multipartUpload = new MultipartUpload(session.path, session.mimeType)
            if (session.uploadId) multipartUpload.setUploadId(session.uploadId)

            await fastify.multipartUpload.abortUpload(multipartUpload)

            await prisma.fileUploadSession.update({
                where: { id: sessionId },
                data: { cancelledAt: new Date() },
            })

            return reply.status(200).send({ success: true })
        },
    })
}
