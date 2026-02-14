import { createFileRoute } from '@tanstack/react-router'

import { PermissionAuditService } from '@/lib/server/permission-audit'

function isAuthorizedRequest(request: Request) {
  const configuredToken = process.env.ADMIN_AUDIT_TOKEN
  if (!configuredToken) {
    return {
      ok: false as const,
      error: 'ADMIN_AUDIT_TOKEN is not configured.',
      status: 503,
    }
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      ok: false as const,
      error: 'Missing Bearer token.',
      status: 401,
    }
  }

  const token = authHeader.slice('Bearer '.length).trim()
  if (token !== configuredToken) {
    return {
      ok: false as const,
      error: 'Invalid token.',
      status: 401,
    }
  }

  return { ok: true as const }
}

export const Route = createFileRoute('/api/admin/permission-audit')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const authorized = isAuthorizedRequest(request)
        if (!authorized.ok) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: authorized.error,
            }),
            {
              status: authorized.status,
              headers: { 'content-type': 'application/json' },
            },
          )
        }

        const report = await PermissionAuditService.generateReport()

        return new Response(
          JSON.stringify({
            ok: true,
            report,
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        )
      },
    },
  },
})
