import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { PrismaClient } from '@/generated/prisma/client.ts'
import { MultipartUpload } from '@/core/entities/multipart-upload.entity.ts'
import { Readable } from 'stream'

export const uploadPartRoute = async (fastify: FastifyInstance) => {
    fastify.withTypeProvider<ZodTypeProvider>().put('/uploadSessions/:sessionId/uploadPart', {
        schema: {
            params: z.object({
                workspaceId: z.string().uuid(),
                sessionId: z.string(),
            }),
        },
        config: { acceptOctetStream: true },
        handler: async (request, reply) => {
            const { workspaceId, sessionId } = request.params
            const prisma = fastify.prisma as PrismaClient
            const session = await prisma.fileUploadSession.findFirst({
                where: { id: sessionId, workspaceId },
            })
            if (!session) return reply.status(404).send({ message: 'Upload session not found.' })
            if (session.cancelledAt) return reply.status(400).send({ message: 'Upload session cancelled.' })
            const body = request.body as Buffer
            const contentLength = body?.length ?? parseInt(request.headers['content-length'] || '0', 10)
            if (!contentLength) return reply.status(400).send({ message: 'Empty body.' })
            const partNumber = session.uploadedParts + 1
            const multipartUpload = new MultipartUpload(session.path, session.mimeType)
            if (session.uploadId) multipartUpload.setUploadId(session.uploadId)
            const stream = Readable.from(body)
            await fastify.multipartUpload.uploadPart(multipartUpload, stream, partNumber, contentLength)
            const newUploaded = BigInt(session.uploaded.toString()) + BigInt(contentLength)
            const isComplete = newUploaded >= BigInt(session.size.toString())
            const updatedSession = await prisma.fileUploadSession.update({
                where: { id: sessionId },
                data: {
                    uploaded: newUploaded,
                    uploadedParts: partNumber,
                    completedAt: isComplete ? new Date() : null,
                },
            })
            if (isComplete) {
                await fastify.multipartUpload.completeUpload(multipartUpload)
                const ext = session.name.split('.').pop() || ''
                const mimeType = session.mimeType
                const fileType = mimeType.startsWith('image/') ? 'IMAGE'
                    : mimeType.startsWith('video/') ? 'VIDEO'
                    : mimeType.startsWith('audio/') ? 'AUDIO'
                    : 'DOCUMENT'
                await prisma.file.create({
                    data: {
                        id: sessionId,
                        workspaceId,
                        name: session.name,
                        extension: ext,
                        mimeType: session.mimeType,
                        size: session.size,
                        type: fileType,
                        path: session.path,
                        uploaderId: session.userId ?? null,
                        uploadSessionId: sessionId,
                        folderId: session.folderId || null,
                        processingStatus: 'PENDING',
                        updatedAt: new Date(),
                    },
                })
            }
            return reply.status(200).send({ fileUploadSession: { ...updatedSession, size: updatedSession.size.toString(), uploaded: updatedSession.uploaded.toString() } })
        },
    })
}
