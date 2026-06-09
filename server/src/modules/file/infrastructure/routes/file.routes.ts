import { FastifyInstance } from 'fastify'
import { createUploadSessionRoute } from './create-upload-session.route.ts'
import { uploadPartRoute } from './upload-part.route.ts'
import { cancelUploadSessionRoute } from './cancel-upload-session.route.ts'

const fileRoutes = async (fastify: FastifyInstance) => {
    await Promise.all([
        createUploadSessionRoute(fastify),
        uploadPartRoute(fastify),
        cancelUploadSessionRoute(fastify),
    ])
}

export default fileRoutes
