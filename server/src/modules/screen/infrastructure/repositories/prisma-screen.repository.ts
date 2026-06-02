import { Prisma, PrismaClient } from '@/generated/prisma/client.ts'
import { IScreenRepository } from '../../domain/ports/screen-repository.interface.ts'
import { Screen, ScreenType, LayoutRotation } from '@/core/entities/screen.entity.ts'
import { Device } from '@/core/entities/device.entity.ts'

export class PrismaScreenRepository implements IScreenRepository {
    constructor(private readonly prisma: PrismaClient | Prisma.TransactionClient) {}

    async findById(id: string): Promise<Screen | null> {
        const data = await this.prisma.screen.findUnique({
            where: { id }
        })
        if (!data) return null

        const playlistLinks = await this.prisma.$queryRaw<{ screenId: string, playlistId: string }[]>`
            SELECT "screenId", "playlistId"
            FROM "PlaylistScreen"
            WHERE "screenId" = ${data.id}
        `

        const deviceData = await this.prisma.device.findFirst({
            where: { screenId: data.id }
        })

        return this.toDomain({
            ...data,
            playlists: playlistLinks.map(l => ({ playlistId: l.playlistId })),
            device: deviceData ?? null,
        })
    }

    async findByWorkspaceId(workspaceId: string): Promise<Screen[]> {
        const data = await this.prisma.screen.findMany({
            where: { workspaceId },
            orderBy: { createdAt: 'desc' },
        })

        const screenIds = data.map(screen => screen.id)

        const playlistLinks = screenIds.length
            ? await this.prisma.$queryRaw<{ screenId: string, playlistId: string }[]>`
                SELECT "screenId", "playlistId"
                FROM "PlaylistScreen"
                WHERE "screenId" IN (${Prisma.join(screenIds)})
            `
            : []

        const playlistLinksByScreenId = new Map<string, { playlistId: string }[]>()

        for (const link of playlistLinks) {
            const existing = playlistLinksByScreenId.get(link.screenId) ?? []
            existing.push({ playlistId: link.playlistId })
            playlistLinksByScreenId.set(link.screenId, existing)
        }

        return data.map(screen => this.toDomain({
            ...screen,
            playlists: playlistLinksByScreenId.get(screen.id) ?? [],
            device: null,
        }))
    }

    async save(screen: Screen): Promise<void> {
        await this.prisma.screen.upsert({
            where: { id: screen.id },
            create: {
                id: screen.id,
                workspaceId: screen.workspaceId,
                groupId: screen.groupId,
                name: screen.name,
                layoutRotation: screen.layoutRotation,
                resolutionWidth: screen.resolutionWidth,
                resolutionHeight: screen.resolutionHeight,
                type: screen.type,
            },
            update: {
                groupId: screen.groupId,
                name: screen.name,
                layoutRotation: screen.layoutRotation,
                resolutionWidth: screen.resolutionWidth,
                resolutionHeight: screen.resolutionHeight,
                type: screen.type,
                updatedAt: screen.updatedAt,
            }
        })
    }

    async deleteMany(ids: string[]): Promise<void> {
        await this.prisma.screen.deleteMany({
            where: { id: { in: ids } }
        })
    }

    private toDomain(data: any): Screen {
        return new Screen({
            id: data.id,
            workspaceId: data.workspaceId,
            groupId: data.groupId,
            name: data.name,
            layoutRotation: data.layoutRotation as LayoutRotation,
            resolutionWidth: data.resolutionWidth,
            resolutionHeight: data.resolutionHeight,
            type: data.type as ScreenType,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            playlists: data.playlists ?? [],
            device: data.device ? new Device({
                id: data.device.id,
                screenId: data.device.screenId,
                token: data.device.token,
                connectionCode: data.device.connectionCode,
                createdAt: data.device.createdAt,
                updatedAt: data.device.updatedAt,
                onlineAt: data.device.onlineAt,
            }) : null,
        })
    }
}
