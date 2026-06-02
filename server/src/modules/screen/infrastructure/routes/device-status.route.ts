import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { PrismaDeviceRepository } from '../repositories/prisma-device.repository.ts'

// Prefix: /api/devices
export const deviceStatusRoute = async (fastify: FastifyInstance) => {
    fastify.withTypeProvider<ZodTypeProvider>().get('/status/:connectionCode', {
        config: { allowGuest: true },
        schema: {
            params: z.object({ connectionCode: z.string() })
        },
        handler: async (request, reply) => {
            const deviceRepository = new PrismaDeviceRepository(fastify.prisma)
            const device = await deviceRepository.findByConnectionCode(request.params.connectionCode)
            if (!device) return reply.status(404).send({ message: 'Device not found' })
            return reply.send({
                connected: !!device.screenId,
                screenId: device.screenId,
                token: device.screenId ? device.token : null
            })
        }
    })
}
