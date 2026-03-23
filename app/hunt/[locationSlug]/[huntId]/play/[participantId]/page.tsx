import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import HuntPlayClient from './hunt-play-client'
import { resolveTheme } from '@/lib/themes'

export default async function PlayPage({
  params,
}: {
  params: Promise<{ locationSlug: string; huntId: string; participantId: string }>
}) {
  const { locationSlug, huntId, participantId } = await params

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
    redirect(`/hunt/${locationSlug}/${huntId}`)
  }

  if (participant.huntId !== huntId) {
    redirect(`/hunt/${locationSlug}/${huntId}`)
  }

  const clues = participant.hunt.clues.map((c) => ({
    id: c.id,
    order: c.order,
    poem: c.poem,
    taskDescription: c.taskDescription,
    locationHint: c.locationHint,
    answerType: c.answerType,
    // Never send correctAnswer to client
  }))

  const theme = resolveTheme(participant.hunt)

  return (
    <HuntPlayClient
      participant={{
        id: participant.id,
        fullName: participant.fullName,
        currentClueIndex: participant.currentClueIndex,
        completedAt: participant.completedAt?.toISOString() || null,
        voucherCode: participant.voucherCode,
      }}
      hunt={{
        id: participant.hunt.id,
        title: participant.hunt.title,
        completionMessage: participant.hunt.completionMessage,
        voucherDiscountPercent: participant.hunt.voucherDiscountPercent,
        voucherExpiryDate: participant.hunt.voucherExpiryDate?.toISOString() || null,
      }}
      clues={clues}
      theme={theme}
    />
  )
}
