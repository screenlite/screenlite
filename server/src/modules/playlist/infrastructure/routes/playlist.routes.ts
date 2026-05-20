import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { PrismaClient } from '@/generated/prisma/client.ts'

const playlistWithCount = {
    include: {
        _count: { select: {  items: true } },
        layout: { include: { sections: true } },
        
    }
}

const toDTO = (p: any) => ({
    id: p.id,
    workspaceId: p.workspaceId,
    name: p.name,
    description: p.description,
    type: p.type,
    isPublished: p.isPublished,
    priority: p.priority,
    size: p.size?.toString?.() ?? '0',
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    deletedAt: p.deletedAt,
    layout: p.layout ? {
        id: p.layout.id,
        name: p.layout.name,
        workspaceId: p.layout.workspaceId,
        resolutionWidth: p.layout.resolutionWidth,
        resolutionHeight: p.layout.resolutionHeight,
        sections: p.layout.sections ?? p.layout.PlaylistLayoutSection ?? [],
    } : null,
    schedules: [],
    _count: {
        screens: p.screensCount ?? 0,
        items: p._count?.items ?? 0,
    }
})

const playlistRoutes = async (fastify: FastifyInstance) => {
    const ztp = fastify.withTypeProvider<ZodTypeProvider>()
    const prisma = fastify.prisma as PrismaClient

    ztp.get('/', {
        schema: {
            params: z.object({ workspaceId: z.string().uuid() }),
            querystring: z.object({
                page: z.coerce.number().optional(),
                limit: z.coerce.number().optional(),
                search: z.string().optional(),
                status: z.string().optional(),
                type: z.string().optional(),
            }),
        },
        handler: async (request, reply) => {
            const { workspaceId } = request.params
            const { page = 1, limit = 10, search, status, type } = request.query
            const where: any = { workspaceId, deletedAt: null }
            if (search) where.name = { contains: search, mode: 'insensitive' }
            if (type) where.type = { in: type.split(',') }
            if (status) {
                const statuses = status.split(',')
                if (statuses.includes('published') && !statuses.includes('draft')) where.isPublished = true
                if (statuses.includes('draft') && !statuses.includes('published')) where.isPublished = false
                if (statuses.includes('deleted')) { delete where.deletedAt; where.deletedAt = { not: null } }
            }
            const [items, total] = await Promise.all([
                prisma.playlist.findMany({
                    where,
                    skip: (page - 1) * limit,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    ...playlistWithCount
                }).then(async playlists => {
                    const counts = await prisma.$queryRaw`
                        SELECT "playlistId", COUNT(*)::int as count
                        FROM "PlaylistScreen"
                        GROUP BY "playlistId"
                    ` as any[]

                    const map = new Map(counts.map(c => [c.playlistId, c.count]))

                    return playlists.map(p => ({
                        ...p,
                        screensCount: map.get(p.id) ?? 0
                    }))
                }),
                prisma.playlist.count({ where }),
            ])
            return reply.send({ items: items.map(toDTO), meta: { total, totalPages: Math.max(1, Math.ceil(total / limit)), currentPage: page, limit, hasNextPage: page < Math.ceil(total / limit), hasPrevPage: page > 1 } })
        }
    })

    ztp.post('/', {
        schema: {
            params: z.object({ workspaceId: z.string().uuid() }),
            body: z.object({ name: z.string(), type: z.enum(['standard', 'nestable']).default('standard') }),
        },
        handler: async (request, reply) => {
            const { workspaceId } = request.params
            const { name, type } = request.body
            const playlist = await prisma.playlist.create({
                data: { id: uuidv4(), workspaceId, name, type, updatedAt: new Date() },
                ...playlistWithCount,
            })
            return reply.status(201).send({ playlist: toDTO(playlist) })
        }
    })

    ztp.get('/:playlistId', {
        schema: { params: z.object({ workspaceId: z.string().uuid(), playlistId: z.string() }) },
        handler: async (request, reply) => {
            const { workspaceId, playlistId } = request.params
            const playlist = await prisma.playlist.findFirst({ where: { id: playlistId, workspaceId }, ...playlistWithCount })

            const screenCountRows = await prisma.$queryRaw`
                SELECT COUNT(*)::int as count
                FROM "PlaylistScreen"
                WHERE "playlistId" = ${playlistId}
            ` as any[]

            const screensCount = screenCountRows?.[0]?.count ?? 0
            if (!playlist) return reply.status(404).send({ message: 'Playlist not found.' })
            return reply.send({
                playlist: toDTO({
                    ...playlist,
                    screensCount
                })
            })
        }
    })

    ztp.patch('/:playlistId', {
        schema: {
            params: z.object({ workspaceId: z.string().uuid(), playlistId: z.string() }),
            body: z.object({ name: z.string().optional(), description: z.string().optional(), isPublished: z.boolean().optional(), priority: z.number().optional() }),
        },
        handler: async (request, reply) => {
            const { playlistId } = request.params
            const playlist = await prisma.playlist.update({ where: { id: playlistId }, data: { ...request.body, updatedAt: new Date() }, ...playlistWithCount })
            return reply.send({ playlist: toDTO(playlist) })
        }
    })

    ztp.post('/delete', {
        schema: { params: z.object({ workspaceId: z.string().uuid() }), body: z.object({ playlistIds: z.array(z.string()) }) },
        handler: async (request, reply) => {
            await prisma.playlist.updateMany({ where: { id: { in: request.body.playlistIds } }, data: { deletedAt: new Date(), updatedAt: new Date() } })
            return reply.send({ success: true })
        }
    })

    ztp.post('/restore', {
        schema: { params: z.object({ workspaceId: z.string().uuid() }), body: z.object({ playlistIds: z.array(z.string()) }) },
        handler: async (request, reply) => {
            await prisma.playlist.updateMany({ where: { id: { in: request.body.playlistIds } }, data: { deletedAt: null, updatedAt: new Date() } })
            return reply.send({ success: true })
        }
    })

    ztp.post('/:playlistId/copy', {
        schema: { params: z.object({ workspaceId: z.string().uuid(), playlistId: z.string() }) },
        handler: async (request, reply) => {
            const { workspaceId, playlistId } = request.params
            const original = await prisma.playlist.findFirst({ where: { id: playlistId, workspaceId } })
            if (!original) return reply.status(404).send({ message: 'Playlist not found.' })
            const copy = await prisma.playlist.create({
                data: { id: uuidv4(), workspaceId, name: original.name + ' (copy)', type: original.type, description: original.description, updatedAt: new Date() },
                ...playlistWithCount,
            })
            return reply.status(201).send({ playlist: toDTO(copy) })
        }
    })

    ztp.put('/:playlistId/layout', {
        schema: {
            params: z.object({ workspaceId: z.string().uuid(), playlistId: z.string() }),
            body: z.object({ playlistLayoutId: z.string().nullable() }),
        },
        handler: async (request, reply) => {
            const playlist = await prisma.playlist.update({ where: { id: request.params.playlistId }, data: { playlistLayoutId: request.body.playlistLayoutId, updatedAt: new Date() }, ...playlistWithCount })
            return reply.send({ playlist: toDTO(playlist) })
        }
    })

    ztp.get('/:playlistId/items', {
        schema: { params: z.object({ workspaceId: z.string().uuid(), playlistId: z.string() }) },
        handler: async (request, reply) => {
            const items = await prisma.playlistItem.findMany({
                where: { playlistId: request.params.playlistId },
                orderBy: { order: 'asc' },
                include: { file: true, nestedPlaylist: true }
            })
            const serialized = items.map((item: any) => ({
                ...item,
                file: item.file ? { ...item.file, size: item.file.size?.toString?.() ?? '0' } : null
            }))
            return reply.send({ items: serialized })
        }
    })

    ztp.put('/:playlistId/items', {
        schema: {
            params: z.object({ workspaceId: z.string().uuid(), playlistId: z.string() }),
            body: z.object({
                items: z.array(z.object({
                    id: z.string().optional(),
                    type: z.string(),
                    duration: z.number().nullable().optional(),
                    playlistLayoutSectionId: z.string(),
                    fileId: z.string().nullable().optional(),
                    nestedPlaylistId: z.string().nullable().optional(),
                    order: z.number(),
                }))
            }),
        },
        handler: async (request, reply) => {
            const { playlistId } = request.params
            await prisma.playlistItem.deleteMany({ where: { playlistId } })
            const created = await prisma.$transaction(
                request.body.items.map(item => prisma.playlistItem.create({
                    data: { id: item.id ?? uuidv4(), playlistId, type: item.type, duration: item.duration ?? null, playlistLayoutSectionId: item.playlistLayoutSectionId, fileId: item.fileId ?? null, nestedPlaylistId: item.nestedPlaylistId ?? null, order: item.order, updatedAt: new Date() }
                }))
            )

            // Push updated playlist to all connected screens
            const playlistScreens: any[] = await prisma.$queryRaw`
                SELECT "screenId" FROM "PlaylistScreen" WHERE "playlistId" = ${playlistId}
            `
            if (playlistScreens.length > 0) {
                const sections: any[] = await prisma.$queryRaw`
                    SELECT pls.* FROM "PlaylistLayoutSection" pls
                    JOIN "PlaylistLayout" pl ON pl.id = pls."playlistLayoutId"
                    WHERE pl.id = (SELECT "playlistLayoutId" FROM "Playlist" WHERE id = ${playlistId})
                `
                const items: any[] = await prisma.$queryRaw`
                    SELECT pi.*, f.id as file_id, f.name as file_name, f."mimeType", f.path
                    FROM "PlaylistItem" pi
                    LEFT JOIN "File" f ON f.id = pi."fileId"
                    WHERE pi."playlistId" = ${playlistId}
                    ORDER BY pi."order" ASC
                `
                const playlist = await prisma.playlist.findUnique({
                    where: { id: playlistId },
                    include: { playlistLayout: true }
                })
                const pushPayload = JSON.stringify({
                    type: 'playlist_updated',
                    playlist: {
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
                })
                for (const ps of playlistScreens) {
                    await fastify.websocket.broadcaster.broadcastToChannel(
                        `screen:${ps.screenId}`,
                        pushPayload
                    )
                }
            }

            return reply.send({ items: created })
        }
    })
}

export default playlistRoutes
