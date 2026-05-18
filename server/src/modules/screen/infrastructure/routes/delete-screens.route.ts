import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { DeleteScreensUsecase } from '../../application/usecases/delete-screens.usecase.ts'
import { PrismaScreenRepository } from '../repositories/prisma-screen.repository.ts'

// Prefix: /api/workspaces/:workspaceId/screens
export const deleteScreensRoute = async (fastify: FastifyInstance) => {
    fastify.withTypeProvider<ZodTypeProvider>().delete('/', {
        schema: {
            params: z.object({
                workspaceId: z.string().uuid(),
            }),
            body: z.object({
                screenIds: z.array(z.string().uuid()).min(1),
            }),
        },
        handler: async (request, reply) => {
            const { workspaceId } = request.params
            const { screenIds } = request.body

            const screenRepository = new PrismaScreenRepository(fastify.prisma)

            const usecase = new DeleteScreensUsecase(
                screenRepository,
                fastify.workspaceAccessService
            )

            await usecase.execute({
                authContext: request.auth,
                workspaceId,
                screenIds,
            })

            return reply.status(200).send({ success: true })
        }
    })
}
