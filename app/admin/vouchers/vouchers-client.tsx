'use client'

import { useState, useMemo } from 'react'
import { markVoucherUsed } from '@/actions/admin'

type Voucher = {
  id: string
  fullName: string
  voucherCode: string | null
  voucherUsed: boolean
  voucherUsedAt: Date | null
  completedAt: Date | null
  hunt: {
    title: string
    voucherDiscountPercent: number
    voucherExpiryDate: Date | null
    location: { name: string }
  }
}

export function VouchersClient({ vouchers: initial, canEdit }: { vouchers: Voucher[]; canEdit: boolean }) {
  const [vouchers, setVouchers] = useState(initial)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'unused' | 'used'>('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = vouchers
    if (filter === 'unused') list = list.filter((v) => !v.voucherUsed)
    if (filter === 'used') list = list.filter((v) => v.voucherUsed)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (v) =>
          v.fullName.toLowerCase().includes(q) ||
          (v.voucherCode ?? '').toLowerCase().includes(q) ||
          v.hunt.title.toLowerCase().includes(q) ||
          v.hunt.location.name.toLowerCase().includes(q)
      )
    }
    return list
  }, [vouchers, search, filter])

  async function toggle(v: Voucher) {
    setLoadingId(v.id)
    const res = await markVoucherUsed(v.id, !v.voucherUsed)
    setLoadingId(null)
    if (res.success) {
      setVouchers((prev) =>
        prev.map((x) =>
          x.id === v.id
            ? { ...x, voucherUsed: !v.voucherUsed, voucherUsedAt: !v.voucherUsed ? new Date() : null }
            : x
        )
      )
    }
  }

  const usedCount = vouchers.filter((v) => v.voucherUsed).length
  const totalCount = vouchers.length

  return (
    <>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Vouchers', value: totalCount, color: 'border-l-slate-400' },
          { label: 'Redeemed', value: usedCount, color: 'border-l-green-500' },
          { label: 'Unredeemed', value: totalCount - usedCount, color: 'border-l-amber-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-white rounded-xl border border-slate-200 border-l-4 ${color} px-5 py-4 shadow-sm`}>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 px-6 py-4 border-b border-slate-100">
          <input
            type="search"
            placeholder="Search by name, code or hunt…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 h-9 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
          <div className="flex gap-1">
            {(['all', 'unused', 'used'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                  filter === f ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f === 'all' ? 'All' : f === 'unused' ? 'Unredeemed' : 'Redeemed'}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            {search || filter !== 'all' ? 'No vouchers match your search.' : 'No vouchers issued yet.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Participant</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Voucher Code</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Hunt / Location</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiry</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                {canEdit && <th className="px-6 py-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((v) => (
                <tr key={v.id} className={`hover:bg-slate-50 ${v.voucherUsed ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4 font-medium text-slate-900">{v.fullName}</td>
                  <td className="px-6 py-4">
                    <code className="bg-slate-100 text-slate-800 text-xs font-mono px-2 py-1 rounded">
                      {v.voucherCode}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div>{v.hunt.title}</div>
                    <div className="text-xs text-slate-400">{v.hunt.location.name}</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700">
                    {v.hunt.voucherDiscountPercent}% OFF
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {v.hunt.voucherExpiryDate
                      ? new Date(v.hunt.voucherExpiryDate).toLocaleDateString('en-GB')
                      : 'No expiry'}
                  </td>
                  <td className="px-6 py-4">
                    {v.voucherUsed ? (
                      <div>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                          ✓ Redeemed
                        </span>
                        {v.voucherUsedAt && (
                          <div className="text-xs text-slate-400 mt-0.5">
                            {new Date(v.voucherUsedAt).toLocaleDateString('en-GB')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                        Unused
                      </span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggle(v)}
                        disabled={loadingId === v.id}
                        className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 ${
                          v.voucherUsed
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {loadingId === v.id ? '…' : v.voucherUsed ? 'Undo' : 'Mark Used'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
