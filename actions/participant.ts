'use server'

import { prisma } from '@/lib/prisma'
import { validateAnswer } from '@/lib/answer-validator'
import { generateVoucherCode } from '@/lib/voucher'
import { sendVoucherEmail } from '@/lib/email'

interface RegisterParticipantData {
  huntId: string
  locationId: string
  fullName: string
  email: string
  phone: string
  shoppingIntent?: string
  customAnswers?: { questionId: string; value: string }[]
}

export async function registerParticipant(data: RegisterParticipantData): Promise<{
  success: boolean
  participantId?: string
  error?: string
}> {
  try {
    const participant = await prisma.participant.create({
      data: {
        huntId: data.huntId,
        locationId: data.locationId,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        shoppingIntent: data.shoppingIntent || null,
        currentClueIndex: 0,
      },
    })

    if (data.customAnswers && data.customAnswers.length > 0) {
      await prisma.registrationAnswer.createMany({
        data: data.customAnswers.map((a) => ({
          participantId: participant.id,
          questionId: a.questionId,
          value: a.value,
        })),
      })
    }

    return { success: true, participantId: participant.id }
  } catch (error) {
    console.error('Failed to register participant:', error)
    return { success: false, error: 'Failed to register. Please try again.' }
  }
}

export async function submitAnswer(
  participantId: string,
  clueId: string,
  answer: string
): Promise<{
  success: boolean
  correct?: boolean
  isComplete?: boolean
  voucherCode?: string
  hint?: string
  error?: string
}> {
  try {
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        hunt: {
          include: {
            clues: { orderBy: { order: 'asc' } },
            location: true,
          },
        },
      },
    })

    if (!participant) {
      return { success: false, error: 'Participant not found' }
    }

    if (participant.completedAt) {
      return { success: true, correct: true, isComplete: true, voucherCode: participant.voucherCode || undefined }
    }

    const clue = participant.hunt.clues.find((c) => c.id === clueId)
    if (!clue) {
      return { success: false, error: 'Clue not found' }
    }

    // Verify this clue belongs to participant's current position
    const currentClue = participant.hunt.clues[participant.currentClueIndex]
    if (!currentClue || currentClue.id !== clueId) {
      return { success: false, error: 'Invalid clue for current position' }
    }

    const isCorrect = validateAnswer(
      answer,
      clue.correctAnswer,
      clue.answerType as 'CODE' | 'TEXT' | 'NUMBER'
    )

    // Log the attempt
    await prisma.clueAttempt.create({
      data: {
        participantId,
        clueId,
        answer,
        isCorrect,
      },
    })

    if (!isCorrect) {
      // Count wrong attempts for hint
      const wrongAttempts = await prisma.clueAttempt.count({
        where: {
          participantId,
          clueId,
          isCorrect: false,
        },
      })

      return {
        success: true,
        correct: false,
        hint: wrongAttempts >= 2 ? clue.hint || undefined : undefined,
      }
    }

    // Correct answer — advance participant
    const nextClueIndex = participant.currentClueIndex + 1
    const isLastClue = nextClueIndex >= participant.hunt.clues.length

    if (isLastClue) {
      // Generate voucher
      const voucherCode = await generateVoucherCode(
        participant.hunt.voucherPrefix,
        participant.hunt.location.slug
      )

      await prisma.participant.update({
        where: { id: participantId },
        data: {
          currentClueIndex: nextClueIndex,
          completedAt: new Date(),
          voucherCode,
        },
      })

      return {
        success: true,
        correct: true,
        isComplete: true,
        voucherCode,
      }
    } else {
      await prisma.participant.update({
        where: { id: participantId },
        data: { currentClueIndex: nextClueIndex },
      })

      return { success: true, correct: true, isComplete: false }
    }
  } catch (error) {
    console.error('Failed to submit answer:', error)
    return { success: false, error: 'Failed to submit answer. Please try again.' }
  }
}

export async function sendVoucherEmailAction(participantId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: { hunt: { include: { location: true } } },
    })

    if (!participant || !participant.voucherCode) {
      return { success: false, error: 'Participant or voucher not found' }
    }

    const sent = await sendVoucherEmail({
      to: participant.email,
      participantName: participant.fullName.split(' ')[0],
      voucherCode: participant.voucherCode,
      discountPercent: participant.hunt.voucherDiscountPercent,
      expiryDate: participant.hunt.voucherExpiryDate,
      huntTitle: participant.hunt.title,
      locationName: participant.hunt.location.name,
    })

    if (!sent) {
      return { success: false, error: 'Email could not be sent' }
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to send voucher email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}
