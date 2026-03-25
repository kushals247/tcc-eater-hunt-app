'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// ─── Locations ───────────────────────────────────────────────────────────────

export async function createLocation(data: {
  name: string
  slug: string
  address?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requireRole(['ADMIN'])
    const location = await prisma.location.create({ data })
    revalidatePath('/admin/locations')
    return { success: true, id: location.id }
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return { success: false, error: error.message }
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
    await requireRole(['ADMIN'])
    await prisma.location.update({ where: { id }, data })
    revalidatePath('/admin/locations')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return { success: false, error: error.message }
    }
    console.error('updateLocation error:', error)
    return { success: false, error: 'Failed to update location' }
  }
}

// ─── Hunts ────────────────────────────────────────────────────────────────────

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
  logoUrl?: string | null
}

export async function createHunt(data: HuntPayload): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requireRole(['ADMIN'])
    const hunt = await prisma.hunt.create({ data })
    revalidatePath('/admin/hunts')
    return { success: true, id: hunt.id }
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return { success: false, error: error.message }
    }
    console.error('createHunt error:', error)
    return { success: false, error: 'Failed to create hunt' }
  }
}

export async function updateHunt(id: string, data: HuntPayload): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(['ADMIN'])
    await prisma.hunt.update({ where: { id }, data })
    revalidatePath('/admin/hunts')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return { success: false, error: error.message }
    }
    console.error('updateHunt error:', error)
    return { success: false, error: 'Failed to update hunt' }
  }
}

// ─── Clues ────────────────────────────────────────────────────────────────────

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
    await requireRole(['ADMIN'])
    const maxOrder = await prisma.clue.aggregate({
      where: { huntId: data.huntId },
      _max: { order: true },
    })
    const order = (maxOrder._max.order ?? 0) + 1
    const clue = await prisma.clue.create({ data: { ...data, order } })
    return { success: true, id: clue.id }
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return { success: false, error: error.message }
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
    await requireRole(['ADMIN'])
    await prisma.clue.update({ where: { id }, data })
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return { success: false, error: error.message }
    }
    console.error('updateClue error:', error)
    return { success: false, error: 'Failed to update clue' }
  }
}

export async function deleteClue(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(['ADMIN'])
    const clue = await prisma.clue.findUnique({ where: { id } })
    if (!clue) return { success: false, error: 'Clue not found' }
    await prisma.clue.delete({ where: { id } })
    const remaining = await prisma.clue.findMany({
      where: { huntId: clue.huntId },
      orderBy: { order: 'asc' },
    })
    for (let i = 0; i < remaining.length; i++) {
      await prisma.clue.update({ where: { id: remaining[i].id }, data: { order: i + 1 } })
    }
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return { success: false, error: error.message }
    }
    console.error('deleteClue error:', error)
    return { success: false, error: 'Failed to delete clue' }
  }
}

export async function reorderClue(id: string, direction: 'up' | 'down'): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(['ADMIN'])
    const clue = await prisma.clue.findUnique({ where: { id } })
    if (!clue) return { success: false, error: 'Clue not found' }
    const sibling = await prisma.clue.findFirst({
      where: { huntId: clue.huntId, order: direction === 'up' ? clue.order - 1 : clue.order + 1 },
    })
    if (!sibling) return { success: false, error: 'Cannot move in that direction' }
    await prisma.$transaction([
      prisma.clue.update({ where: { id: clue.id }, data: { order: sibling.order } }),
      prisma.clue.update({ where: { id: sibling.id }, data: { order: clue.order } }),
    ])
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return { success: false, error: error.message }
    }
    console.error('reorderClue error:', error)
    return { success: false, error: 'Failed to reorder clue' }
  }
}

// ─── Participants ─────────────────────────────────────────────────────────────

export async function markVoucherUsed(
  participantId: string,
  used: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(['ADMIN', 'VOUCHER_STAFF'])
    await prisma.participant.update({
      where: { id: participantId },
      data: {
        voucherUsed: used,
        voucherUsedAt: used ? new Date() : null,
      },
    })
    revalidatePath('/admin/participants')
    revalidatePath('/admin/vouchers')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return { success: false, error: error.message }
    }
    console.error('markVoucherUsed error:', error)
    return { success: false, error: 'Failed to update voucher status' }
  }
}

export async function exportParticipantsCSV(filters: {
  locationId?: string
  huntId?: string
  status?: string
  search?: string
}): Promise<{ success: boolean; csv?: string; error?: string }> {
  try {
    await requireRole(['ADMIN', 'VIEWER'])

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

    const headers = ['Name', 'Email', 'Phone', 'Location', 'Hunt', 'Started', 'Completed', 'Clue Progress', 'Voucher Code', 'Voucher Used']
    const rows = participants.map((p: any) => {
      const totalClues = p.hunt.clues.length
      return [
        p.fullName, p.email, p.phone,
        p.location.name, p.hunt.title,
        p.startedAt.toISOString(), p.completedAt?.toISOString() || '',
        `${p.currentClueIndex}/${totalClues}`,
        p.voucherCode || '',
        p.voucherUsed ? 'Yes' : 'No',
      ]
    })

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    return { success: true, csv: csvContent }
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return { success: false, error: error.message }
    }
    console.error('exportParticipantsCSV error:', error)
    return { success: false, error: 'Failed to export CSV' }
  }
}

