import { prisma } from '@/lib/prisma'
import ParticipantsClient from './participants-client'

export default async function ParticipantsPage({ searchParams }: { searchParams: Promise<{ locationId?: string; huntId?: string; status?: string; search?: string }> }) {
  const params = await searchParams

  const where: Record<string, unknown> = {}
  if (params.locationId) where.locationId = params.locationId
  if (params.huntId) where.huntId = params.huntId
  if (params.status === 'completed') where.completedAt = { not: null }
  if (params.status === 'in_progress') where.completedAt = null
  if (params.search) {
    where.OR = [
      { fullName: { contains: params.search } },
      { email: { contains: params.search } },
      { phone: { contains: params.search } },
      { voucherCode: { contains: params.search } },
    ]
  }

  const [participants, locations, hunts] = await Promise.all([
    prisma.participant.findMany({
      where,
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        hunt: { include: { clues: { select: { id: true } } } },
        location: { select: { name: true } },
        attempts: {
          orderBy: { attemptedAt: 'asc' },
          include: { clue: { select: { order: true, poem: true } } },
        },
        registrationAnswers: {
          include: { question: { select: { label: true, type: true, order: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    prisma.location.findMany({ orderBy: { name: 'asc' } }),
    prisma.hunt.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true, locationId: true } }),
  ])

  return (
    <ParticipantsClient
      participants={participants}
      locations={locations}
      hunts={hunts}
      filters={params}
    />
  )
}
