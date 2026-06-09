import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { GetScreenUsecase } from '../../application/usecases/get-screen.usecase.ts'
import { PrismaScreenRepository } from '../repositories/prisma-screen.repository.ts'
import { ScreenMapper } from '../mappers/screen.mapper.ts'

// Prefix: /api/workspaces/:workspaceId/screens
export const getScreenRoute = async (fastify: FastifyInstance) => {
    fastify.withTypeProvider<ZodTypeProvider>().get('/:screenId', {
        schema: {
            params: z.object({
                workspaceId: z.string().uuid(),
                screenId: z.string().uuid(),
            }),
        },
        handler: async (request, reply) => {
            const { workspaceId, screenId } = request.params

            const screenRepository = new PrismaScreenRepository(fastify.prisma)
            const screenMapper = new ScreenMapper()

            const usecase = new GetScreenUsecase(
                screenRepository,
                fastify.workspaceAccessService
            )

            const screen = await usecase.execute(screenId, workspaceId, request.auth)

            return reply.status(200).send({
                screen: screenMapper.toDTO(screen)
            })
        }
    })
}
