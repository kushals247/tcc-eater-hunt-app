'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { exportParticipantsCSV } from '@/actions/admin'
import { formatDateTime } from '@/lib/utils'

type Participant = {
  id: string
  fullName: string
  email: string
  phone: string
  shoppingIntent: string | null
  currentClueIndex: number
  startedAt: Date
  completedAt: Date | null
  voucherCode: string | null
  location: { name: string }
  hunt: { title: string; clues: { id: string }[] }
  attempts: Array<{
    id: string
    answer: string
    isCorrect: boolean
    attemptedAt: Date
    clue: { order: number; poem: string }
  }>
  registrationAnswers: Array<{
    id: string
    value: string
    question: { label: string; type: string; order: number }
  }>
}

export default function ParticipantsClient({
  participants,
  locations,
  hunts,
  filters,
}: {
  participants: Participant[]
  locations: { id: string; name: string }[]
  hunts: { id: string; title: string; locationId: string }[]
  filters: { locationId?: string; huntId?: string; status?: string; search?: string }
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<Participant | null>(null)
  const [exporting, setExporting] = useState(false)

  const filteredHunts = filters.locationId ? hunts.filter((h) => h.locationId === filters.locationId) : hunts

  async function handleExport() {
    setExporting(true)
    const result = await exportParticipantsCSV(filters)
    setExporting(false)
    if (!result.success || !result.csv) return
    const blob = new Blob([result.csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const locationName = filters.locationId ? locations.find((l) => l.id === filters.locationId)?.name || 'all' : 'all'
    a.download = `participants-${locationName}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function submitFilter(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(e.target as HTMLFormElement)
    const params = new URLSearchParams()
    fd.forEach((v, k) => { if (v) params.set(k, v.toString()) })
    router.push(`/admin/participants?${params.toString()}`)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Participants</h1>
          <p className="text-gray-500 mt-1">{participants.length} results</p>
        </div>
        <button onClick={handleExport} disabled={exporting} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors">
          {exporting ? 'Exporting...' : '⬇ Export CSV'}
        </button>
      </div>

      {/* Filter Bar */}
      <form onSubmit={submitFilter} className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3">
        <select name="locationId" defaultValue={filters.locationId || ''} className="h-9 px-3 rounded-md border border-gray-300 text-sm bg-white">
          <option value="">All Locations</option>
          {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select name="huntId" defaultValue={filters.huntId || ''} className="h-9 px-3 rounded-md border border-gray-300 text-sm bg-white">
          <option value="">All Hunts</option>
          {filteredHunts.map((h) => <option key={h.id} value={h.id}>{h.title}</option>)}
        </select>
        <select name="status" defaultValue={filters.status || ''} className="h-9 px-3 rounded-md border border-gray-300 text-sm bg-white">
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="in_progress">In Progress</option>
        </select>
        <input name="search" type="text" defaultValue={filters.search || ''} placeholder="Search name, email, voucher..." className="h-9 px-3 rounded-md border border-gray-300 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-green-600" />
        <button type="submit" className="px-3 h-9 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200">Filter</button>
        <a href="/admin/participants" className="px-3 h-9 flex items-center text-gray-500 rounded-md text-sm hover:bg-gray-100">Clear</a>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Location</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Hunt</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Started</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Completed</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Progress</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Voucher</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {participants.length === 0 ? (
                <tr><td colSpan={10} className="px-6 py-8 text-center text-gray-400">No participants found.</td></tr>
              ) : (
                participants.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.fullName}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{p.email}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{p.phone}</td>
                    <td className="px-4 py-3 text-gray-600">{p.location.name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{p.hunt.title}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDateTime(p.startedAt)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{p.completedAt ? formatDateTime(p.completedAt) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{p.currentClueIndex}/{p.hunt.clues.length}</span>
                    </td>
                    <td className="px-4 py-3">
                      {p.voucherCode ? <span className="font-mono text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">{p.voucherCode}</span> : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(p)} className="text-blue-600 hover:text-blue-700 text-xs font-medium">View Details</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Sheet */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative ml-auto w-full max-w-lg bg-white h-full overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="font-semibold text-gray-900">Participant Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900 text-lg">{selected.fullName}</h3>
                <p className="text-sm text-gray-600">{selected.email}</p>
                <p className="text-sm text-gray-600">{selected.phone}</p>
                {selected.shoppingIntent && <p className="text-sm text-gray-500">Shopping: {selected.shoppingIntent}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Location:</span> <span className="font-medium">{selected.location.name}</span></div>
                <div><span className="text-gray-500">Hunt:</span> <span className="font-medium">{selected.hunt.title}</span></div>
                <div><span className="text-gray-500">Started:</span> <span className="font-medium">{formatDateTime(selected.startedAt)}</span></div>
                <div><span className="text-gray-500">Completed:</span> <span className="font-medium">{selected.completedAt ? formatDateTime(selected.completedAt) : '—'}</span></div>
                <div><span className="text-gray-500">Progress:</span> <span className="font-medium">{selected.currentClueIndex}/{selected.hunt.clues.length} clues</span></div>
                {selected.voucherCode && (
                  <div className="col-span-2"><span className="text-gray-500">Voucher:</span> <span className="font-mono font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded">{selected.voucherCode}</span></div>
                )}
              </div>
              {selected.registrationAnswers && selected.registrationAnswers.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Custom Responses</h3>
                  <div className="space-y-3">
                    {[...selected.registrationAnswers].sort((a, b) => a.question.order - b.question.order).map((a) => {
                      let displayValue = a.value
                      if (a.question.type === 'CHECKBOX') {
                        try {
                          const arr = JSON.parse(a.value) as string[]
                          displayValue = arr.join(', ')
                        } catch { /* use raw value */ }
                      }
                      return (
                        <div key={a.id} className="bg-slate-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-slate-500 mb-1">{a.question.label}</p>
                          <p className="text-sm text-slate-800">{displayValue || '—'}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Attempt History</h3>
                {selected.attempts.length === 0 ? (
                  <p className="text-sm text-gray-400">No attempts yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selected.attempts.map((a) => (
                      <div key={a.id} className={`text-sm p-3 rounded-lg border ${a.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex justify-between">
                          <span className="font-medium">Clue {a.clue.order}</span>
                          <span className={`text-xs font-medium ${a.isCorrect ? 'text-green-700' : 'text-red-700'}`}>{a.isCorrect ? '✓ Correct' : '✗ Wrong'}</span>
                        </div>
                        <div className="text-gray-600 mt-1">Answered: <span className="font-mono">{a.answer}</span></div>
                        <div className="text-gray-400 text-xs mt-1">{formatDateTime(a.attemptedAt)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
