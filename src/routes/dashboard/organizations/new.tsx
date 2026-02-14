import { createFileRoute } from '@tanstack/react-router'
import { CreateOrganizationForm } from '@/components/organization/create-organization-form'

export const Route = createFileRoute('/dashboard/organizations/new')({
  component: NewOrganizationPage,
})

function NewOrganizationPage() {
  return (
    <div className="container mx-auto py-10">
      <CreateOrganizationForm />
    </div>
  )
}
