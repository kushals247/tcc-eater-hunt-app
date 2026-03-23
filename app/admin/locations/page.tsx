import { prisma } from '@/lib/prisma'
import { formatDateTime } from '@/lib/utils'
import LocationsClient from './locations-client'

export default async function LocationsPage() {
  const locations = await prisma.location.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { hunts: true, participants: true },
      },
    },
  })

  return <LocationsClient locations={locations} />
}
