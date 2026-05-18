import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { ConnectDeviceUsecase } from '../../application/usecases/connect-device.usecase.ts'
import { PrismaScreenRepository } from '../repositories/prisma-screen.repository.ts'
import { PrismaDeviceRepository } from '../repositories/prisma-device.repository.ts'
import { DeviceMapper } from '../mappers/device.mapper.ts'
import { TokenGenerator } from '@/shared/infrastructure/services/token-generator.service.ts'

// Prefix: /api/workspaces/:workspaceId/screens
export const connectDeviceRoute = async (fastify: FastifyInstance) => {
    fastify.withTypeProvider<ZodTypeProvider>().post('/:screenId/connectDevice', {
        schema: {
            params: z.object({
                workspaceId: z.string().uuid(),
                screenId: z.string().uuid(),
            }),
            body: z.object({
                connectionCode: z.string().min(1),
            }),
        },
        handler: async (request, reply) => {
            const { workspaceId, screenId } = request.params
            const { connectionCode } = request.body

            const screenRepository = new PrismaScreenRepository(fastify.prisma)
            const deviceRepository = new PrismaDeviceRepository(fastify.prisma)
            const deviceMapper = new DeviceMapper()
            const tokenGenerator = new TokenGenerator()

            const usecase = new ConnectDeviceUsecase(
                screenRepository,
                deviceRepository,
                fastify.workspaceAccessService,
                tokenGenerator
            )

            const device = await usecase.execute({
                authContext: request.auth,
                workspaceId,
                screenId,
                connectionCode,
            })

            return reply.status(200).send({
                device: deviceMapper.toDTO(device)
            })
        }
    })
}
