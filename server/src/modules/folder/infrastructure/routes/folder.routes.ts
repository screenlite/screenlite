import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { PrismaClient } from '@/generated/prisma/client.ts'

const folderRoutes = async (fastify: FastifyInstance) => {
    const ztp = fastify.withTypeProvider<ZodTypeProvider>()
    const prisma = fastify.prisma as PrismaClient

    ztp.get('/', {
        schema: { params: z.object({ workspaceId: z.string().uuid() }), querystring: z.object({ parentId: z.string().optional(), search: z.string().optional() }) },
        handler: async (request, reply) => {
            const where: any = { workspaceId: request.params.workspaceId, parentId: request.query.parentId ?? null, deletedAt: null }
            if (request.query.search) where.name = { contains: request.query.search, mode: 'insensitive' }
            const folders = await prisma.folder.findMany({
                where,
                orderBy: { name: 'asc' },
                include: { _count: { select: { files: true, subfolders: true } } }
            })
            const foldersWithCount = folders.map((f: any) => ({
                ...f,
                _count: { files: f._count.files, subfolders: f._count.subfolders }
            }))
            return reply.send({ folders: foldersWithCount })
        }
    })

    ztp.post('/', {
        schema: { params: z.object({ workspaceId: z.string().uuid() }), body: z.object({ name: z.string(), parentId: z.string().nullable().optional() }) },
        handler: async (request, reply) => {
            const folder = await prisma.folder.create({
                data: { id: uuidv4(), name: request.body.name, workspaceId: request.params.workspaceId, parentId: request.body.parentId ?? null, updatedAt: new Date() },
                include: { _count: { select: { files: true, subfolders: true } } }
            })
            return reply.status(201).send({ folder })
        }
    })

    ztp.get('/:folderId', {
        schema: { params: z.object({ workspaceId: z.string().uuid(), folderId: z.string() }) },
        handler: async (request, reply) => {
            const { folderId, workspaceId } = request.params
            const folder = await prisma.folder.findFirst({
                where: { id: folderId, workspaceId },
                include: { _count: { select: { files: true, subfolders: true } } }
            })
            if (!folder) return reply.status(404).send({ message: 'Folder not found.' })

            // Build parent folder tree
            const parentFolders: any[] = []
            let currentParentId = folder.parentId
            while (currentParentId) {
                const parent: any = await prisma.folder.findUnique({ where: { id: currentParentId } })
                if (!parent) break
                parentFolders.unshift(parent)
                currentParentId = parent.parentId
            }

            return reply.send({ folder, parentFolders })
        }
    })

    ztp.post('/delete', {
        schema: { params: z.object({ workspaceId: z.string().uuid() }), body: z.object({ folderIds: z.array(z.string()) }) },
        handler: async (request, reply) => {
            await prisma.folder.updateMany({ where: { id: { in: request.body.folderIds } }, data: { deletedAt: new Date(), updatedAt: new Date() } })
            return reply.send({ success: true })
        }
    })

    ztp.post('/move', {
        schema: { params: z.object({ workspaceId: z.string().uuid() }), body: z.object({ folderIds: z.array(z.string()), parentId: z.string().nullable() }) },
        handler: async (request, reply) => {
            await prisma.folder.updateMany({ where: { id: { in: request.body.folderIds } }, data: { parentId: request.body.parentId, updatedAt: new Date() } })
            return reply.send({ success: true })
        }
    })
}

export default folderRoutes
