import { prisma } from '@/lib/prisma'
import RegistrationForm from './registration-form'
import { resolveTheme } from '@/lib/themes'

export default async function HuntRegistrationPage({
  params,
}: {
  params: Promise<{ locationSlug: string; huntId: string }>
}) {
  const { locationSlug, huntId } = await params

  const location = await prisma.location.findUnique({ where: { slug: locationSlug } })
  if (!location) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-lg">
          <div className="text-5xl mb-4">😔</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Location Not Found</h1>
          <p className="text-gray-500">This QR code doesn&apos;t match any of our store locations. Please visit your nearest store for assistance.</p>
        </div>
      </div>
    )
  }

  const hunt = await prisma.hunt.findUnique({
    where: { id: huntId },
    include: {
      registrationQuestions: { orderBy: { order: 'asc' } },
    },
  })
  const now = new Date()
  const isExpired = hunt?.endDate && hunt.endDate < now
  const isNotStarted = hunt?.startDate && hunt.startDate > now
  const isActive = hunt?.isActive && !isExpired && !isNotStarted

  const theme = hunt ? resolveTheme(hunt) : null
  const pageBg = theme
    ? `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgMid}, ${theme.bgTo})`
    : 'linear-gradient(135deg, #f0fdf4, #fefce8, #fff7ed)'

  if (!hunt || !isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: pageBg }}>
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-lg">
          {hunt?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hunt.logoUrl} alt="" className="h-16 w-auto mx-auto mb-4 object-contain" />
          ) : (
            <div className="text-5xl mb-4">⏰</div>
          )}
          <h1 className="text-xl font-bold text-gray-800 mb-2">Hunt Not Available</h1>
          <p className="text-gray-500 mb-4">
            {isExpired ? 'This treasure hunt has ended.' :
             isNotStarted ? "This treasure hunt hasn't started yet." :
             'This treasure hunt is currently not active.'}
          </p>
          <p className="text-sm text-gray-400">Please visit our store or speak to a team member for more information.</p>
        </div>
      </div>
    )
  }

  const questions = hunt.registrationQuestions.map((q) => ({
    id: q.id,
    label: q.label,
    type: q.type,
    options: q.options ? (JSON.parse(q.options) as string[]) : [],
    required: q.required,
    order: q.order,
  }))

  return (
    <div className="min-h-screen" style={{ background: pageBg }}>
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          {hunt.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hunt.logoUrl} alt={hunt.title} className="h-20 w-auto mx-auto mb-4 object-contain drop-shadow-sm" />
          ) : (
            <div className="text-5xl mb-4">🎯</div>
          )}
          <h1 className="text-2xl font-bold mb-2" style={{ color: theme?.primary }}>
            {hunt.title}
          </h1>
          <h2 className="text-xl font-semibold text-gray-800 mb-2 leading-tight">{hunt.registrationHeadline}</h2>
          {hunt.registrationSubtext && (
            <p className="text-gray-500">{hunt.registrationSubtext}</p>
          )}
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Enter your details to begin</h3>
          <RegistrationForm
            huntId={hunt.id}
            locationId={location.id}
            locationSlug={locationSlug}
            questions={questions}
            primaryColor={theme?.primary}
          />
        </div>
      </div>
    </div>
  )
}
