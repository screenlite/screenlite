import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { PrismaClient } from '@/generated/prisma/client.ts'

const serializeFile = (f: any) => ({ ...f, size: f.size?.toString?.() ?? '0' })

const fileManagementRoutes = async (fastify: FastifyInstance) => {
    const ztp = fastify.withTypeProvider<ZodTypeProvider>()
    const prisma = fastify.prisma as PrismaClient

    ztp.get('/', {
        schema: {
            params: z.object({ workspaceId: z.string().uuid() }),
            querystring: z.object({ folderId: z.string().optional(), page: z.coerce.number().optional(), limit: z.coerce.number().optional(), search: z.string().optional() }),
        },
        handler: async (request, reply) => {
            const { workspaceId } = request.params
            const { folderId, page = 1, limit = 20, search } = request.query
            const where: any = { workspaceId, deletedAt: null, ...(folderId !== undefined ? { folderId } : {}) }
            if (search) where.name = { contains: search, mode: 'insensitive' }
            const [items, total] = await Promise.all([
                prisma.file.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
                prisma.file.count({ where }),
            ])
            return reply.send({ items: items.map(serializeFile), meta: { total, totalPages: Math.max(1, Math.ceil(total / limit)), currentPage: page, limit } })
        }
    })

    ztp.get('/:fileId', {
        schema: { params: z.object({ workspaceId: z.string().uuid(), fileId: z.string() }) },
        handler: async (request, reply) => {
            const file = await prisma.file.findFirst({ where: { id: request.params.fileId, workspaceId: request.params.workspaceId } })
            if (!file) return reply.status(404).send({ message: 'File not found.' })
            return reply.send({ file: serializeFile(file) })
        }
    })

    ztp.post('/delete', {
        schema: { params: z.object({ workspaceId: z.string().uuid() }), body: z.object({ fileIds: z.array(z.string()) }) },
        handler: async (request, reply) => {
            await prisma.file.updateMany({ where: { id: { in: request.body.fileIds } }, data: { deletedAt: new Date(), updatedAt: new Date() } })
            return reply.send({ success: true })
        }
    })

    ztp.post('/move', {
        schema: { params: z.object({ workspaceId: z.string().uuid() }), body: z.object({ fileIds: z.array(z.string()), folderId: z.string().nullable().optional(), targetFolderId: z.string().nullable().optional() }) },
        handler: async (request, reply) => {
            await prisma.file.updateMany({ where: { id: { in: request.body.fileIds } }, data: { folderId: request.body.folderId ?? request.body.targetFolderId, updatedAt: new Date() } })
            return reply.send({ success: true })
        }
    })

    ztp.get('/:fileId/playlists', {
        schema: { params: z.object({ workspaceId: z.string().uuid(), fileId: z.string() }) },
        handler: async (request, reply) => {
            const items = await prisma.playlistItem.findMany({
                where: { fileId: request.params.fileId },
                include: { playlist: true }
            })
            return reply.send({ playlists: items.map((i: any) => i.playlist) })
        }
    })
}

export default fileManagementRoutes
