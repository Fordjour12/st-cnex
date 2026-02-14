'use client'

import { useNavigate } from '@tanstack/react-router'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { ChevronsUpDown, Building2, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { organization } from '@/lib/auth-client'

export type OrganizationData = {
  id: string
  name: string
  slug: string
  logo?: string | null
  metadata?: Record<string, unknown> | null
}

interface OrganizationSwitcherProps {
  organizations: OrganizationData[]
  activeOrganization?: OrganizationData | null
}

export function OrganizationSwitcher({
  organizations,
  activeOrganization,
}: OrganizationSwitcherProps) {
  const { isMobile } = useSidebar()
  const navigate = useNavigate()

  const handleSelectOrg = async (org: OrganizationData) => {
    const result = await organization.setActive({
      organizationId: org.id,
    })

    if (result.error) {
      toast.error('Failed to switch organization')
      return
    }

    navigate({
      to: '/dashboard',
      search: { org: org.slug },
    })
  }

  if (!activeOrganization && organizations.length === 0) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {activeOrganization?.name || 'Select Organization'}
                  </span>
                  <span className="truncate text-xs">
                    {activeOrganization?.slug}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg mb-4"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Organizations
            </DropdownMenuLabel>
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleSelectOrg(org)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <Building2 className="size-4 shrink-0" />
                </div>
                {org.name}
                {org.id === activeOrganization?.id && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    Active
                  </span>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => navigate({ to: '/dashboard/organizations/new' })}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                Add Organization
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
