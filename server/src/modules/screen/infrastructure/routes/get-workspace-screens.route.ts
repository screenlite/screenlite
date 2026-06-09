import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { GetWorkspaceScreensUsecase } from '../../application/usecases/get-workspace-screens.usecase.ts'
import { PrismaScreenRepository } from '../repositories/prisma-screen.repository.ts'
import { ScreenMapper } from '../mappers/screen.mapper.ts'
import { Paginator } from '@/shared/utils/pagination.util.ts'

// Prefix: /api/workspaces/:workspaceId/screens
export const getWorkspaceScreensRoute = async (fastify: FastifyInstance) => {
    fastify.withTypeProvider<ZodTypeProvider>().get('/', {
        schema: {
            params: z.object({
                workspaceId: z.string().uuid(),
            }),
            querystring: z.object({
                page: z.coerce.number().optional(),
                limit: z.coerce.number().optional(),
                search: z.string().optional(),
                status: z.string().optional(),
                type: z.string().optional(),
                playlistId: z.string().uuid().optional(),
            }),
        },
        handler: async (request, reply) => {
            const { workspaceId } = request.params
            const { page, limit, search, status, type } = request.query
            const screenRepository = new PrismaScreenRepository(fastify.prisma)
            const screenMapper = new ScreenMapper()
            const usecase = new GetWorkspaceScreensUsecase(
                screenRepository,
                fastify.workspaceAccessService
            )
            let screens = await usecase.execute(workspaceId, request.auth)

            if (search) {
                screens = screens.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()))
            }
            if (type) {
                const types = type.split(',')
                screens = screens.filter(s => types.includes(s.type))
            }

            const { page: p, limit: l, skip } = Paginator.getPaginationParams({ page, limit })
            const items = screens.slice(skip, skip + l)
            const meta = Paginator.getPaginationMeta(screens.length, p, l)

            return reply.status(200).send({
                items: items.map(screen => screenMapper.toDTO(screen)),
                meta
            })
        }
    })
}
