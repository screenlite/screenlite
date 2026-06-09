import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { PrismaClient } from '@/generated/prisma/client.ts'
import { MultipartUpload } from '@/core/entities/multipart-upload.entity.ts'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

const serializeSession = (session: any) => ({
    ...session,
    size: session.size.toString(),
    uploaded: session.uploaded.toString(),
})

export const createUploadSessionRoute = async (fastify: FastifyInstance) => {
    fastify.withTypeProvider<ZodTypeProvider>().post('/uploadSessions', {
        schema: {
            params: z.object({ workspaceId: z.string().uuid() }),
            body: z.object({
                name: z.string(),
                size: z.number(),
                mimeType: z.string(),
                folderId: z.string().optional(),
            }),
        },
        handler: async (request, reply) => {
            const { workspaceId } = request.params
            const { name, size, mimeType, folderId } = request.body
            const prisma = fastify.prisma as PrismaClient

            const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } })
            if (!workspace) return reply.status(404).send({ message: 'Workspace not found.' })

            const ext = path.extname(name)
            const sessionId = uuidv4()
            const filePath = `workspaces/${workspaceId}/${sessionId}${ext}`

            const multipartUpload = new MultipartUpload(filePath, mimeType)
            await fastify.multipartUpload.initializeUpload(multipartUpload)

            const session = await prisma.fileUploadSession.create({
                data: {
                    id: sessionId,
                    name,
                    path: filePath,
                    size,
                    mimeType,
                    workspaceId,
                    folderId: folderId || null,
                    userId: request.auth.userId ?? null,
                    uploadId: multipartUpload.isInitialized ? multipartUpload.uploadId : null,
                },
            })

            return reply.status(201).send({ fileUploadSession: serializeSession(session) })
        },
    })
}
