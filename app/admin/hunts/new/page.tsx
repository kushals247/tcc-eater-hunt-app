export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import HuntFormClient from '../hunt-form-client'

export default async function NewHuntPage() {
  const locations = await prisma.location.findMany({ orderBy: { name: 'asc' } })
  return (
    <div>
      <div className="mb-6">
        <nav className="text-sm text-gray-500 mb-2">
          <a href="/admin/hunts" className="hover:text-gray-700">Hunts</a> / New Hunt
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Create New Hunt</h1>
      </div>
      <HuntFormClient locations={locations} />
    </div>
  )
}
