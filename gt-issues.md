# StartupConnect Admin System - GitHub Issues

## 🏗 Phase 1: Foundation & Infrastructure

### Issue #1: Database Schema Setup

**Labels:** `database`, `setup`, `priority: high`

**Description:**
Set up PostgreSQL database with Drizzle ORM and create all necessary tables for the admin system with proper indexes and constraints.

**Acceptance Criteria:**

- [x] Install and configure Drizzle ORM with PostgreSQL
- [x] Create migration files for all tables (users, roles, permissions, etc.)
- [x] Add proper indexes on frequently queried columns
- [x] Set up foreign key constraints with cascade rules
- [x] Create database connection pool configuration
- [ ] Add development seed data script
- [ ] Document database schema in README

**Tables to Create:**

- `users`, `roles`, `permissions`, `user_roles`, `role_permissions`
- `founder_profiles`, `investor_profiles`, `talent_profiles`
- `reports`, `user_suspensions`, `audit_logs`, `user_activity`

**Technical Notes:**

```bash
# Commands to run
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit
pnpm drizzle-kit generate:pg
pnpm drizzle-kit push:pg
```

**Related Files:**

- `src/db/schema.ts`
- `drizzle.config.ts`
- `src/db/migrations/`

---

### Issue #2: Authentication & Session Management

**Labels:** `auth`, `security`, `priority: high`

**Description:**
Implement secure authentication system with session management for admin users.

**Acceptance Criteria:**

- [x] Set up session-based authentication (or JWT)
- [x] Create login/logout endpoints
- [x] Implement password hashing with bcrypt
- [x] Add session middleware for route protection
- [x] Create `getSessionUser()` helper function
- [x] Add CSRF protection
- [x] Implement "Remember Me" functionality
- [x] Add session expiration (30 days inactive)

**Security Requirements:**

- Passwords hashed with bcrypt (cost factor: 12)
- HttpOnly cookies for session tokens
- Secure flag enabled in production
- SameSite=Strict for CSRF protection

**Files to Create:**

- `src/lib/auth/session.ts`
- `src/lib/auth/password.ts`
- `src/middleware/session.ts`

---

### Issue #3: RBAC (Role-Based Access Control) System

**Labels:** `rbac`, `security`, `priority: high`

**Description:**
Build a flexible RBAC system with granular permissions for different admin roles.

**Acceptance Criteria:**

- [x] Define all permissions in `src/lib/permissions.ts`
- [x] Create `RBACService` class with permission checking methods
- [x] Implement `hasPermission()`, `hasAnyPermission()`, `hasAllPermissions()`
- [x] Create middleware for permission-based route protection
- [x] Add permission decorators for server functions
- [x] Build permission inheritance system
- [ ] Add unit tests for RBAC logic (>90% coverage)% coverage)

**Roles to Support:**

- `super_admin` - Full system access
- `admin` - User management, moderation, analytics
- `moderator` - Report review, user suspension only
- `founder`, `investor`, `talent` - Regular users (no admin access)

**Files to Create:**

- `src/lib/permissions.ts`
- `src/lib/auth/rbac.ts`
- `src/middleware/auth.ts`
- `src/tests/rbac.test.ts`

---

### Issue #4: Seed Initial Roles & Permissions

**Labels:** `database`, `setup`, `priority: medium`

**Description:**
Create database seed script to populate initial roles, permissions, and super admin user.

**Acceptance Criteria:**

- [ ] Create seed script for roles (super_admin, admin, moderator, etc.)
- [ ] Seed all permissions defined in permissions.ts
- [ ] Map permissions to roles (role_permissions table)
- [ ] Create default super admin user (configurable via env)
- [ ] Add command: `pnpm db:seed`
- [ ] Ensure idempotent seeding (can run multiple times safely)
- [ ] Document seed process in README

**Default Super Admin:**

```env
SUPER_ADMIN_EMAIL=admin@startupconnect.com
SUPER_ADMIN_PASSWORD=<generate-secure-password>
```

**Files to Create:**

- `src/db/seed.ts`
- `scripts/create-super-admin.ts`

---

## 👥 Phase 2: User Management

### Issue #5: User List Page with Filters & Search

**Labels:** `frontend`, `admin`, `priority: high`

**Description:**
Build the main user management page with advanced filtering, search, and pagination using TanStack Table.

**Acceptance Criteria:**

