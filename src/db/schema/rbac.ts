import {
  pgTable,
  varchar,
  text,
  timestamp,
  serial,
  integer,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core'

export const actionTypeEnum = pgEnum('action_type', [
  'user_suspended',
  'user_banned',
  'user_verified',
  'report_resolved',
  'role_assigned',
])

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const userRoles = pgTable(
  'user_roles',
  {
    userId: varchar('user_id', { length: 255 }).notNull(),
    roleId: integer('role_id')
      .references(() => roles.id, { onDelete: 'cascade' })
      .notNull(),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
    assignedBy: varchar('assigned_by', { length: 255 }),
  },
  (table) => ({
    pk: { name: 'user_roles_pk', columns: [table.userId, table.roleId] },
  }),
)

export const permissions = pgTable(
  'permissions',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    resource: varchar('resource', { length: 50 }).notNull(),
    action: varchar('action', { length: 50 }).notNull(),
    description: text('description'),
  },
  (table) => ({
    resourceActionIdx: index('permissions_resource_action_idx').on(
      table.resource,
      table.action,
    ),
  }),
)

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: integer('role_id')
      .references(() => roles.id, { onDelete: 'cascade' })
      .notNull(),
    permissionId: integer('permission_id')
      .references(() => permissions.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => ({
    pk: {
      name: 'role_permissions_pk',
      columns: [table.roleId, table.permissionId],
    },
  }),
)

export const userSuspensions = pgTable(
  'user_suspensions',
  {
    id: serial('id').primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    reason: text('reason').notNull(),
    suspendedBy: varchar('suspended_by', { length: 255 }).notNull(),
    suspendedAt: timestamp('suspended_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at'),
    liftedAt: timestamp('lifted_at'),
    liftedBy: varchar('lifted_by', { length: 255 }),
  },
  (table) => ({
    userIdIdx: index('user_suspensions_user_id_idx').on(table.userId),
  }),
)

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: serial('id').primaryKey(),
    userId: varchar('user_id', { length: 255 }),
    targetUserId: varchar('target_user_id', { length: 255 }),
    action: actionTypeEnum('action').notNull(),
    resource: varchar('resource', { length: 100 }).notNull(),
    resourceId: varchar('resource_id', { length: 255 }),
    details: text('details'),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
    targetUserIdIdx: index('audit_logs_target_user_id_idx').on(
      table.targetUserId,
    ),
    createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
  }),
)
