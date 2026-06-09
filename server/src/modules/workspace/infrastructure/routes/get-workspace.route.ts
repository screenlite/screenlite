import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { GetWorkspaceUsecase } from '../../application/usecases/get-workspace.usecase.ts'
import { WorkspaceMapper } from '../mappers/workspace.mapper.ts'
// Prefix: /api/workspaces
export const getWorkspaceRoute = async (fastify: FastifyInstance) => {
    fastify.withTypeProvider<ZodTypeProvider>().get('/:workspaceId', {
        schema: {
            params: z.object({
                workspaceId: z.uuid(),
            }),
        },
        handler: async (request, reply) => {
            const { workspaceId } = request.params
            const workspaceMapper = new WorkspaceMapper()
            const getWorkspaceUseCase = new GetWorkspaceUsecase(
                {
                    workspaceRepository: fastify.workspaceRepository,
                    workspaceAccessService: fastify.workspaceAccessService,
                    workspaceInvariantsService: fastify.workspaceInvariantsService
                }
            )
            const workspace = await getWorkspaceUseCase.execute(workspaceId, request.auth)

            const memberCount = await (fastify.prisma as any).workspaceMember.count({
                where: { workspaceId }
            })

            const pendingInvitationCount = await (fastify.prisma as any).workspaceInvitation.count({
                where: { workspaceId, status: 'pending' }
            })

            return reply.status(200).send({
                workspace: {
                    ...workspaceMapper.toDTO(workspace),
                    _count: {
                        members: memberCount,
                        invitations: {
                            pending: pendingInvitationCount
                        }
                    }
                }
            })
        }
    })
}