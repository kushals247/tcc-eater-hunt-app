'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

async function requireAuth() {
  const isAuth = await getSession()
  if (!isAuth) throw new Error('Unauthorized')
}

// Locations
export async function createLocation(data: {
  name: string
  slug: string
  address?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requireAuth()
    const location = await prisma.location.create({ data })
    return { success: true, id: location.id }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return { success: false, error: 'Unauthorized' }
    }
    console.error('createLocation error:', error)
    return { success: false, error: 'Failed to create location' }
  }
}

export async function updateLocation(
  id: string,
  data: { name: string; slug: string; address?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    await prisma.location.update({ where: { id }, data })
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return { success: false, error: 'Unauthorized' }
    }
    console.error('updateLocation error:', error)
    return { success: false, error: 'Failed to update location' }
  }
}

type HuntPayload = {
  title: string
  description?: string
  locationId: string
  isActive: boolean
  startDate?: Date | null
  endDate?: Date | null
  voucherPrefix: string
  voucherDiscountPercent: number
  voucherExpiryDate?: Date | null
  registrationHeadline: string
  registrationSubtext?: string
  completionMessage: string
  themePreset?: string | null
  themePrimaryColor?: string | null
  themeAccentColor?: string | null
}

// Hunts
export async function createHunt(data: HuntPayload): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requireAuth()
    const hunt = await prisma.hunt.create({ data })
    return { success: true, id: hunt.id }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return { success: false, error: 'Unauthorized' }
    }
    console.error('createHunt error:', error)
    return { success: false, error: 'Failed to create hunt' }
  }
}

export async function updateHunt(id: string, data: HuntPayload): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    await prisma.hunt.update({ where: { id }, data })
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return { success: false, error: 'Unauthorized' }
    }
    console.error('updateHunt error:', error)
    return { success: false, error: 'Failed to update hunt' }
  }
}

// Clues
export async function createClue(data: {
  huntId: string
  poem: string
  taskDescription: string
  locationHint: string
  answerType: string
  correctAnswer: string
  hint?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requireAuth()
    const maxOrder = await prisma.clue.aggregate({
      where: { huntId: data.huntId },
      _max: { order: true },
    })
    const order = (maxOrder._max.order ?? 0) + 1
    const clue = await prisma.clue.create({ data: { ...data, order } })
    return { success: true, id: clue.id }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return { success: false, error: 'Unauthorized' }
    }
    console.error('createClue error:', error)
    return { success: false, error: 'Failed to create clue' }
  }
}

export async function updateClue(
  id: string,
  data: {
    poem: string
    taskDescription: string
    locationHint: string
    answerType: string
    correctAnswer: string
    hint?: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    await prisma.clue.update({ where: { id }, data })
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return { success: false, error: 'Unauthorized' }
    }
    console.error('updateClue error:', error)
    return { success: false, error: 'Failed to update clue' }
  }
}

export async function deleteClue(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const clue = await prisma.clue.findUnique({ where: { id } })
    if (!clue) return { success: false, error: 'Clue not found' }

    await prisma.clue.delete({ where: { id } })

    // Re-order remaining clues
    const remaining = await prisma.clue.findMany({
      where: { huntId: clue.huntId },
      orderBy: { order: 'asc' },
    })
    for (let i = 0; i < remaining.length; i++) {
      await prisma.clue.update({
        where: { id: remaining[i].id },
        data: { order: i + 1 },
      })
    }

    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return { success: false, error: 'Unauthorized' }
    }
    console.error('deleteClue error:', error)
    return { success: false, error: 'Failed to delete clue' }
  }
}

export async function reorderClue(
  id: string,
  direction: 'up' | 'down'
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const clue = await prisma.clue.findUnique({ where: { id } })
    if (!clue) return { success: false, error: 'Clue not found' }

    const sibling = await prisma.clue.findFirst({
      where: {
        huntId: clue.huntId,
        order: direction === 'up' ? clue.order - 1 : clue.order + 1,
      },
    })

    if (!sibling) return { success: false, error: 'Cannot move in that direction' }

    await prisma.$transaction([
      prisma.clue.update({ where: { id: clue.id }, data: { order: sibling.order } }),
      prisma.clue.update({ where: { id: sibling.id }, data: { order: clue.order } }),
    ])

    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return { success: false, error: 'Unauthorized' }
    }
    console.error('reorderClue error:', error)
    return { success: false, error: 'Failed to reorder clue' }
  }
}

