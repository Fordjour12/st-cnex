# Organization Feature Design

## Overview

Multi-tenant organization system supporting founders, investors, and accelerators with teams capability.

## Architecture

### Organization Types

- `startup` - Created by founders
- `investor` - Created by investors
- `accelerator` - Created by accelerators

### Roles

**Standard Roles:**

- `owner` - Full control (creator gets this by default)
- `admin` - Full control except delete/owner transfer
- `member` - Read-only access

**Custom Roles by Organization Type:**

| Type        | Custom Roles                         |
| ----------- | ------------------------------------ |
| Startup     | `coFounder`, `advisor`, `employee`   |
| Investor    | `partner`, `analyst`, `associate`    |
| Accelerator | `mentor`, `program_manager`, `staff` |

### Teams

- Enabled for all organization types
- Used for sub-grouping within organizations

## Data Flow

1. User signs up → creates profile (founder/investor/talent)
2. Founder can create startup org OR join existing
3. Investor creates investor org for their fund
4. Accelerator creates accelerator org for their program
5. Talent joins startup orgs (assigned to teams)
6. Invitations sent via email for all join flows

## Database Changes

### New/Modified Tables

- `organization` - Add `type` field (startup/investor/accelerator)
- `team` - New table (when teams enabled)
- `teamMember` - New table
- `invitation` - Add `teamId` field (optional, for teams)

## Implementation Phases

### Phase 1: Schema & Core (Already done)

- Organization plugin setup
- Basic tables (organization, member, invitation)
- Session columns (activeOrganizationId, activeTeamId)

### Phase 2: Organization Type & Custom Fields

- Add `type` field to organization table
- Configure custom fields for each organization type

### Phase 3: Teams

- Enable teams in plugin config
- Add team/teamMember tables
- Add teamId to invitation

### Phase 4: Custom Permissions

- Define custom roles per organization type
- Configure access control

### Phase 5: API & UI

- Server functions for org management
- React components for org/team management
