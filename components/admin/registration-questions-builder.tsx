'use client'
import { useState } from 'react'
import {
  createRegistrationQuestion,
  updateRegistrationQuestion,
  deleteRegistrationQuestion,
  reorderRegistrationQuestion,
} from '@/actions/admin'
import { ChevronUp, ChevronDown, Pencil, Trash2, Plus, X } from 'lucide-react'

type Question = {
  id: string
  huntId: string
  label: string
  type: string
  options: string | null
  required: boolean
  order: number
}

type QuestionEditorFormProps = {
  huntId: string
  editingQuestion: Question | null
  onSave: (q: Question) => void
  onCancel: () => void
}

function QuestionEditorForm({ huntId, editingQuestion, onSave, onCancel }: QuestionEditorFormProps) {
  const [label, setLabel] = useState(editingQuestion?.label ?? '')
  const [type, setType] = useState<'TEXT' | 'CHECKBOX'>(
    (editingQuestion?.type as 'TEXT' | 'CHECKBOX') ?? 'TEXT'
  )
  const [required, setRequired] = useState(editingQuestion?.required ?? false)
  const [options, setOptions] = useState<string[]>(() => {
    if (editingQuestion?.options) {
      try { return JSON.parse(editingQuestion.options) } catch { return [] }
    }
    return []
  })
  const [newOption, setNewOption] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function addOption() {
    const trimmed = newOption.trim()
    if (!trimmed || options.includes(trimmed)) return
    setOptions((prev) => [...prev, trimmed])
    setNewOption('')
  }

  function removeOption(opt: string) {
    setOptions((prev) => prev.filter((o) => o !== opt))
  }

  async function handleSave() {
    if (!label.trim()) { setError('Label is required'); return }
    if (type === 'CHECKBOX' && options.length < 2) { setError('Add at least 2 options for a checkbox question'); return }
    setSaving(true)
    setError('')
    const payload = {
      huntId,
      label: label.trim(),
      type,
      options: type === 'CHECKBOX' ? JSON.stringify(options) : null,
      required,
    }
    if (editingQuestion) {
      const res = await updateRegistrationQuestion(editingQuestion.id, payload)
      if (!res.success) { setError(res.error || 'Failed to save'); setSaving(false); return }
      onSave({ ...editingQuestion, ...payload, options: payload.options ?? null })
    } else {
      const res = await createRegistrationQuestion(payload)
      if (!res.success || !res.id) { setError(res.error || 'Failed to save'); setSaving(false); return }
      onSave({
        id: res.id,
        huntId,
        label: label.trim(),
        type,
        options: payload.options ?? null,
        required,
        order: 999,
      })
    }
    setSaving(false)
  }

  const inputClass =
    'w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400'
  const labelClass = 'block text-xs font-medium text-slate-600 mb-1'

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-slate-800 text-sm">
        {editingQuestion ? 'Edit Question' : 'New Question'}
      </h3>

      <div>
        <label className={labelClass}>Question Label *</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. What are you shopping for today?"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Answer Type</label>
        <div className="flex gap-2">
          {(['TEXT', 'CHECKBOX'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${
                type === t
                  ? 'bg-slate-800 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t === 'TEXT' ? '📝 Short Text' : '☑️ Checkbox (Multi-select)'}
            </button>
          ))}
        </div>
      </div>

      {type === 'CHECKBOX' && (
        <div>
          <label className={labelClass}>Options (min 2)</label>
          <div className="space-y-2 mb-2">
            {options.map((opt) => (
              <div key={opt} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                <span className="flex-1 text-sm text-slate-700">{opt}</span>
                <button type="button" onClick={() => removeOption(opt)} className="text-slate-400 hover:text-red-500">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption() } }}
              placeholder="Type an option and press Enter"
              className={inputClass}
            />
            <button
              type="button"
              onClick={addOption}
              className="px-3 h-10 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700"
            >
              Add
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-slate-800 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
        </label>
        <span className="text-sm text-slate-700">Required field</span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 h-9 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Question'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 h-9 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function RegistrationQuestionsBuilder({
  huntId,
  initialQuestions,
}: {
  huntId: string
  initialQuestions: Question[]
}) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions)
  const [editing, setEditing] = useState<Question | null | 'new'>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  function handleSave(saved: Question) {
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [...prev, saved]
    })
    setEditing(null)
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    const res = await deleteRegistrationQuestion(id)
    if (res.success) {
      setQuestions((prev) => prev.filter((q) => q.id !== id).map((q, i) => ({ ...q, order: i + 1 })))
    }
    setDeleting(null)
  }

  async function handleReorder(id: string, direction: 'up' | 'down') {
    const res = await reorderRegistrationQuestion(id, direction)
    if (res.success) {
      setQuestions((prev) => {
        const next = [...prev]
        const idx = next.findIndex((q) => q.id === id)
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1
        if (swapIdx < 0 || swapIdx >= next.length) return prev
        ;[next[idx].order, next[swapIdx].order] = [next[swapIdx].order, next[idx].order]
        return [...next].sort((a, b) => a.order - b.order)
      })
    }
  }

  const sorted = [...questions].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Registration Questions</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            These appear below the required Name / Email / Phone fields on the sign-up form.
          </p>
        </div>
        {editing === null && (
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="inline-flex items-center gap-1.5 px-3 h-8 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Question
          </button>
        )}
      </div>

      {sorted.length === 0 && editing === null && (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
          <p className="text-sm text-slate-400">No custom questions yet.</p>
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="mt-3 text-sm text-slate-600 hover:text-slate-900 underline"
          >
            Add your first question
          </button>
        </div>
      )}

      <div className="space-y-2">
        {sorted.map((q, idx) => (
          <div key={q.id}>
            {editing && editing !== 'new' && (editing as Question).id === q.id ? (
              <QuestionEditorForm
                huntId={huntId}
                editingQuestion={q}
                onSave={handleSave}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleReorder(q.id, 'up')}
                    className="text-slate-300 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === sorted.length - 1}
                    onClick={() => handleReorder(q.id, 'down')}
                    className="text-slate-300 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-800 truncate">{q.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      q.type === 'TEXT'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-violet-50 text-violet-700'
                    }`}>
                      {q.type === 'TEXT' ? 'Short Text' : 'Checkbox'}
                    </span>
                    {q.required && (
                      <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-amber-50 text-amber-700">
                        Required
                      </span>
                    )}
                  </div>
                  {q.type === 'CHECKBOX' && q.options && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      Options: {(() => { try { return (JSON.parse(q.options) as string[]).join(', ') } catch { return q.options } })()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditing(q)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(q.id)}
                    disabled={deleting === q.id}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {editing === 'new' && (
        <QuestionEditorForm
          huntId={huntId}
          editingQuestion={null}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  )
}
