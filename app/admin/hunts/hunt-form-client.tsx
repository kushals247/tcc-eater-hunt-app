'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createHunt, updateHunt } from '@/actions/admin'
import { useToast } from '@/hooks/use-toast'
import { THEME_PRESETS } from '@/lib/themes'

type Location = { id: string; name: string }
type HuntData = {
  id?: string
  title: string
  description?: string | null
  locationId: string
  isActive: boolean
  startDate?: Date | string | null
  endDate?: Date | string | null
  voucherPrefix: string
  voucherDiscountPercent: number
  voucherExpiryDate?: Date | string | null
  registrationHeadline: string
  registrationSubtext?: string | null
  completionMessage: string
  themePreset?: string | null
  themePrimaryColor?: string | null
  themeAccentColor?: string | null
}

function toDateInputValue(date: Date | string | null | undefined) {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

export default function HuntFormClient({ locations, hunt }: { locations: Location[]; hunt?: HuntData }) {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: hunt?.title || '',
    description: hunt?.description || '',
    locationId: hunt?.locationId || (locations[0]?.id || ''),
    isActive: hunt?.isActive ?? false,
    startDate: toDateInputValue(hunt?.startDate),
    endDate: toDateInputValue(hunt?.endDate),
    voucherPrefix: hunt?.voucherPrefix || '',
    voucherDiscountPercent: hunt?.voucherDiscountPercent ?? 10,
    voucherExpiryDate: toDateInputValue(hunt?.voucherExpiryDate),
    registrationHeadline: hunt?.registrationHeadline || '',
    registrationSubtext: hunt?.registrationSubtext || '',
    completionMessage: hunt?.completionMessage || '',
    themePreset: hunt?.themePreset ?? 'EASTER',
    themePrimaryColor: hunt?.themePrimaryColor || '',
    themeAccentColor: hunt?.themeAccentColor || '',
  })

  // Resolve effective preview colours
  const selectedPreset = THEME_PRESETS.find((p) => p.id === form.themePreset) ?? THEME_PRESETS[0]
  const previewPrimary = form.themePrimaryColor || selectedPreset.primary
  const previewAccent = form.themeAccentColor || selectedPreset.accent

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const payload = {
      title: form.title,
      description: form.description || undefined,
      locationId: form.locationId,
      isActive: form.isActive,
      startDate: form.startDate ? new Date(form.startDate) : null,
      endDate: form.endDate ? new Date(form.endDate) : null,
      voucherPrefix: form.voucherPrefix.toUpperCase(),
      voucherDiscountPercent: Number(form.voucherDiscountPercent),
      voucherExpiryDate: form.voucherExpiryDate ? new Date(form.voucherExpiryDate) : null,
      registrationHeadline: form.registrationHeadline,
      registrationSubtext: form.registrationSubtext || undefined,
      completionMessage: form.completionMessage,
      themePreset: form.themePreset || 'EASTER',
      themePrimaryColor: form.themePrimaryColor || null,
      themeAccentColor: form.themeAccentColor || null,
    }

    const result = hunt?.id ? await updateHunt(hunt.id, payload) : await createHunt(payload)

    setSaving(false)

    if (!result.success) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
      return
    }

    const id = hunt?.id || (result as { id?: string }).id
    toast({ title: hunt?.id ? 'Hunt updated!' : 'Hunt created!' })
    if (id) router.push(`/admin/hunts/${id}/clues`)
    else router.push('/admin/hunts')
  }

  const inputClass = "w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
  const textareaClass = "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none bg-white"
  const labelClass = "block text-sm font-medium text-slate-700 mb-1"

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Section 1: Hunt Setup */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <h2 className="font-semibold text-slate-900 text-base border-b border-slate-100 pb-3">Hunt Setup</h2>
        <div>
          <label htmlFor="title" className={labelClass}>Title *</label>
          <input id="title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required className={inputClass} placeholder="e.g. Easter Home Makeover Hunt" />
        </div>
        <div>
          <label htmlFor="description" className={labelClass}>Description (optional)</label>
          <textarea id="description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className={textareaClass} placeholder="Brief description of this hunt..." />
        </div>
        <div>
          <label htmlFor="locationId" className={labelClass}>Location *</label>
          <select id="locationId" value={form.locationId} onChange={(e) => setForm((f) => ({ ...f, locationId: e.target.value }))} required className={inputClass}>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" role="switch" aria-checked={form.isActive} onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-emerald-600' : 'bg-slate-300'}`}>
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
          <label className="text-sm text-slate-700">Active (visible to participants)</label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className={labelClass}>Start Date (optional)</label>
            <input id="startDate" type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label htmlFor="endDate" className={labelClass}>End Date (optional)</label>
            <input id="endDate" type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Section 2: Registration Page */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <h2 className="font-semibold text-slate-900 text-base border-b border-slate-100 pb-3">Registration Page Content</h2>
        <div>
          <label htmlFor="registrationHeadline" className={labelClass}>Registration Headline *</label>
          <input id="registrationHeadline" value={form.registrationHeadline} onChange={(e) => setForm((f) => ({ ...f, registrationHeadline: e.target.value }))} required className={inputClass} placeholder="e.g. Scan to Start the Easter Hunt & Win!" />
        </div>
        <div>
          <label htmlFor="registrationSubtext" className={labelClass}>Registration Subtext (optional)</label>
          <input id="registrationSubtext" value={form.registrationSubtext} onChange={(e) => setForm((f) => ({ ...f, registrationSubtext: e.target.value }))} className={inputClass} placeholder="e.g. Complete all clues to unlock your exclusive discount voucher!" />
        </div>
      </div>

      {/* Section 3: Voucher Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <h2 className="font-semibold text-slate-900 text-base border-b border-slate-100 pb-3">Voucher Settings</h2>
        <div>
          <label htmlFor="voucherPrefix" className={labelClass}>Voucher Prefix * (max 10 chars)</label>
          <input id="voucherPrefix" value={form.voucherPrefix} onChange={(e) => setForm((f) => ({ ...f, voucherPrefix: e.target.value.toUpperCase().slice(0, 10) }))} required maxLength={10} className={`${inputClass} font-mono uppercase`} placeholder="E.G. EASTER" />
          <p className="text-xs text-slate-400 mt-1">Preview: {form.voucherPrefix || 'PREFIX'}-LOCATION-XXXXXX</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="voucherDiscount" className={labelClass}>Discount % *</label>
            <input id="voucherDiscount" type="number" min="1" max="100" value={form.voucherDiscountPercent} onChange={(e) => setForm((f) => ({ ...f, voucherDiscountPercent: parseInt(e.target.value) || 10 }))} required className={inputClass} />
          </div>
          <div>
            <label htmlFor="voucherExpiry" className={labelClass}>Voucher Expiry Date *</label>
            <input id="voucherExpiry" type="date" value={form.voucherExpiryDate} onChange={(e) => setForm((f) => ({ ...f, voucherExpiryDate: e.target.value }))} required className={inputClass} />
          </div>
        </div>
        <div>
          <label htmlFor="completionMessage" className={labelClass}>Completion Message *</label>
          <textarea id="completionMessage" value={form.completionMessage} onChange={(e) => setForm((f) => ({ ...f, completionMessage: e.target.value }))} required rows={3} className={textareaClass} placeholder="e.g. Congratulations! You've completed the Easter Home Makeover Hunt!" />
          <p className="text-xs text-slate-400 mt-1">Shown on the final screen when the customer finishes all clues.</p>
        </div>
      </div>

      {/* Section 4: Theme */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-sm">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-semibold text-slate-900 text-base">Customer Page Theme</h2>
            <p className="text-xs text-slate-500 mt-0.5">Choose how the hunt looks on participants' phones</p>
          </div>
          {/* Live preview badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-slate-500">Preview:</span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: previewPrimary }}
            >
              🎯 Hunt
            </span>
            <span
              className="inline-flex items-center px-2 py-1 rounded text-xs font-bold"
              style={{ backgroundColor: previewAccent + '33', color: previewAccent, border: `1px solid ${previewAccent}66` }}
            >
              10% OFF
            </span>
          </div>
        </div>

        {/* Preset picker */}
        <div>
          <p className={labelClass}>Theme Preset</p>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setForm((f) => ({ ...f, themePreset: preset.id }))}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all text-center ${
                  form.themePreset === preset.id
                    ? 'border-slate-900 bg-slate-50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                  style={{ backgroundColor: preset.bgFrom }}
                >
                  {preset.emoji}
                </div>
                <span className="text-xs font-medium text-slate-700 leading-tight">{preset.name}</span>
                <div className="flex gap-0.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.primary }} />
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.accent }} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Colour overrides */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <label htmlFor="themePrimary" className={labelClass}>
              Primary Colour Override
            </label>
            <div className="flex gap-2 items-center">
              <input
                id="themePrimary"
                type="color"
                value={form.themePrimaryColor || selectedPreset.primary}
                onChange={(e) => setForm((f) => ({ ...f, themePrimaryColor: e.target.value }))}
                className="h-10 w-12 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={form.themePrimaryColor}
                onChange={(e) => setForm((f) => ({ ...f, themePrimaryColor: e.target.value }))}
                placeholder={`Default: ${selectedPreset.primary}`}
                className={`${inputClass} flex-1 font-mono text-xs`}
              />
              {form.themePrimaryColor && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, themePrimaryColor: '' }))}
                  className="text-xs text-slate-400 hover:text-slate-700 whitespace-nowrap"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="themeAccent" className={labelClass}>
              Accent Colour Override
            </label>
            <div className="flex gap-2 items-center">
              <input
                id="themeAccent"
                type="color"
                value={form.themeAccentColor || selectedPreset.accent}
                onChange={(e) => setForm((f) => ({ ...f, themeAccentColor: e.target.value }))}
                className="h-10 w-12 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={form.themeAccentColor}
                onChange={(e) => setForm((f) => ({ ...f, themeAccentColor: e.target.value }))}
                placeholder={`Default: ${selectedPreset.accent}`}
                className={`${inputClass} flex-1 font-mono text-xs`}
              />
              {form.themeAccentColor && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, themeAccentColor: '' }))}
                  className="text-xs text-slate-400 hover:text-slate-700 whitespace-nowrap"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Leave colour fields blank to use the preset defaults. Overrides apply on top of the selected preset.
        </p>
      </div>

      <div className="flex gap-3 pb-8">
        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors">
          {saving ? 'Saving...' : hunt?.id ? 'Update Hunt' : 'Create Hunt & Add Clues →'}
        </button>
        <a href="/admin/hunts" className="px-6 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors inline-flex items-center">
          Cancel
        </a>
      </div>
    </form>
  )
}
