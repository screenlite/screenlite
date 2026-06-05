import { FastifyInstance } from 'fastify'
import { createScreenRoute } from './create-screen.route.ts'
import { getScreenRoute } from './get-screen.route.ts'
import { getWorkspaceScreensRoute } from './get-workspace-screens.route.ts'
import { deleteScreensRoute } from './delete-screens.route.ts'
import { connectDeviceRoute } from './connect-device.route.ts'
import { disconnectDeviceRoute } from './disconnect-device.route.ts'
import { getScreenTelemetryRoute } from './get-screen-telemetry.route.ts'

// Prefix: /api/workspaces/:workspaceId/screens
const screenRoutes = async (fastify: FastifyInstance) => {
    await Promise.all([
        createScreenRoute(fastify),
        getScreenRoute(fastify),
        getWorkspaceScreensRoute(fastify),
        deleteScreensRoute(fastify),
        connectDeviceRoute(fastify),
        disconnectDeviceRoute(fastify),
        getScreenTelemetryRoute(fastify),
    ])
}

export default screenRoutes
