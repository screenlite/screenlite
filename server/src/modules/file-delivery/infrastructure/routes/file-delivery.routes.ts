import { FastifyInstance } from 'fastify'
import { getThumbnailRoute } from './get-thumbnail.route.ts'
import { getStreamRoute } from './get-stream.route.ts'
// Prefix: /api/file-delivery
const fileDeliveryRoutes = async (fastify: FastifyInstance) => {
    await Promise.all([
        getThumbnailRoute(fastify),
        getStreamRoute(fastify),
    ])
}
export default fileDeliveryRoutes