- [x] Create `/admin/users` route with proper auth protection
- [x] Implement TanStack Table with sortable columns
- [x] Add filters: Status (active/suspended/banned), Role (founder/investor/talent)
- [x] Add search by email, name (debounced, 300ms)
- [x] Implement pagination (20 users per page)
- [x] Add bulk actions: Suspend, Ban, Export CSV
- [x] Show user avatar, name, email, role, status, join date, last login
- [x] Add loading states and error handling
- [x] Responsive design (mobile-friendly)

**UI Components:**

- User table with sorting
- Filter dropdowns
- Search input
- Pagination controls
- Action buttons (Suspend, Ban, View Details)

**Files to Create:**

- `src/routes/admin/_layout/users/index.tsx`
- `src/components/admin/UsersTable.tsx`
- `src/components/admin/UserFilters.tsx`
- `src/lib/server/admin/users.ts`

---

### Issue #6: User Detail View & Profile Management

**Labels:** `frontend`, `admin`, `priority: high`

**Description:**
Create detailed user profile page for admins to view and manage individual users.

**Acceptance Criteria:**

- [x] Create `/admin/users/[userId]` route
- [x] Display user information: Email, Name, Status, Roles, Join Date
- [x] Show profile type (Founder/Investor/Talent) with specific fields
- [x] Display activity timeline (login history, profile updates)
- [x] Show suspension history with reasons and durations
- [x] Add actions: Edit User, Suspend, Ban, Delete, Verify Investor
- [x] Show linked startup/investor/talent profile data
- [x] Add notes section (admin-only internal notes)
- [x] Display audit log for this user

**Sections:**

1. User Overview
2. Profile Details (role-specific)
3. Activity Timeline
4. Suspension History
5. Admin Actions
6. Audit Log

**Files to Create:**

- `src/routes/admin/_layout/users/$userId.tsx`
- `src/components/admin/UserDetailView.tsx`
- `src/components/admin/UserActivityTimeline.tsx`
- `src/lib/server/admin/users.ts`

---

### Issue #7: User Suspend/Ban System

**Labels:** `backend`, `admin`, `moderation`, `priority: high`

**Description:**
Implement backend logic and UI for suspending and banning users with reason tracking and expiration.

**Acceptance Criteria:**

- [x] Create `UserService.suspendUser()` method
- [x] Create `UserService.banUser()` method
- [x] Create `UserService.liftSuspension()` method
- [x] Add validation: Reason required (min 10 chars)
- [x] Support temporary suspensions with expiration date
- [x] Support permanent bans (expiresAt = null)
- [x] Create audit log entry for every action
- [x] Send email notification to suspended/banned user
- [x] Add UI modal for suspend/ban with form
- [x] Show confirmation dialog before action
- [x] Auto-disable user sessions on suspension/ban

**Suspension Flow:**

1. Admin clicks "Suspend User"
2. Modal opens with form: Reason (required), Expiration (optional)
3. Admin submits → Backend validates → User status updated
4. Audit log created → Email sent → UI refreshed

**Files to Create:**

- `src/lib/server/user.ts`
- `src/components/admin/SuspendUserModal.tsx`
- `src/components/admin/BanUserModal.tsx`
- `src/lib/server/admin/users.ts`

---

### Issue #8: Role Assignment Interface

**Labels:** `frontend`, `admin`, `rbac`, `priority: medium`

**Description:**
Build UI for admins to assign/revoke roles from users.

**Acceptance Criteria:**

- [ ] Create role assignment modal/page
- [ ] Display current user roles with chips
- [ ] Add "Assign Role" button with role dropdown
- [ ] Add "Revoke Role" button for each assigned role
- [ ] Require permission: `roles.assign` and `roles.revoke`
- [ ] Track who assigned the role and when
- [ ] Create audit log for role changes
- [ ] Prevent users from revoking their own super_admin role
- [ ] Add confirmation dialog for role changes
- [ ] Show role descriptions on hover

**Validation Rules:**

- Super admins can assign any role
- Admins can assign non-admin roles only
- Users cannot modify their own admin roles

**Files to Create:**

- `src/components/admin/RoleAssignmentModal.tsx`
- `src/app/api/admin/roles/assign.ts`
- `src/app/api/admin/roles/revoke.ts`

---

## 🛡 Phase 3: Moderation & Safety

### Issue #9: Reports Dashboard

**Labels:** `frontend`, `admin`, `moderation`, `priority: high`

**Description:**
Create a centralized dashboard for viewing and managing user reports.

**Acceptance Criteria:**

