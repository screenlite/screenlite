import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { RegisterDeviceUsecase } from '../../application/usecases/register-device.usecase.ts'
import { PrismaDeviceRepository } from '../repositories/prisma-device.repository.ts'
import { DeviceMapper } from '../mappers/device.mapper.ts'
import { TokenGenerator } from '@/shared/infrastructure/services/token-generator.service.ts'

// Prefix: /api/devices
export const registerDeviceRoute = async (fastify: FastifyInstance) => {
    fastify.withTypeProvider<ZodTypeProvider>().post('/register', {
        schema: {
            body: z.object({
                connectionCode: z.string().optional(),
            }),
        },
        handler: async (request, reply) => {
            const { connectionCode } = request.body

            const deviceRepository = new PrismaDeviceRepository(fastify.prisma)
            const deviceMapper = new DeviceMapper()
            const tokenGenerator = new TokenGenerator()

            const usecase = new RegisterDeviceUsecase(
                deviceRepository,
                tokenGenerator
            )

            const device = await usecase.execute({ connectionCode })

            return reply.status(201).send({
                device: deviceMapper.toDTO(device)
            })
        }
    })
}
