import { FastifyInstance } from 'fastify'
import { registerDeviceRoute } from './register-device.route.ts'
import { deviceStatusRoute } from './device-status.route.ts'
import { connectDeviceRoute } from './connect-device.route.ts'
import { disconnectDeviceRoute } from './disconnect-device.route.ts'

// Prefix: /api/devices
const deviceRoutes = async (fastify: FastifyInstance) => {
    await Promise.all([
        registerDeviceRoute(fastify),
        deviceStatusRoute(fastify),
        connectDeviceRoute(fastify),
        disconnectDeviceRoute(fastify),
    ])
}

export default deviceRoutes
