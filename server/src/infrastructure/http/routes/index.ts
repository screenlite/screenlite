import { FastifyInstance } from 'fastify'
import healthRoutes from '@/modules/health/infrastructure/routes/health.routes.ts'
import settingRoutes from '@/modules/setting/infrastructure/routes/setting.routes.ts'
import authRoutes from '@/modules/auth/infrastructure/routes/auth.routes.ts'
import userRoutes from '@/modules/user/infrastructure/routes/user.routes.ts'
import emailVerificationRoutes from '@/modules/email-verification/infrastructure/routes/email-verification.routes.ts'
import adminPermissionRoutes from '@/modules/admin-permission/infrastructure/routes/admin-permission.routes.ts'
import passwordResetRoutes from '@/modules/password-reset/infrastructure/routes/password-reset.routes.ts'
import configRoutes from '@/modules/config/infrastructure/routes/config.routes.ts'
import twoFactorAuthRoutes from '@/modules/two-factor-auth/infrastructure/routes/two-factor-auth.routes.ts'
import sessionRoutes from '@/modules/session/routes/session.routes.ts'
import fileDeliveryRoutes from '@/modules/file-delivery/infrastructure/routes/file-delivery.routes.ts'
import workspaceRoutes from '@/modules/workspace/infrastructure/routes/workspace.routes.ts'
import workspaceInvitationRoutes from '@/modules/workspace-invitation/infrastructure/routes/workspace-invitation.routes.ts'
import screenRoutes from '@/modules/screen/infrastructure/routes/screen.routes.ts'
import deviceRoutes from '@/modules/screen/infrastructure/routes/device.routes.ts'

export async function registerRoutes(fastify: FastifyInstance) {
    fastify.register(healthRoutes, { prefix: '/api/health' })
    fastify.register(configRoutes, { prefix: '/api/config' })
    fastify.register(authRoutes, { prefix: '/api/auth' })
    fastify.register(userRoutes, { prefix: '/api/users' })
    fastify.register(emailVerificationRoutes, { prefix: '/api/email-verification' })
    fastify.register(passwordResetRoutes, { prefix: '/api/password-reset' })
    fastify.register(twoFactorAuthRoutes, { prefix: '/api/two-factor-auth' })
    fastify.register(sessionRoutes, { prefix: '/api/sessions' })
    fastify.register(fileDeliveryRoutes, { prefix: '/api/file-delivery' })
    fastify.register(workspaceRoutes, { prefix: '/api/workspaces' })
    fastify.register(workspaceInvitationRoutes, { prefix: '/api/workspace-invitations' })
    fastify.register(screenRoutes, { prefix: '/api/workspaces/:workspaceId/screens' })
    fastify.register(deviceRoutes, { prefix: '/api/devices' })

    fastify.register(async function adminRoutes(fastifyAdmin) {
        fastifyAdmin.addHook('onRequest', fastify.requireAdminAccess)
    
    fastify.register(async function adminRoutes(fastifyAdmin) {
        fastifyAdmin.addHook('onRequest', fastify.requireAdminAccess)
        fastifyAdmin.register(settingRoutes, { prefix: '/settings' })
        fastifyAdmin.register(adminPermissionRoutes, { prefix: '/permissions' })
    }, { prefix: '/api/admin' })
}
