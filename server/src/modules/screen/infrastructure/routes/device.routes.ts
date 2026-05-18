import { FastifyInstance } from 'fastify'
import { registerDeviceRoute } from './register-device.route.ts'

// Prefix: /api/devices
const deviceRoutes = async (fastify: FastifyInstance) => {
    await Promise.all([
        registerDeviceRoute(fastify),
    ])
}

export default deviceRoutes
