import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { CreateScreenUsecase } from '../../application/usecases/create-screen.usecase.ts'
import { PrismaScreenRepository } from '../repositories/prisma-screen.repository.ts'
import { ScreenMapper } from '../mappers/screen.mapper.ts'

const screenTypeSchema = z.enum([
    'consumer_tv',
    'commercial_display',
    'touchscreen_display',
    'video_wall',
    'led_screen',
    'kiosk',
    'projector',
    'tablet',
    'smartphone',
    'digital_frame',
    'other'
])

// Prefix: /api/workspaces/:workspaceId/screens
export const createScreenRoute = async (fastify: FastifyInstance) => {
    fastify.withTypeProvider<ZodTypeProvider>().post('/', {
        schema: {
            params: z.object({
                workspaceId: z.string().uuid(),
            }),
            body: z.object({
                name: z.string().min(1).max(100),
                type: screenTypeSchema,
            }),
        },
        handler: async (request, reply) => {
            const { workspaceId } = request.params
            const { name, type } = request.body

            const screenRepository = new PrismaScreenRepository(fastify.prisma)
            const screenMapper = new ScreenMapper()

            const usecase = new CreateScreenUsecase(
                screenRepository,
                fastify.workspaceRepository,
                fastify.workspaceAccessService
            )

            const screen = await usecase.execute({
                authContext: request.auth,
                workspaceId,
                name,
                type,
            })

            return reply.status(201).send({
                screen: screenMapper.toDTO(screen)
            })
        }
    })
}
