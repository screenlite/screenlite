import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { PrismaClient } from '@/generated/prisma/client.ts'

export const getScreenTelemetryRoute = async (fastify: FastifyInstance) => {
    fastify.withTypeProvider<ZodTypeProvider>().get('/:screenId/telemetry', {
        schema: {
            params: z.object({ screenId: z.string().uuid() })
        },
        handler: async (request, reply) => {
            const prisma = fastify.prisma as PrismaClient
            const { screenId } = request.params

            const device = await prisma.device.findFirst({ where: { screenId } })
            if (!device) return reply.status(404).send({ message: 'Device not found' })

            const telemetry = await prisma.deviceTelemetry.findFirst({
                where: { deviceId: device.id },
                orderBy: { createdAt: 'desc' }
            })

            return reply.send({ telemetry })
        }
    })
}
