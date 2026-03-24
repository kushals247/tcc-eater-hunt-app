export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import QRPageClient from './qr-client'

export default async function QRPage({ params }: { params: Promise<{ huntId: string }> }) {
  const { huntId } = await params
  const hunt = await prisma.hunt.findUnique({
    where: { id: huntId },
    include: { location: true },
  })
  if (!hunt) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const registrationUrl = `${baseUrl}/hunt/${hunt.location.slug}/${hunt.id}`

  return <QRPageClient hunt={hunt} registrationUrl={registrationUrl} />
}
