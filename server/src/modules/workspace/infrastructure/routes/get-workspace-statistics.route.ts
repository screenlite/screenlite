import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { GetWorkspaceStatisticsUseCase } from '../../application/usecases/get-workspace-statistics.usecase.ts'

// Prefix: /api/workspaces
export const getWorkspaceStatisticsRoute = async (fastify: FastifyInstance) => {
    fastify.withTypeProvider<ZodTypeProvider>().get('/:workspaceId/statistics', {
        schema: {
            params: z.object({
                workspaceId: z.uuid(),
            }),
        },
        handler: async (request, reply) => {
            const { workspaceId } = request.params

            const getWorkspaceStatisticsUseCase = new GetWorkspaceStatisticsUseCase(
                {
                    workspaceRepository: fastify.workspaceRepository,
                    workspaceAccessService: fastify.workspaceAccessService,
                    workspaceStatisticsQuery: fastify.workspaceStatisticsQuery,
                    workspaceInvariantsService: fastify.workspaceInvariantsService
                }
            )

            const workspaceStatistics = await getWorkspaceStatisticsUseCase.execute(workspaceId, request.auth)

            return reply.status(200).send({
                workspaceStatistics
            })
        }
    })
}