import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { PrismaClient } from '@/generated/prisma/client.ts'

const playlistScheduleRoutes = async (fastify: FastifyInstance) => {
    const ztp = fastify.withTypeProvider<ZodTypeProvider>()
    const prisma = (fastify as any).prisma as PrismaClient

    ztp.post('/create', {
        schema: {
            body: z.object({
                playlistId: z.string(),
                startAt: z.string(),
                endAt: z.string().nullable().optional(),
                startTime: z.string().nullable().optional(),
                endTime: z.string().nullable().optional(),
                weekdays: z.array(z.string()).optional(),
            }),
        },
        handler: async (request, reply) => {
            const id = uuidv4()
            const now = new Date()
            const { playlistId, startAt, endAt, startTime, endTime, weekdays } = request.body
            await prisma.$executeRaw`
                INSERT INTO "PlaylistSchedule" (id, "playlistId", "startAt", "endAt", "startTime", "endTime", weekdays, "createdAt", "updatedAt")
                VALUES (${id}, ${playlistId}, ${new Date(startAt)}, ${endAt ? new Date(endAt) : null},
                        ${startTime ?? null}, ${endTime ?? null}, ${weekdays ?? []}::text[], ${now}, ${now})
            `
            const schedules = await prisma.$queryRaw`SELECT * FROM "PlaylistSchedule" WHERE id = ${id}`
            return reply.status(201).send({ schedule: (schedules as any[])[0] })
        }
    })

    ztp.post('/delete', {
        schema: { body: z.object({ scheduleId: z.string() }) },
        handler: async (request, reply) => {
            await prisma.$executeRaw`DELETE FROM "PlaylistSchedule" WHERE id = ${request.body.scheduleId}`
            return reply.send({ success: true })
        }
    })

    ztp.post('/update', {
        schema: {
            body: z.object({
                scheduleId: z.string(),
                startAt: z.string().optional(),
                endAt: z.string().nullable().optional(),
                startTime: z.string().nullable().optional(),
                endTime: z.string().nullable().optional(),
                weekdays: z.array(z.string()).optional(),
            }),
        },
        handler: async (request, reply) => {
            const { scheduleId, startAt, endAt, startTime, endTime, weekdays } = request.body
            await prisma.$executeRaw`
                UPDATE "PlaylistSchedule" SET
                    "startAt" = COALESCE(${startAt ? new Date(startAt) : null}, "startAt"),
                    "endAt" = ${endAt ? new Date(endAt) : null},
                    "startTime" = ${startTime ?? null},
                    "endTime" = ${endTime ?? null},
                    weekdays = COALESCE(${weekdays ?? null}::text[], weekdays),
                    "updatedAt" = ${new Date()}
                WHERE id = ${scheduleId}
            `
            const schedules = await prisma.$queryRaw`SELECT * FROM "PlaylistSchedule" WHERE id = ${scheduleId}`
            return reply.send({ schedule: (schedules as any[])[0] })
        }
    })
}

export default playlistScheduleRoutes
