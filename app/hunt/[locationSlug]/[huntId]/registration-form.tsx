'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registerParticipant } from '@/actions/participant'

type Question = {
  id: string
  label: string
  type: string        // "TEXT" | "CHECKBOX"
  options: string[]   // for CHECKBOX
  required: boolean
  order: number
}

type Props = {
  huntId: string
  locationId: string
  locationSlug: string
  questions: Question[]
  primaryColor?: string
}

export default function RegistrationForm({ huntId, locationId, locationSlug, questions, primaryColor = '#2d5a27' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' })
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({})
  const [checkboxValues, setCheckboxValues] = useState<Record<string, string[]>>({})

  function setTextAnswer(questionId: string, value: string) {
    setCustomAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  function toggleCheckbox(questionId: string, option: string) {
    setCheckboxValues((prev) => {
      const current = prev[questionId] ?? []
      const next = current.includes(option)
        ? current.filter((v) => v !== option)
        : [...current, option]
      return { ...prev, [questionId]: next }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    // Validate custom questions
    for (const q of questions) {
      if (!q.required) continue
      if (q.type === 'TEXT' && !customAnswers[q.id]?.trim()) {
        setError(`Please answer: "${q.label}"`)
        return
      }
      if (q.type === 'CHECKBOX' && !checkboxValues[q.id]?.length) {
        setError(`Please select at least one option for: "${q.label}"`)
        return
      }
    }

    setLoading(true)
    setError('')

    const answersPayload = questions
      .map((q) => ({
        questionId: q.id,
        value: q.type === 'CHECKBOX'
          ? JSON.stringify(checkboxValues[q.id] ?? [])
          : (customAnswers[q.id] ?? ''),
      }))
      .filter((a) => a.value && a.value !== '[]')

    const result = await registerParticipant({
      huntId,
      locationId,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      customAnswers: answersPayload,
    })

    if (!result.success || !result.participantId) {
      setLoading(false)
      setError(result.error || 'Something went wrong. Please try again.')
      return
    }

    router.push(`/hunt/${locationSlug}/${huntId}/play/${result.participantId}`)
  }

  const inputClass = "w-full h-12 px-4 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:border-transparent transition-colors"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5"

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Fixed core fields */}
      <div>
        <label htmlFor="fullName" className={labelClass}>Full Name *</label>
        <input id="fullName" type="text" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required autoComplete="name" className={inputClass} placeholder="Your full name" aria-required="true" />
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>Email Address *</label>
        <input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required autoComplete="email" className={inputClass} placeholder="your@email.com" aria-required="true" />
      </div>

      <div>
        <label htmlFor="phone" className={labelClass}>Mobile Number *</label>
        <input id="phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required autoComplete="tel" className={inputClass} placeholder="+254 7XX XXX XXX" aria-required="true" />
      </div>

      {/* Dynamic custom questions */}
      {questions.map((q) => (
        <div key={q.id}>
          {q.type === 'TEXT' && (
            <>
              <label htmlFor={`q-${q.id}`} className={labelClass}>
                {q.label}{q.required ? ' *' : ' (optional)'}
              </label>
              <input
                id={`q-${q.id}`}
                type="text"
                value={customAnswers[q.id] ?? ''}
                onChange={(e) => setTextAnswer(q.id, e.target.value)}
                required={q.required}
                className={inputClass}
                aria-required={q.required ? 'true' : 'false'}
              />
            </>
          )}

          {q.type === 'CHECKBOX' && (
            <fieldset>
              <legend className={labelClass}>
                {q.label}{q.required ? ' *' : ' (optional)'}
              </legend>
              <div className="space-y-2.5 mt-1">
                {q.options.map((option) => {
                  const checked = (checkboxValues[q.id] ?? []).includes(option)
                  return (
                    <label key={option} className="flex items-center gap-3 cursor-pointer group">
                      <div
                        className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checked ? 'border-transparent' : 'border-gray-300 bg-white'}`}
                        style={checked ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                      >
                        {checked && (
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCheckbox(q.id, option)}
                          className="sr-only"
                          aria-label={option}
                        />
                      </div>
                      <span className="text-gray-700 group-hover:text-gray-900 text-sm">{option}</span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          )}
        </div>
      ))}

      {error && (
        <div className="p-3 bg-red-50 rounded-lg border border-red-200" role="alert">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-14 text-white rounded-xl text-lg font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-opacity hover:opacity-90 mt-2"
        style={{ backgroundColor: primaryColor }}
      >
        {loading ? 'Starting...' : 'Start the Hunt! 🎯'}
      </button>
    </form>
  )
}
