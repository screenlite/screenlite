import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { GetWorkspaceScreensUsecase } from '../../application/usecases/get-workspace-screens.usecase.ts'
import { PrismaScreenRepository } from '../repositories/prisma-screen.repository.ts'
import { ScreenMapper } from '../mappers/screen.mapper.ts'

// Prefix: /api/workspaces/:workspaceId/screens
export const getWorkspaceScreensRoute = async (fastify: FastifyInstance) => {
    fastify.withTypeProvider<ZodTypeProvider>().get('/', {
        schema: {
            params: z.object({
                workspaceId: z.string().uuid(),
            }),
        },
        handler: async (request, reply) => {
            const { workspaceId } = request.params

            const screenRepository = new PrismaScreenRepository(fastify.prisma)
            const screenMapper = new ScreenMapper()

            const usecase = new GetWorkspaceScreensUsecase(
                screenRepository,
                fastify.workspaceAccessService
            )

            const screens = await usecase.execute(workspaceId, request.auth)

            return reply.status(200).send({
                screens: screens.map(screen => screenMapper.toDTO(screen))
            })
        }
    })
}