// ─── Registration Questions ───────────────────────────────────────────────────

export async function createRegistrationQuestion(data: {
  huntId: string
  label: string
  type: string
  options?: string | null
  required: boolean
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requireRole(['ADMIN'])
    const maxOrder = await prisma.registrationQuestion.aggregate({
      where: { huntId: data.huntId },
      _max: { order: true },
    })
    const order = (maxOrder._max.order ?? 0) + 1
    const q = await prisma.registrationQuestion.create({ data: { ...data, order } })
    return { success: true, id: q.id }
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return { success: false, error: error.message }
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
    await requireRole(['ADMIN'])
    await prisma.registrationQuestion.update({ where: { id }, data })
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return { success: false, error: error.message }
    }
    console.error('updateRegistrationQuestion error:', error)
    return { success: false, error: 'Failed to update question' }
  }
}

export async function deleteRegistrationQuestion(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(['ADMIN'])
    const q = await prisma.registrationQuestion.findUnique({ where: { id } })
    if (!q) return { success: false, error: 'Question not found' }
    await prisma.registrationQuestion.delete({ where: { id } })
    const remaining = await prisma.registrationQuestion.findMany({
      where: { huntId: q.huntId },
      orderBy: { order: 'asc' },
    })
    for (let i = 0; i < remaining.length; i++) {
      await prisma.registrationQuestion.update({ where: { id: remaining[i].id }, data: { order: i + 1 } })
    }
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return { success: false, error: error.message }
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
    await requireRole(['ADMIN'])
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
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return { success: false, error: error.message }
    }
    console.error('reorderRegistrationQuestion error:', error)
    return { success: false, error: 'Failed to reorder question' }
  }
}

// ─── Admin Users ──────────────────────────────────────────────────────────────

export async function createAdminUser(data: {
  username: string
  email?: string
  password: string
  role: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requireRole(['ADMIN'])
    const valid = ['ADMIN', 'VIEWER', 'VOUCHER_STAFF']
    if (!valid.includes(data.role)) return { success: false, error: 'Invalid role' }
    const passwordHash = await bcrypt.hash(data.password, 10)
    const user = await prisma.adminUser.create({
      data: { username: data.username, email: data.email, passwordHash, role: data.role },
    })
    revalidatePath('/admin/users')
    return { success: true, id: user.id }
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return { success: false, error: error.message }
    }
    const msg = (error as { code?: string })?.code === 'P2002' ? 'Username already taken' : 'Failed to create user'
    console.error('createAdminUser error:', error)
    return { success: false, error: msg }
  }
}

export async function updateAdminUser(
  id: string,
  data: { email?: string; role?: string; isActive?: boolean; password?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireRole(['ADMIN'])
    const valid = ['ADMIN', 'VIEWER', 'VOUCHER_STAFF']
    if (data.role && !valid.includes(data.role)) return { success: false, error: 'Invalid role' }

    if (data.isActive === false && session.userId === id) {
      return { success: false, error: 'Cannot deactivate your own account' }
    }

    const updateData: Record<string, unknown> = {}
    if (data.email !== undefined) updateData.email = data.email
    if (data.role) updateData.role = data.role
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 10)

    await prisma.adminUser.update({ where: { id }, data: updateData })
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return { success: false, error: error.message }
    }
    console.error('updateAdminUser error:', error)
    return { success: false, error: 'Failed to update user' }
  }
}

// ─── Delete Actions (ADMIN only) ──────────────────────────────────────────────

export async function deleteLocation(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(['ADMIN'])
    // Refuse if location has hunts — delete hunts first
    const huntCount = await prisma.hunt.count({ where: { locationId: id } })
    if (huntCount > 0) {
      return { success: false, error: `Cannot delete: this location has ${huntCount} hunt${huntCount > 1 ? 's' : ''} linked to it. Delete those hunts first.` }
    }
    await prisma.location.delete({ where: { id } })
    revalidatePath('/admin/locations')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return { success: false, error: error.message }
    }
    console.error('deleteLocation error:', error)
    return { success: false, error: 'Failed to delete location' }
  }
}

export async function deleteAdminUser(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireRole(['ADMIN'])
    if (session.userId === id) {
      return { success: false, error: 'Cannot delete your own account' }
    }
    await prisma.adminUser.delete({ where: { id } })
    revalidatePath('/admin/users')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return { success: false, error: error.message }
    }
    console.error('deleteAdminUser error:', error)
    return { success: false, error: 'Failed to delete user' }
  }
}

export async function deleteParticipant(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(['ADMIN'])
    // Delete child records first (no cascade defined in schema)
    await prisma.$transaction([
      prisma.clueAttempt.deleteMany({ where: { participantId: id } }),
      prisma.registrationAnswer.deleteMany({ where: { participantId: id } }),
      prisma.participant.delete({ where: { id } }),
    ])
    revalidatePath('/admin/vouchers')
    revalidatePath('/admin/participants')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return { success: false, error: error.message }
    }
    console.error('deleteParticipant error:', error)
    return { success: false, error: 'Failed to delete record' }
  }
}
