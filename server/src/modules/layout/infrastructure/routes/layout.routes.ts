import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { PrismaClient } from '@/generated/prisma/client.ts'

const layoutRoutes = async (fastify: FastifyInstance) => {
    const ztp = fastify.withTypeProvider<ZodTypeProvider>()
    const prisma = fastify.prisma as PrismaClient

    ztp.get('/', {
        schema: { params: z.object({ workspaceId: z.string().uuid() }) },
        handler: async (request, reply) => {
            const layouts = await prisma.playlistLayout.findMany({
                where: { workspaceId: request.params.workspaceId },
                include: { sections: true, _count: { select: { playlists: true } } },
                orderBy: { createdAt: 'desc' },
            })
            return reply.send({ items: layouts, meta: { total: layouts.length, totalPages: Math.max(1, layouts.length), currentPage: 1, limit: 100 } })
        }
    })

    ztp.post('/', {
        schema: {
            params: z.object({ workspaceId: z.string().uuid() }),
            body: z.object({
                name: z.string(),
                resolutionWidth: z.number().default(1920),
                resolutionHeight: z.number().default(1080),
                sections: z.array(z.object({
                    name: z.string(),
                    top: z.number(),
                    left: z.number(),
                    width: z.number(),
                    height: z.number(),
                    zIndex: z.number().default(0),
                })).default([]),
            }),
        },
        handler: async (request, reply) => {
            const { workspaceId } = request.params
            const { name, resolutionWidth, resolutionHeight, sections } = request.body
            const layout = await prisma.playlistLayout.create({
                data: {
                    id: uuidv4(),
                    workspaceId,
                    name,
                    resolutionWidth,
                    resolutionHeight,
                    updatedAt: new Date(),
                    sections: { create: sections.map(s => ({ id: uuidv4(), ...s })) }
                },
                include: { sections: true, _count: { select: { playlists: true } } }
            })
            return reply.status(201).send({ playlistLayout: layout })
        }
    })

    ztp.get('/:layoutId', {
        schema: { params: z.object({ workspaceId: z.string().uuid(), layoutId: z.string() }) },
        handler: async (request, reply) => {
            const layout = await prisma.playlistLayout.findFirst({
                where: { id: request.params.layoutId, workspaceId: request.params.workspaceId },
                include: { sections: true, _count: { select: { playlists: true } } }
            })
            if (!layout) return reply.status(404).send({ message: 'Layout not found.' })
            return reply.send({ playlistLayout: layout })
        }
    })

    ztp.patch('/:layoutId', {
        schema: {
            params: z.object({ workspaceId: z.string().uuid(), layoutId: z.string() }),
            body: z.object({
                name: z.string().optional(),
                resolutionWidth: z.number().optional(),
                resolutionHeight: z.number().optional(),
                sections: z.array(z.object({
                    id: z.string().optional(),
                    playlistLayoutId: z.string().optional(),
                    name: z.string(),
                    top: z.coerce.number(),
                    left: z.coerce.number(),
                    width: z.coerce.number(),
                    height: z.coerce.number(),
                    zIndex: z.coerce.number().default(0),
                })).optional(),
            }),
        },
        handler: async (request, reply) => {
            const { sections, ...layoutData } = request.body
            const { layoutId } = request.params

            const layout = await prisma.$transaction(async (tx) => {
                if (sections !== undefined) {
                    await tx.playlistLayoutSection.deleteMany({
                        where: { playlistLayoutId: layoutId }
                    })
                    await tx.playlistLayoutSection.createMany({
                        data: sections.map(s => ({
                            id: uuidv4(),
                            playlistLayoutId: layoutId,
                            ...s
                        }))
                    })
                }
                return tx.playlistLayout.update({
                    where: { id: layoutId },
                    data: { ...layoutData, updatedAt: new Date() },
                    include: { sections: true, _count: { select: { playlists: true } } }
                })
            })

            return reply.send({ playlistLayout: layout })
        }
    })

    ztp.delete('/:layoutId', {
        schema: { params: z.object({ workspaceId: z.string().uuid(), layoutId: z.string() }) },
        handler: async (request, reply) => {
            await prisma.playlistLayout.delete({ where: { id: request.params.layoutId } })
            return reply.send({ success: true })
        }
    })

    ztp.get('/:layoutId/playlists', {
        schema: { params: z.object({ workspaceId: z.string().uuid(), layoutId: z.string() }) },
        handler: async (request, reply) => {
            const playlists = await prisma.playlist.findMany({
                where: { playlistLayoutId: request.params.layoutId },
                select: { id: true, name: true, type: true, isPublished: true, description: true, createdAt: true, updatedAt: true }
            })
            return reply.send({ playlists })
        }
    })
}

export default layoutRoutes
