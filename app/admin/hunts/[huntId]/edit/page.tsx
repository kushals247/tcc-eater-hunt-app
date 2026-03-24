export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import HuntFormClient from '../../hunt-form-client'
import RegistrationQuestionsBuilder from '@/components/admin/registration-questions-builder'

export default async function EditHuntPage({ params }: { params: Promise<{ huntId: string }> }) {
  const { huntId } = await params
  const [hunt, locations] = await Promise.all([
    prisma.hunt.findUnique({
      where: { id: huntId },
      include: {
        registrationQuestions: { orderBy: { order: 'asc' } },
      },
    }),
    prisma.location.findMany({ orderBy: { name: 'asc' } }),
  ])
  if (!hunt) notFound()

  return (
    <div className="space-y-10">
      <div>
        <div className="mb-6">
          <nav className="text-sm text-gray-500 mb-2">
            <a href="/admin/hunts" className="hover:text-gray-700">Hunts</a> / Edit Hunt
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Edit: {hunt.title}</h1>
        </div>
        <HuntFormClient locations={locations} hunt={hunt} />
      </div>

      <div className="border-t border-slate-200 pt-10">
        <RegistrationQuestionsBuilder
          huntId={hunt.id}
          initialQuestions={hunt.registrationQuestions}
        />
      </div>
    </div>
  )
}
