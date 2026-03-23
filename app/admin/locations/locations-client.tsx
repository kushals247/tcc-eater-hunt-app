'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createLocation, updateLocation } from '@/actions/admin'
import { slugify, formatDateTime } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

type Location = {
  id: string
  name: string
  slug: string
  address: string | null
  createdAt: Date
  _count: { hunts: number; participants: number }
}

export default function LocationsClient({ locations: initial }: { locations: Location[] }) {
  const [locations, setLocations] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Location | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', address: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  function openAdd() {
    setEditing(null)
    setForm({ name: '', slug: '', address: '' })
    setErrors({})
    setShowForm(true)
  }

  function openEdit(loc: Location) {
    setEditing(loc)
    setForm({ name: loc.name, slug: loc.slug, address: loc.address || '' })
    setErrors({})
    setShowForm(true)
  }

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: editing ? f.slug : slugify(name) }))
  }

  function validateSlug(slug: string) {
    if (!slug) return 'Slug is required'
    if (!/^[a-z0-9-]+$/.test(slug)) return 'Slug must be lowercase letters, numbers, and hyphens only'
    return ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const slugError = validateSlug(form.slug)
    if (slugError) { setErrors({ slug: slugError }); return }
    if (!form.name.trim()) { setErrors({ name: 'Name is required' }); return }

    setSaving(true)
    const result = editing
      ? await updateLocation(editing.id, { name: form.name, slug: form.slug, address: form.address || undefined })
      : await createLocation({ name: form.name, slug: form.slug, address: form.address || undefined })

    setSaving(false)
    if (!result.success) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
      return
    }
    toast({ title: editing ? 'Location updated' : 'Location created' })
    setShowForm(false)
    router.refresh()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
          <p className="text-gray-500 mt-1">Manage store locations for your hunts</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
          + Add Location
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">{editing ? 'Edit Location' : 'New Location'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div>
              <label htmlFor="loc-name" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input id="loc-name" value={form.name} onChange={(e) => handleNameChange(e.target.value)} required className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" placeholder="e.g. Westlands" aria-describedby={errors.name ? 'name-err' : undefined} />
              {errors.name && <p id="name-err" className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="loc-slug" className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
              <input id="loc-slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} required className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-600" placeholder="e.g. westlands" aria-describedby="slug-hint slug-err" />
              <p id="slug-hint" className="text-xs text-gray-400 mt-1">Lowercase letters, numbers, hyphens only. Used in QR code URLs.</p>
              {errors.slug && <p id="slug-err" className="text-sm text-red-600 mt-1">{errors.slug}</p>}
            </div>
            <div>
              <label htmlFor="loc-address" className="block text-sm font-medium text-gray-700 mb-1">Address (optional)</label>
              <input id="loc-address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" placeholder="e.g. Westlands Mall, Nairobi" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : editing ? 'Update Location' : 'Create Location'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Slug</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Address</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Hunts</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Participants</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Created</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {locations.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No locations yet. Add your first store location.</td></tr>
              ) : (
                locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{loc.name}</td>
                    <td className="px-6 py-3 font-mono text-gray-600 text-xs">{loc.slug}</td>
                    <td className="px-6 py-3 text-gray-500">{loc.address || '—'}</td>
                    <td className="px-6 py-3 text-gray-600">{loc._count.hunts}</td>
                    <td className="px-6 py-3 text-gray-600">{loc._count.participants}</td>
                    <td className="px-6 py-3 text-gray-400 text-xs">{formatDateTime(loc.createdAt)}</td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(loc)} className="text-blue-600 hover:text-blue-700 text-xs font-medium">Edit</button>
                        <a href={`/admin/hunts?locationId=${loc.id}`} className="text-gray-500 hover:text-gray-700 text-xs font-medium">View Hunts</a>
                      </div>
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
