import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ClueBuilderClient from './clue-builder-client'

export default async function CluesPage({ params }: { params: Promise<{ huntId: string }> }) {
  const { huntId } = await params
  const hunt = await prisma.hunt.findUnique({
    where: { id: huntId },
    include: {
      location: { select: { name: true } },
      clues: { orderBy: { order: 'asc' } },
    },
  })
  if (!hunt) notFound()

  return (
    <div>
      <div className="mb-6">
        <nav className="text-sm text-gray-500 mb-2">
          <a href="/admin/hunts" className="hover:text-gray-700">Hunts</a> /
          <a href={`/admin/hunts/${hunt.id}/edit`} className="hover:text-gray-700 mx-1">{hunt.title}</a>
          / Clues
        </nav>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Clue Builder</h1>
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded">{hunt.location.name}</span>
        </div>
        <p className="text-gray-500 mt-1">Build the clue sequence for this hunt. Customers will see them in order.</p>
      </div>
      <ClueBuilderClient hunt={hunt} initialClues={hunt.clues} />
    </div>
  )
}
