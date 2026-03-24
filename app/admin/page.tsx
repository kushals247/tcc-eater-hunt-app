export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'
import { MapPin, Compass, Users, Trophy, Plus, ArrowRight } from 'lucide-react'

export default async function AdminDashboard() {
  const [totalLocations, totalHunts, activeHunts, totalParticipants, completionsToday, recentActivity] = await Promise.all([
    prisma.location.count(),
    prisma.hunt.count(),
    prisma.hunt.count({ where: { isActive: true } }),
    prisma.participant.count(),
    prisma.participant.count({
      where: { completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    prisma.participant.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        location: { select: { name: true } },
        hunt: { select: { title: true } },
      },
    }),
  ])

  const stats = [
    {
      label: 'Locations',
      value: totalLocations,
      sub: 'store locations',
      icon: MapPin,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      accent: 'border-l-blue-500',
    },
    {
      label: 'Hunts',
      value: totalHunts,
      sub: `${activeHunts} active`,
      icon: Compass,
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
      accent: 'border-l-violet-500',
    },
    {
      label: 'Participants',
      value: totalParticipants,
      sub: 'all time',
      icon: Users,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      accent: 'border-l-amber-500',
    },
    {
      label: 'Completions Today',
      value: completionsToday,
      sub: 'vouchers earned',
      icon: Trophy,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      accent: 'border-l-emerald-500',
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">Overview of your treasure hunt program</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map(({ label, value, sub, icon: Icon, iconBg, iconColor, accent }) => (
          <div key={label} className={`bg-white rounded-xl border border-slate-200 border-l-4 ${accent} p-5 flex items-start gap-4 shadow-sm`}>
            <div className={`${iconBg} p-2.5 rounded-lg flex-shrink-0`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">{label}</p>
              <p className="text-3xl font-bold text-slate-900 mt-0.5 leading-none">{value}</p>
              <p className="text-xs text-slate-400 mt-1">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          href="/admin/hunts/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Hunt
        </Link>
        <Link
          href="/admin/locations"
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Manage Locations
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          href="/admin/participants"
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          View Participants
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Recent Activity</h2>
          <Link href="/admin/participants" className="text-xs text-slate-500 hover:text-slate-900 transition-colors">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Name</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Location</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Hunt</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Started</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Completed</th>
                <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Voucher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentActivity.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="text-3xl mb-2">🎯</div>
                    <p>No participants yet. Share your QR codes to get started!</p>
                  </td>
                </tr>
              ) : (
                recentActivity.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-slate-900">{p.fullName}</td>
                    <td className="px-6 py-3.5 text-slate-600">{p.location.name}</td>
                    <td className="px-6 py-3.5 text-slate-600 max-w-[160px] truncate">{p.hunt.title}</td>
                    <td className="px-6 py-3.5 text-slate-400 text-xs">{formatDateTime(p.startedAt)}</td>
                    <td className="px-6 py-3.5 text-slate-400 text-xs">
                      {p.completedAt ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          ✓ {formatDateTime(p.completedAt)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      {p.voucherCode ? (
                        <span className="font-mono text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded">
                          {p.voucherCode}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
