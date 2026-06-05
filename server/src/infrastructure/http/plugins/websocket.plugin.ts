import fp from 'fastify-plugin'
import { WebSocketServer as Server } from 'ws'
import type { FastifyPluginAsync } from 'fastify'
import { WebSocketConnectionRepository } from '@/infrastructure/websocket/repositories/websocket-connection.repository.ts'
import { WebSocketConnectionManager, WebSocketEvents } from '@/infrastructure/websocket/services/websocket-connection-manager.service.ts'
import { IWebSocketSubscriptionRepository } from '@/core/ports/websocket-subscription.repository.interface.ts'
import { WebSocketSubscriptionRepository } from '@/infrastructure/websocket/repositories/websocket-subscription.repository.ts'
import { WebSocketRouter } from '@/infrastructure/websocket/websocket.router.ts'
import { WebSocketBroadcaster } from '@/infrastructure/websocket/services/websocket-broadcaster.service.ts'
import { IWebSocketBroadcaster } from '@/core/ports/websocket-broadcaster.interface.ts'
import { createDeviceAuthHandler } from '@/modules/screen/infrastructure/websocket/device-auth.handler.ts'
import { createTelemetryHandler } from '@/modules/screen/infrastructure/websocket/telemetry.handler.ts'

declare module 'fastify' {
    interface FastifyInstance {
        websocket: {
            subscriptionRepository: IWebSocketSubscriptionRepository
            broadcaster: IWebSocketBroadcaster
        }
    }
}

const websocketPlugin: FastifyPluginAsync = async (fastify) => {
    const connectionRepository = new WebSocketConnectionRepository()

    const subscriptionRepository = new WebSocketSubscriptionRepository()

    const connectionManager = new WebSocketConnectionManager(connectionRepository)

    const websocketRouter = new WebSocketRouter(connectionRepository)

    const broadcaster = new WebSocketBroadcaster(connectionRepository, subscriptionRepository)

    connectionManager.on(WebSocketEvents.CONNECT, (connectionId: string) => {
        websocketRouter.onConnection(connectionId)
    })

    connectionManager.on(WebSocketEvents.MESSAGE, (connectionId, message) => {
        websocketRouter.onMessage(connectionId, message)
    })

    const deviceAuthHandler = createDeviceAuthHandler(
        fastify.prisma as any,
        subscriptionRepository
    )
    websocketRouter.registerHandler('auth', deviceAuthHandler)

    const telemetryHandler = createTelemetryHandler(
        fastify.prisma as any,
        subscriptionRepository
    )
    websocketRouter.registerHandler('telemetry', telemetryHandler)

    // Heartbeat handler — updates onlineAt in DB when device sends ping
    websocketRouter.registerHandler('heartbeat', async (connection, _message) => {
        const { PrismaDeviceRepository } = await import('@/modules/screen/infrastructure/repositories/prisma-device.repository.ts')
        const deviceRepo = new PrismaDeviceRepository(fastify.prisma as any)
        const channels = await subscriptionRepository.getSubscribedChannels(connection.id)
        for (const channel of channels) {
            if (channel.startsWith('screen:')) {
                const screenId = channel.replace('screen:', '')
                const device = await deviceRepo.findByScreenId(screenId)
                if (device) {
                    device.markOnline()
                    await deviceRepo.save(device)
                }
            }
        }
        connection.socket.send(JSON.stringify({ type: 'heartbeat_ack' }))
    })

    fastify.decorate('websocket', {
        subscriptionRepository,
        broadcaster
    })

    const wss = new Server({ noServer: true })

    fastify.server.on('upgrade', (request, socket, head) => {
        const upgradeHeader = request.headers['upgrade']

        if (upgradeHeader !== 'websocket') return

        if (request.url === '/ws') {
            wss.handleUpgrade(request, socket, head, (ws) => {
                connectionManager.handleConnection(request, ws)
            })
            return
        }

        socket.destroy()
    })

    fastify.addHook('preClose', async () => {
        fastify.log.info('Terminating all socket connections')
        connectionRepository.terminateAllConnections()
    })

    fastify.addHook('onClose', async () => {
        connectionManager.shutdown()
        
        wss.close(() => {
            fastify.log.info('Destroying websocket server')
        })
    })
}

export default fp(websocketPlugin, {
    name: 'websocket',
    dependencies: []
})