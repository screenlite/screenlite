import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { DisconnectDeviceUsecase } from '../../application/usecases/disconnect-device.usecase.ts'
import { PrismaScreenRepository } from '../repositories/prisma-screen.repository.ts'
import { PrismaDeviceRepository } from '../repositories/prisma-device.repository.ts'

// Prefix: /api/workspaces/:workspaceId/screens
export const disconnectDeviceRoute = async (fastify: FastifyInstance) => {
    fastify.withTypeProvider<ZodTypeProvider>().post('/:screenId/disconnectDevice', {
        schema: {
            params: z.object({
                workspaceId: z.string().uuid(),
                screenId: z.string().uuid(),
            }),
        },
        handler: async (request, reply) => {
            const { workspaceId, screenId } = request.params

            const screenRepository = new PrismaScreenRepository(fastify.prisma)
            const deviceRepository = new PrismaDeviceRepository(fastify.prisma)

            const usecase = new DisconnectDeviceUsecase(
                screenRepository,
                deviceRepository,
                fastify.workspaceAccessService
            )

            await usecase.execute({
                authContext: request.auth,
                workspaceId,
                screenId,
            })

            return reply.status(200).send({ success: true })
        }
    })
}