- [x] Create `/admin/reports` route
- [x] Display all reports in table format with filters
- [x] Filters: Status (pending/reviewing/resolved/dismissed), Type (user/message/profile/content)
- [x] Show: Reporter, Reported User, Reason, Date, Status
- [x] Add search by user email or report ID
- [x] Implement pagination (20 reports per page)
- [x] Add priority sorting (oldest pending first)
- [x] Click row to view report details
- [x] Add bulk actions: Mark as Reviewing, Resolve, Dismiss
- [x] Show unread count badge in sidebar

**Report Statuses:**

- Pending (new, needs review)
- Reviewing (admin investigating)
- Resolved (action taken)
- Dismissed (no action needed)

**Files to Create:**

- `src/routes/admin/reports/index.tsx`
- `src/components/admin/ReportsTable.tsx`
- `src/app/api/admin/reports.ts`

---

### Issue #10: Report Detail & Review System

**Labels:** `frontend`, `admin`, `moderation`, `priority: high`

**Description:**
Build detailed report view with investigation tools and action buttons.

**Acceptance Criteria:**

- [x] Create `/admin/reports/[reportId]` route
- [x] Display full report details: Reason, Description, Screenshots, Timestamp
- [x] Show reporter and reported user profiles side-by-side
- [x] Display reported content (if applicable)
- [x] Add investigation timeline
- [x] Show previous reports involving same users
- [x] Add quick actions: Suspend User, Ban User, Warn User, Dismiss Report
- [x] Add internal notes section (admin collaboration)
- [x] Require resolution notes when resolving/dismissing
- [x] Send automated email to reporter with outcome

**Quick Actions:**

- Suspend Reported User (opens suspend modal)
- Ban Reported User (opens ban modal)
- Send Warning (template email)
- Dismiss Report (requires reason)
- Escalate to Super Admin

**Files to Create:**

- `src/routes/admin/reports/$reportId.tsx`
- `src/components/admin/ReportDetailView.tsx`
- `src/components/admin/ReportActions.tsx`
- `src/app/api/admin/reports/[reportId].ts`

---

### Issue #11: Fraud Detection & Risk Scoring

**Labels:** `backend`, `ml`, `security`, `priority: low`

**Description:**
Implement basic fraud detection system with risk scoring for users.

**Acceptance Criteria:**

- [ ] Create risk scoring algorithm (0-100)
- [ ] Factors: Account age, activity patterns, report count, verification status
- [ ] Flag high-risk users (score > 70) for manual review
- [ ] Add risk score to user detail page
- [ ] Create `/admin/fraud` route showing high-risk users
- [ ] Add manual "Mark as Safe" override
- [ ] Log all risk score changes in audit log
- [ ] Send alerts to super admins for critical scores (>90)

**Risk Factors:**

- New account with investor claims (+30)
- Multiple reports (+20 per report)
- Incomplete profile (+10)
- No email verification (+15)
- Suspicious activity patterns (+25)

**Files to Create:**

- `src/services/fraud-detection.service.ts`
- `src/routes/admin/fraud/index.tsx`
- `src/app/api/admin/fraud/score.ts`

---

### Issue #12: Audit Log Viewer

**Labels:** `frontend`, `admin`, `security`, `priority: medium`

**Description:**
Create comprehensive audit log viewer for tracking all admin actions.

**Acceptance Criteria:**

- [ ] Create `/admin/audit-logs` route
- [ ] Display all admin actions in chronological order
- [ ] Filters: Admin User, Action Type, Resource, Date Range
- [ ] Show: Admin, Action, Target User, Timestamp, IP Address, Details
- [ ] Add search by user email or resource ID
- [ ] Implement pagination (50 logs per page)
- [ ] Export logs as CSV
- [ ] Add real-time updates (optional, using WebSockets)
- [ ] Color-code action types (suspend=red, verify=green, etc.)

**Logged Actions:**

- User suspended/banned/unbanned
- Role assigned/revoked
- Report resolved/dismissed
- Investor verified/rejected
- User deleted

**Files to Create:**

- `src/routes/admin/audit-logs/index.tsx`
- `src/components/admin/AuditLogTable.tsx`
- `src/app/api/admin/audit-logs.ts`

---

## 💰 Phase 4: Investor Verification

### Issue #13: Investor Verification Queue

**Labels:** `frontend`, `admin`, `verification`, `priority: high`

**Description:**
Build a dedicated queue for reviewing pending investor verification requests.

**Acceptance Criteria:**

- [x] Create `/admin/investors/verification` route
- [x] Display pending investor verifications in table
- [x] Show: Investor Name, Type (angel/vc/corporate), Investment Range, Submitted Date
- [x] Add filters: Investor Type, Date Range, Investment Range
- [x] Click row to open verification review modal
- [x] Show verification documents (PDF, images)
- [x] Add quick approve/reject buttons
- [x] Display investor LinkedIn and portfolio links
- [x] Implement pagination (10 per page)
- [x] Show queue count badge in sidebar

