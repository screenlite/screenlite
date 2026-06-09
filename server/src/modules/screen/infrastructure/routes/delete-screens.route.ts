import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { DeleteScreensUsecase } from '../../application/usecases/delete-screens.usecase.ts'
import { PrismaScreenRepository } from '../repositories/prisma-screen.repository.ts'

// Prefix: /api/workspaces/:workspaceId/screens
export const deleteScreensRoute = async (fastify: FastifyInstance) => {
    const schema = {
        params: z.object({ workspaceId: z.string().uuid() }),
        body: z.object({ screenIds: z.array(z.string().uuid()).min(1) }),
    }

    const handler = async (request: any, reply: any) => {
        const { workspaceId } = request.params
        const { screenIds } = request.body
        const screenRepository = new PrismaScreenRepository(fastify.prisma)
        const usecase = new DeleteScreensUsecase(screenRepository, fastify.workspaceAccessService)
        await usecase.execute({ authContext: request.auth, workspaceId, screenIds })
        return reply.status(200).send({ success: true })
    }

    fastify.withTypeProvider<ZodTypeProvider>().delete('/', { schema, handler })
    fastify.withTypeProvider<ZodTypeProvider>().post('/delete', { schema, handler })
}
