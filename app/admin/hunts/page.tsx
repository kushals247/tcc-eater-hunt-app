export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

function getHuntStatus(hunt: { isActive: boolean; startDate: Date | null; endDate: Date | null }) {
  const now = new Date()
  if (hunt.endDate && hunt.endDate < now) return { label: 'Expired', color: 'bg-red-100 text-red-700' }
  if (hunt.startDate && hunt.startDate > now) return { label: 'Scheduled', color: 'bg-blue-100 text-blue-700' }
  if (hunt.isActive) return { label: 'Active', color: 'bg-green-100 text-green-700' }
  return { label: 'Inactive', color: 'bg-gray-100 text-gray-600' }
}

export default async function HuntsPage({ searchParams }: { searchParams: Promise<{ locationId?: string; status?: string }> }) {
  const params = await searchParams
  const [hunts, locations] = await Promise.all([
    prisma.hunt.findMany({
      where: {
        ...(params.locationId ? { locationId: params.locationId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        location: { select: { name: true, slug: true } },
        _count: { select: { clues: true, participants: true } },
      },
    }),
    prisma.location.findMany({ orderBy: { name: 'asc' } }),
  ])

  const completionCounts = await Promise.all(
    hunts.map((h) =>
      prisma.participant.count({ where: { huntId: h.id, completedAt: { not: null } } })
    )
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hunts</h1>
          <p className="text-gray-500 mt-1">Manage treasure hunts across all locations</p>
        </div>
        <Link href="/admin/hunts/new" className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
          + Create Hunt
        </Link>
      </div>

      {/* Filter Bar */}
      <form className="flex gap-3 mb-6">
        <select name="locationId" defaultValue={params.locationId || ''} className="h-9 px-3 rounded-md border border-gray-300 text-sm bg-white">
          <option value="">All Locations</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <button type="submit" className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200">Filter</button>
        {params.locationId && (
          <Link href="/admin/hunts" className="px-3 py-1.5 text-gray-500 rounded-md text-sm hover:bg-gray-100">Clear</Link>
        )}
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Title</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Location</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Clues</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Participants</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Completions</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {hunts.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No hunts yet. Create your first hunt!</td></tr>
              ) : (
                hunts.map((hunt, i) => {
                  const status = getHuntStatus(hunt)
                  return (
                    <tr key={hunt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900">{hunt.title}</td>
                      <td className="px-6 py-3 text-gray-600">{hunt.location.name}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
                      </td>
                      <td className="px-6 py-3 text-gray-600">{hunt._count.clues}</td>
                      <td className="px-6 py-3 text-gray-600">{hunt._count.participants}</td>
                      <td className="px-6 py-3 text-gray-600">{completionCounts[i]}</td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2 flex-wrap">
                          <Link href={`/admin/hunts/${hunt.id}/edit`} className="text-blue-600 hover:text-blue-700 text-xs font-medium">Edit</Link>
                          <Link href={`/admin/hunts/${hunt.id}/clues`} className="text-green-600 hover:text-green-700 text-xs font-medium">Clues</Link>
                          <Link href={`/admin/hunts/${hunt.id}/qr`} className="text-purple-600 hover:text-purple-700 text-xs font-medium">QR Code</Link>
                          <Link href={`/admin/participants?huntId=${hunt.id}`} className="text-gray-500 hover:text-gray-700 text-xs font-medium">Participants</Link>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