**Verification Statuses:**

- Pending (waiting review)
- Verified (approved by admin)
- Rejected (denied with reason)

**Files to Create:**

- `src/routes/admin/investors/verification.tsx`
- `src/components/admin/VerificationQueue.tsx`
- `src/app/api/admin/investors/verification.ts`

---

### Issue #14: Investor Verification Review Modal

**Labels:** `frontend`, `admin`, `verification`, `priority: high`

**Description:**
Create detailed verification review interface with document viewer and approval workflow.

**Acceptance Criteria:**

- [x] Create verification review modal component
- [x] Display investor profile: Name, Email, Type, Investment Range, Industries
- [x] Show uploaded verification documents with preview
- [ ] Add document viewer (PDF.js for PDFs, image viewer for images)
- [x] Display LinkedIn profile (embedded or link)
- [x] Show portfolio companies/investments
- [x] Add approval form: Approve with optional notes
- [x] Add rejection form: Reason required (min 20 chars)
- [x] Send email notification to investor with decision
- [x] Update investor profile status on approval/rejection
- [x] Create audit log entry

**Approval Flow:**

1. Admin opens modal
2. Reviews documents and profile
3. Clicks "Approve" or "Reject"
4. Fills out notes/reason
5. Confirms action
6. Status updated → Email sent → Audit log created

**Files to Create:**

- `src/components/admin/InvestorVerificationModal.tsx`
- `src/components/admin/DocumentViewer.tsx`
- `src/app/api/admin/investors/approve.ts`
- `src/app/api/admin/investors/reject.ts`

---

### Issue #15: Investor Credibility Scoring

**Labels:** `backend`, `verification`, `priority: low`

**Description:**
Implement credibility scoring system for investors based on profile completeness and verification.

**Acceptance Criteria:**

- [ ] Create credibility score algorithm (0-100)
- [ ] Factors: Verified (+50), LinkedIn profile (+15), Portfolio (+15), Complete profile (+10), Active user (+10)
- [ ] Display credibility score on investor profiles
- [ ] Add filter in investor list by credibility score
- [ ] Show credibility badge (gold/silver/bronze) on high scores
- [ ] Auto-flag low credibility investors (<30) for review
- [ ] Update score on profile changes

**Scoring Breakdown:**

- Verified by admin: +50
- LinkedIn connected: +15
- Portfolio URL provided: +15
- Complete profile (all fields): +10
- Active last 30 days: +10

**Files to Create:**

- `src/services/credibility.service.ts`
- `src/app/api/admin/investors/credibility.ts`

---

## 📊 Phase 5: Analytics & Reporting

### Issue #16: Platform Analytics Dashboard

**Labels:** `frontend`, `admin`, `analytics`, `priority: high`

**Description:**
Build comprehensive analytics dashboard showing platform health and growth metrics.

**Acceptance Criteria:**

- [x] Create `/admin/analytics` route (default admin landing page)
- [x] Display key metrics: Total Users, Active Users (DAU/MAU), New Signups (24h/7d/30d)
- [x] Show breakdown: Founders, Investors, Talent counts
- [x] Display pending items: Reports, Verifications
- [x] Add user growth chart (line chart, last 30 days)
- [x] Show active users chart (bar chart, last 7 days)
- [x] Add investor verification funnel (pending/verified/rejected)
- [x] Display top industries and startup stages
- [x] Add date range filter (7d/30d/90d/1y/all-time)
- [x] Use Recharts for visualizations

**Key Metrics Cards:**

1. Total Users (with % change)
2. Active Users (DAU/MAU ratio)
3. New Signups (last 7 days)
4. Pending Reports
5. Pending Verifications

**Files to Create:**

- `src/routes/admin/analytics/index.tsx`
- `src/components/admin/AnalyticsDashboard.tsx`
- `src/components/admin/MetricCard.tsx`
- `src/app/api/admin/analytics/overview.ts`

---

### Issue #17: User Growth & Activity Analytics

**Labels:** `backend`, `admin`, `analytics`, `priority: medium`

**Description:**
Implement detailed user analytics with growth tracking and activity monitoring.

**Acceptance Criteria:**

