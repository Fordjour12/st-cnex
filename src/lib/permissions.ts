export const PERMISSIONS = {
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_SUSPEND: 'users.suspend',
  USERS_BAN: 'users.ban',

  INVESTORS_VERIFY: 'investors.verify',
  INVESTORS_REJECT: 'investors.reject',

  REPORTS_VIEW: 'reports.view',
  REPORTS_REVIEW: 'reports.review',
  REPORTS_RESOLVE: 'reports.resolve',

  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',

  ROLES_VIEW: 'roles.view',
  ROLES_ASSIGN: 'roles.assign',
  ROLES_REVOKE: 'roles.revoke',

  SYSTEM_SETTINGS: 'system.settings',
  AUDIT_LOGS_VIEW: 'audit_logs.view',
} as const

export const ROLE_PERMISSIONS = {
  super_admin: Object.values(PERMISSIONS),

  admin: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_SUSPEND,
    PERMISSIONS.INVESTORS_VERIFY,
    PERMISSIONS.INVESTORS_REJECT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_REVIEW,
    PERMISSIONS.REPORTS_RESOLVE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.AUDIT_LOGS_VIEW,
  ],

  moderator: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_REVIEW,
    PERMISSIONS.REPORTS_RESOLVE,
  ],

  founder: [],
  investor: [],
  talent: [],
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
export type RoleName = keyof typeof ROLE_PERMISSIONS