export async function exportParticipantsCSV(filters: {
  locationId?: string
  huntId?: string
  status?: string
  search?: string
}): Promise<{ success: boolean; csv?: string; error?: string }> {
  try {
    await requireAuth()

    const where: Record<string, unknown> = {}
    if (filters.locationId) where.locationId = filters.locationId
    if (filters.huntId) where.huntId = filters.huntId
    if (filters.status === 'completed') where.completedAt = { not: null }
    if (filters.status === 'in_progress') where.completedAt = null
    if (filters.search) {
      where.OR = [
        { fullName: { contains: filters.search } },
        { email: { contains: filters.search } },
        { phone: { contains: filters.search } },
        { voucherCode: { contains: filters.search } },
      ]
    }

    const participants = await prisma.participant.findMany({
      where,
      include: {
        hunt: { select: { title: true, clues: { select: { id: true } } } },
        location: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const headers = [
      'Name',
      'Email',
      'Phone',
      'Shopping Intent',
      'Location',
      'Hunt',
      'Started',
      'Completed',
      'Clue Progress',
      'Voucher Code',
    ]

    const rows = participants.map((p) => {
      const totalClues = p.hunt.clues.length
      return [
        p.fullName,
        p.email,
        p.phone,
        p.shoppingIntent || '',
        p.location.name,
        p.hunt.title,
        p.startedAt.toISOString(),
        p.completedAt?.toISOString() || '',
        `${p.currentClueIndex}/${totalClues}`,
        p.voucherCode || '',
      ]
    })

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n')

    return { success: true, csv: csvContent }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return { success: false, error: 'Unauthorized' }
    }
    console.error('exportParticipantsCSV error:', error)
    return { success: false, error: 'Failed to export CSV' }
  }
}

// Registration Questions
export async function createRegistrationQuestion(data: {
  huntId: string
  label: string
  type: string
  options?: string | null
  required: boolean
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requireAuth()
    const maxOrder = await prisma.registrationQuestion.aggregate({
      where: { huntId: data.huntId },
      _max: { order: true },
    })
    const order = (maxOrder._max.order ?? 0) + 1
    const q = await prisma.registrationQuestion.create({ data: { ...data, order } })
    return { success: true, id: q.id }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return { success: false, error: 'Unauthorized' }
    }
    console.error('createRegistrationQuestion error:', error)
    return { success: false, error: 'Failed to create question' }
  }
}

export async function updateRegistrationQuestion(
  id: string,
  data: { label: string; type: string; options?: string | null; required: boolean }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    await prisma.registrationQuestion.update({ where: { id }, data })
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return { success: false, error: 'Unauthorized' }
    }
    console.error('updateRegistrationQuestion error:', error)
    return { success: false, error: 'Failed to update question' }
  }
}

export async function deleteRegistrationQuestion(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const q = await prisma.registrationQuestion.findUnique({ where: { id } })
    if (!q) return { success: false, error: 'Question not found' }
    await prisma.registrationQuestion.delete({ where: { id } })
    // Re-order remaining
    const remaining = await prisma.registrationQuestion.findMany({
      where: { huntId: q.huntId },
      orderBy: { order: 'asc' },
    })
    for (let i = 0; i < remaining.length; i++) {
      await prisma.registrationQuestion.update({ where: { id: remaining[i].id }, data: { order: i + 1 } })
    }
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return { success: false, error: 'Unauthorized' }
    }
    console.error('deleteRegistrationQuestion error:', error)
    return { success: false, error: 'Failed to delete question' }
  }
}

export async function reorderRegistrationQuestion(
  id: string,
  direction: 'up' | 'down'
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAuth()
    const q = await prisma.registrationQuestion.findUnique({ where: { id } })
    if (!q) return { success: false, error: 'Question not found' }
    const sibling = await prisma.registrationQuestion.findFirst({
      where: { huntId: q.huntId, order: direction === 'up' ? q.order - 1 : q.order + 1 },
    })
    if (!sibling) return { success: false, error: 'Cannot move in that direction' }
    await prisma.$transaction([
      prisma.registrationQuestion.update({ where: { id: q.id }, data: { order: sibling.order } }),
      prisma.registrationQuestion.update({ where: { id: sibling.id }, data: { order: q.order } }),
    ])
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return { success: false, error: 'Unauthorized' }
    }
    console.error('reorderRegistrationQuestion error:', error)
    return { success: false, error: 'Failed to reorder question' }
  }
}