- [x] Create `AnalyticsService.getUserGrowth()` method
- [x] Create `AnalyticsService.getActiveUsers()` method
- [x] Track daily/weekly/monthly signups
- [x] Calculate DAU (Daily Active Users)
- [x] Calculate MAU (Monthly Active Users)
- [x] Calculate retention rate (7-day, 30-day)
- [ ] Track user activity types (login, profile_view, message_sent, etc.)
- [ ] Generate activity heatmap (by hour of day)
- [ ] Add cohort analysis (users by signup month)
- [ ] Export analytics data as CSV

**Analytics Endpoints:**

- `GET /api/admin/analytics/growth` - User growth over time
- `GET /api/admin/analytics/active-users` - DAU/MAU data
- `GET /api/admin/analytics/retention` - Retention rates
- `GET /api/admin/analytics/activity` - Activity breakdown

**Files to Create:**

- `src/services/analytics.service.ts`
- `src/app/api/admin/analytics/growth.ts`
- `src/app/api/admin/analytics/active-users.ts`

---

### Issue #18: Export & Reporting System

**Labels:** `backend`, `admin`, `analytics`, `priority: low`

**Description:**
Build data export functionality for admins to generate reports in various formats.

**Acceptance Criteria:**

- [ ] Add "Export CSV" button to user list
- [ ] Add "Export CSV" button to reports list
- [ ] Add "Export CSV" button to audit logs
- [ ] Generate Excel reports with multiple sheets
- [ ] Add PDF report generation (platform overview)
- [ ] Schedule automated weekly reports via email
- [ ] Include filters in export (respect current view)
- [ ] Add export history log
- [ ] Limit export size (max 10,000 records)
- [ ] Stream large exports (don't load all in memory)

**Export Formats:**

- CSV (for all data tables)
- Excel (multi-sheet reports)
- PDF (executive summaries)

**Files to Create:**

- `src/services/export.service.ts`
- `src/app/api/admin/export/users.ts`
- `src/app/api/admin/export/reports.ts`
- `src/lib/utils/csv-generator.ts`

---

## ⚙️ Phase 6: System Management

### Issue #19: Feature Flags System

**Labels:** `backend`, `admin`, `infrastructure`, `priority: medium`

**Description:**
Implement feature flag system for gradually rolling out features and A/B testing.

**Acceptance Criteria:**

- [ ] Create `feature_flags` database table
- [ ] Add UI for managing feature flags in `/admin/settings/features`
- [ ] Support flag types: boolean, percentage rollout, user-specific
- [ ] Add `isFeatureEnabled(flagName, userId?)` helper function
- [ ] Create flags: `investor_verification_v2`, `ai_matching`, `premium_subscriptions`
- [ ] Add environment-based defaults (dev/staging/prod)
- [ ] Log feature flag changes in audit log
- [ ] Add flag override in URL params for testing (?flag_name=true)
- [ ] Create API endpoints for feature flag CRUD

**Flag Properties:**

- Name (unique)
- Description
- Enabled (boolean)
- Rollout Percentage (0-100)
- Allowed User IDs (optional)
- Environment (all/dev/staging/prod)

**Files to Create:**

- `src/services/feature-flags.service.ts`
- `src/routes/admin/settings/features.tsx`
- `src/app/api/admin/feature-flags.ts`
- `src/lib/utils/feature-flags.ts`

---

### Issue #20: Email Template Editor

**Labels:** `frontend`, `admin`, `communication`, `priority: low`

**Description:**
Build a visual email template editor for customizing automated emails.

**Acceptance Criteria:**

- [ ] Create `/admin/settings/emails` route
- [ ] List all email templates (suspension, verification, welcome, etc.)
- [ ] Add rich text editor (TipTap or similar)
- [ ] Support template variables: {{user_name}}, {{platform_name}}, {{action_reason}}
- [ ] Add preview mode (render with sample data)
- [ ] Add "Send Test Email" button
- [ ] Support multiple languages (i18n)
- [ ] Track email template versions (history)
- [ ] Add "Restore Default" button
- [ ] Create audit log for template changes

**Email Templates:**

- Welcome Email
- Email Verification
- Investor Verification Approved
- Investor Verification Rejected
- User Suspended
- User Banned
- Report Received (to reporter)
- Report Resolved (to reporter)

**Files to Create:**

- `src/routes/admin/settings/emails/index.tsx`
- `src/components/admin/EmailTemplateEditor.tsx`
- `src/app/api/admin/email-templates.ts`

---

### Issue #21: Platform Announcements System

**Labels:** `frontend`, `admin`, `communication`, `priority: low`

**Description:**
Create system for admins to broadcast announcements to users (banners, modals, or emails).

**Acceptance Criteria:**

- [ ] Create `announcements` database table
- [ ] Create `/admin/announcements` route
- [ ] Add announcement composer (title, message, type, target audience)
- [ ] Support announcement types: banner, modal, email
- [ ] Target audiences: all, founders, investors, talent, verified_only
- [ ] Schedule announcements (start_date, end_date)
- [ ] Preview announcement before publishing
- [ ] Track announcement views and dismissals
- [ ] Add "Draft" status for unpublished announcements
- [ ] Display active announcements in user app

**Announcement Types:**

- Banner (top of page, dismissible)
- Modal (popup on login)
- Email (sent immediately or scheduled)

**Files to Create:**

- `src/routes/admin/announcements/index.tsx`
- `src/components/admin/AnnouncementComposer.tsx`
- `src/components/user/AnnouncementBanner.tsx`
- `src/app/api/admin/announcements.ts`

---

### Issue #22: Admin Activity Monitoring

**Labels:** `backend`, `admin`, `security`, `priority: medium`

**Description:**
Implement real-time monitoring of admin actions and suspicious behavior detection.

**Acceptance Criteria:**

- [ ] Track all admin logins with IP and user agent
- [ ] Log all admin actions in real-time
- [ ] Create `/admin/activity` route showing recent admin activity
- [ ] Alert super admins of suspicious actions (mass deletions, unusual hours, etc.)
- [ ] Show "Currently Active Admins" widget on dashboard
- [ ] Add activity timeline for each admin user
- [ ] Flag unusual patterns (e.g., admin logging in from new location)
- [ ] Send email alerts for critical actions (super_admin role assigned, etc.)
- [ ] Add IP whitelist for admin access (optional)

**Monitored Actions:**

- Login/logout
- User suspension/ban
- Role assignment
- Feature flag changes
- Email template edits
- Bulk exports

**Files to Create:**

- `src/routes/admin/activity/index.tsx`
- `src/services/admin-monitoring.service.ts`
- `src/app/api/admin/activity.ts`

---

## 🎨 Phase 7: UI/UX Polish

### Issue #23: Admin Dashboard Layout & Navigation

**Labels:** `frontend`, `ui`, `priority: high`

**Description:**
Design and implement the main admin layout with sidebar navigation and responsive design.

**Acceptance Criteria:**

- [ ] Create collapsible sidebar with navigation menu
- [ ] Add top navbar with user profile dropdown
- [ ] Implement breadcrumbs for navigation
- [ ] Add notification badge for pending items (reports, verifications)
- [ ] Support dark mode toggle
- [ ] Make layout responsive (mobile, tablet, desktop)
- [ ] Add keyboard shortcuts (? to show help modal)
- [ ] Implement route-based active menu highlighting
- [ ] Add search bar (global search: users, reports, etc.)

**Navigation Sections:**

- Dashboard (overview)
- Users
- Reports
- Investors → Verification Queue
- Analytics
- Settings → Features, Emails, Announcements
- Audit Logs
- Activity Monitor

**Files to Create:**

- `src/components/admin/AdminLayout.tsx`
- `src/components/admin/Sidebar.tsx`
- `src/components/admin/Navbar.tsx`
- `src/components/admin/Breadcrumbs.tsx`

---

### Issue #24: Notification System for Admins

**Labels:** `frontend`, `admin`, `notifications`, `priority: medium`

**Description:**
Build in-app notification system for admins to receive alerts about important events.

**Acceptance Criteria:**

- [ ] Create `notifications` database table
- [ ] Add notification bell icon in navbar with unread count
- [ ] Create notification dropdown (last 10 notifications)
- [ ] Support notification types: new_report, pending_verification, high_risk_user, system_alert
- [ ] Mark notifications as read on click
- [ ] Add "Mark All as Read" button
- [ ] Link notifications to relevant pages (e.g., click report notification → open report)
- [ ] Send real-time notifications (WebSockets or polling)
- [ ] Add notification preferences (email, in-app, both)
- [ ] Create `/admin/notifications` page for notification history

**Notification Triggers:**

- New report submitted
- Investor verification pending (over 48h)
- High-risk user detected
- Unusual admin activity
- System errors

**Files to Create:**

- `src/components/admin/NotificationBell.tsx`
- `src/components/admin/NotificationDropdown.tsx`
- `src/app/api/admin/notifications.ts`

---

### Issue #25: Data Visualization Components

**Labels:** `frontend`, `ui`, `analytics`, `priority: medium`

**Description:**
Create reusable chart components for analytics dashboards using Recharts.

**Acceptance Criteria:**

- [ ] Create LineChart component (user growth over time)
- [ ] Create BarChart component (activity by day of week)
- [ ] Create PieChart component (user type distribution)
- [ ] Create AreaChart component (cumulative growth)
- [ ] Create MetricCard component (KPI cards with trend indicators)
- [ ] Add loading skeletons for all charts
- [ ] Support responsive sizing
- [ ] Add tooltips with detailed info on hover
- [ ] Include export chart as PNG feature
- [ ] Add date range selector component

**Chart Components:**

- `LineChart` - User growth, active users trend
- `BarChart` - Activity by time, reports by category
- `PieChart` - User type distribution, report statuses
- `AreaChart` - Cumulative signups
- `MetricCard` - Total users, DAU, MAU, etc.

**Files to Create:**

- `src/components/admin/charts/LineChart.tsx`
- `src/components/admin/charts/BarChart.tsx`
- `src/components/admin/charts/PieChart.tsx`
- `src/components/admin/charts/MetricCard.tsx`

---

## 🚀 Phase 8: Performance & Optimization

### Issue #26: Database Query Optimization

**Labels:** `backend`, `performance`, `priority: medium`

**Description:**
Optimize database queries for admin pages to ensure fast load times even with large datasets.

**Acceptance Criteria:**

- [ ] Add indexes on frequently queried columns (status, email, created_at, etc.)
- [ ] Implement query result caching (Redis or in-memory)
- [ ] Use database views for complex analytics queries
- [ ] Optimize N+1 query problems (use joins or batch loading)
- [ ] Add query performance monitoring (log slow queries >500ms)
- [ ] Implement cursor-based pagination for large datasets
- [ ] Add database connection pooling
- [ ] Use read replicas for analytics queries (if applicable)

**Queries to Optimize:**

- User list with filters (most common query)
- Analytics dashboard (complex aggregations)
- Report list with joins (reporter + reported user)
- Audit log queries (often filtered by date range)

**Files to Update:**

- `src/db/schema.ts` (add indexes)
- `src/services/*.service.ts` (optimize queries)

---

### Issue #27: Frontend Performance Optimization

**Labels:** `frontend`, `performance`, `priority: medium`

**Description:**
Optimize frontend performance for faster admin dashboard load times and better user experience.

**Acceptance Criteria:**

- [ ] Implement code splitting for admin routes
- [ ] Add lazy loading for heavy components (charts, tables)
- [ ] Use TanStack Query for efficient data caching
- [ ] Implement virtual scrolling for long lists (TanStack Virtual)
- [ ] Optimize bundle size (tree shaking, minification)
- [ ] Add service worker for offline support (optional)
- [ ] Implement optimistic updates for mutations
- [ ] Use React.memo for expensive components
- [ ] Add performance monitoring (Web Vitals)

**Performance Targets:**

- Initial load: <2s
- Time to Interactive: <3s
- Lighthouse score: >90
- Bundle size: <500KB (gzipped)

**Files to Update:**

- `vite.config.ts` (build optimization)
- `src/routes/**/*.tsx` (code splitting)
- `src/components/admin/**/*.tsx` (memoization)

---

### Issue #28: Rate Limiting & Security Hardening

**Labels:** `backend`, `security`, `priority: high`

**Description:**
Implement rate limiting and additional security measures for admin endpoints.

**Acceptance Criteria:**

- [ ] Add rate limiting to all admin API endpoints (100 req/min per IP)
- [ ] Implement stricter rate limits for sensitive actions (10 req/min for suspend/ban)
- [ ] Add IP whitelist option for admin access
- [ ] Implement 2FA requirement for super admins (optional)
- [ ] Add CAPTCHA on admin login after 3 failed attempts
- [ ] Log all failed authentication attempts
- [ ] Add session timeout (30 min inactivity)
- [ ] Implement Content Security Policy (CSP)
- [ ] Add HTTPS-only cookies
- [ ] Enable CORS protection

**Rate Limits:**

- General admin endpoints: 100 req/min
- Suspend/ban actions: 10 req/min
- Export endpoints: 5 req/min
- Login attempts: 5 per 15 min

**Files to Create:**

- `src/middleware/rate-limit.ts`
- `src/middleware/security.ts`
- `src/lib/auth/2fa.ts` (optional)

---

## ✅ Phase 9: Testing & Documentation

### Issue #29: Unit & Integration Tests

**Labels:** `testing`, `priority: high`

**Description:**
Write comprehensive tests for admin backend services and RBAC logic.

**Acceptance Criteria:**

- [ ] Unit tests for all service methods (>80% coverage)
- [ ] Integration tests for API endpoints
- [ ] RBAC permission testing (all permission combinations)
- [ ] Database query tests (using test database)
- [ ] Mock data generators for testing
- [ ] Test user suspension/ban flows
- [ ] Test report resolution workflows
- [ ] Test analytics calculations
- [ ] Set up CI/CD pipeline for automated testing

**Testing Tools:**

- Vitest (unit tests)
- Playwright or Cypress (E2E tests)
- Testing Library (component tests)

**Files to Create:**

- `src/tests/services/user.service.test.ts`
- `src/tests/services/rbac.test.ts`
- `src/tests/api/users.test.ts`
- `src/tests/utils/test-helpers.ts`

---

### Issue #30: Admin Documentation

**Labels:** `documentation`, `priority: medium`

**Description:**
Create comprehensive documentation for admin system usage and development.

**Acceptance Criteria:**

- [ ] Write admin user guide (how to use the admin panel)
- [ ] Document all permissions and roles
- [ ] Create API documentation (OpenAPI/Swagger)
- [ ] Write database schema documentation
- [ ] Create runbook for common admin tasks
- [ ] Document security best practices
- [ ] Add code comments and JSDoc
- [ ] Create onboarding guide for new admins
- [ ] Document feature flags and how to use them

**Documentation Sections:**

1. Admin User Guide
2. Permission & Role Reference
3. API Documentation
4. Database Schema
5. Security Guidelines
6. Troubleshooting Guide
7. Development Setup

**Files to Create:**

- `docs/admin-guide.md`
- `docs/permissions.md`
- `docs/api-reference.md`
- `docs/database-schema.md`
- `docs/security.md`

---

## 🎯 Milestones

**Milestone 1: MVP (Weeks 1-4)**

- Issues #1-#8 (Foundation + User Management)
- Goal: Basic admin system with user management and RBAC

**Milestone 2: Moderation (Weeks 5-6)**

- Issues #9-#12 (Reports, Audit Logs, Fraud Detection)
- Goal: Complete moderation workflow

**Milestone 3: Verification (Weeks 7-8)**

- Issues #13-#15 (Investor Verification)
- Goal: Investor verification queue operational

**Milestone 4: Analytics (Weeks 9-10)**

- Issues #16-#18 (Analytics Dashboard, Exports)
- Goal: Data-driven insights for platform growth

**Milestone 5: System Management (Weeks 11-12)**

- Issues #19-#22 (Feature Flags, Templates, Announcements)
- Goal: Platform configuration and communication tools

**Milestone 6: Polish (Weeks 13-14)**

- Issues #23-#25 (UI/UX, Notifications, Charts)
- Goal: Production-ready interface

**Milestone 7: Optimization (Weeks 15-16)**

- Issues #26-#28 (Performance, Security)
- Goal: Fast, secure, scalable system

**Milestone 8: Launch Prep (Weeks 17-18)**

- Issues #29-#30 (Testing, Documentation)
- Goal: Fully tested and documented admin system

---

**Total Estimated Time:** 18 weeks (4.5 months)
**Priority Order:** High → Medium → Low
**Team Size:** 2-3 developers recommended

Would you like me to:

1. Create additional issues for specific features?
2. Break down any issue into smaller sub-tasks?
3. Add more detailed technical specifications to any issue?
4. Create a project roadmap with dependencies?

---

## Session Progress (Completed in Current Session)

### Phase 2: User Management

- ✅ Issue #5: User List Page (with filters, search, pagination)
- ✅ Issue #6: User Detail View (profile, suspension history, actions)
- ✅ Issue #7: User Suspend/Ban System (backend + UI)

### Phase 3: Moderation & Safety

- ✅ Issue #9: Reports Dashboard (filters, search, pagination)
- ✅ Issue #10: Report Detail & Review (resolve/dismiss actions)

### Phase 4: Investor Verification

- ✅ Issue #13: Investor Verification Queue (table + approve/reject)
- ✅ Issue #14: Verification Review (inline in queue page)

### Phase 5: Analytics

- ✅ Issue #16: Platform Analytics Dashboard (stats cards, charts)
- ✅ Issue #17: User Growth Analytics (getUserGrowth, getActiveUsers)

### Backend Services Created:

- `src/lib/server/admin/users.ts` - User management CRUD
- `src/lib/server/admin/investors.ts` - Investor verification
- `src/lib/server/admin/reports.ts` - Reports management
- `src/lib/server/analytics.ts` - Analytics service
