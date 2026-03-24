export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { VouchersClient } from './vouchers-client'

export default async function VouchersPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const vouchers = await prisma.participant.findMany({
    where: { voucherCode: { not: null } },
    orderBy: { completedAt: 'desc' },
    select: {
      id: true,
      fullName: true,
      voucherCode: true,
      voucherUsed: true,
      voucherUsedAt: true,
      completedAt: true,
      hunt: {
        select: {
          title: true,
          voucherDiscountPercent: true,
          voucherExpiryDate: true,
          location: { select: { name: true } },
        },
      },
    },
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Voucher Redemption</h1>
        <p className="text-slate-500 text-sm mt-1">Track and mark vouchers as used when customers present them at checkout.</p>
      </div>
      <VouchersClient vouchers={vouchers} canEdit={session.role !== 'VIEWER'} />
    </div>
  )
}
