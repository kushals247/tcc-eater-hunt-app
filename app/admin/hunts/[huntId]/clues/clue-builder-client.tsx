'use client'
import { useState, useRef } from 'react'
import { createClue, updateClue, deleteClue, reorderClue } from '@/actions/admin'
import { useToast } from '@/hooks/use-toast'
import { ChevronUp, ChevronDown, Pencil, Trash2, Eye, EyeOff, Plus } from 'lucide-react'

type Clue = {
  id: string
  huntId: string
  order: number
  poem: string
  taskDescription: string
  locationHint: string
  answerType: string
  correctAnswer: string
  hint: string | null
}

type Hunt = { id: string; title: string }

const ANSWER_TYPE_INFO = {
  CODE: {
    label: 'CODE',
    description: 'Ignores spaces and capitalisation. Use for printed codes on signs.',
    helper: 'Enter the code as it appears on the in-store sign (e.g. FURNI5)',
    placeholder: 'Enter the code',
  },
  TEXT: {
    label: 'TEXT',
    description: 'Ignores capitalisation and leading/trailing spaces. Use for words.',
    helper: 'Enter the expected word or phrase (e.g. Emerald)',
    placeholder: 'Type your answer',
  },
  NUMBER: {
    label: 'NUMBER',
    description: 'Numeric values only. Strips non-digit characters before comparing.',
    helper: 'Enter the number only — no currency symbols or units (e.g. 450)',
    placeholder: 'Enter the number',
  },
}

function ClueEditorForm({
  huntId,
  editingClue,
  onSave,
  onCancel,
}: {
  huntId: string
  editingClue: Clue | null
  onSave: (clue: Clue) => void
  onCancel: () => void
}) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [form, setForm] = useState({
    poem: editingClue?.poem || '',
    taskDescription: editingClue?.taskDescription || '',
    locationHint: editingClue?.locationHint || '',
    answerType: editingClue?.answerType || 'CODE',
    correctAnswer: editingClue?.correctAnswer || '',
    hint: editingClue?.hint || '',
  })

  const typeInfo = ANSWER_TYPE_INFO[form.answerType as keyof typeof ANSWER_TYPE_INFO]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const data = {
      huntId,
      poem: form.poem,
      taskDescription: form.taskDescription,
      locationHint: form.locationHint,
      answerType: form.answerType,
      correctAnswer: form.correctAnswer,
      hint: form.hint || undefined,
    }

    const result = editingClue
      ? await updateClue(editingClue.id, data)
      : await createClue(data)
    setSaving(false)

    if (!result.success) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
      return
    }

    toast({ title: editingClue ? 'Clue updated!' : 'Clue added!' })

    const savedClue: Clue = editingClue
      ? { ...editingClue, ...data, hint: data.hint ?? null }
      : { id: (result as { id?: string }).id || '', order: 999, ...data, hint: data.hint ?? null }
    onSave(savedClue)
  }

  const inputClass = "w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
  const textareaClass = "w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="poem" className={labelClass}>Clue Poem *</label>
        <p className="text-xs text-gray-400 mb-1">The rhyming clue shown to the customer on their screen</p>
        <textarea id="poem" value={form.poem} onChange={(e) => setForm((f) => ({ ...f, poem: e.target.value }))} required rows={4} className={textareaClass} placeholder={"Where colours bloom and fabrics gleam,\nA room reborn from someone's dream..."} />
      </div>

      <div>
        <label htmlFor="taskDesc" className={labelClass}>Task Description *</label>
        <p className="text-xs text-gray-400 mb-1">What the customer must physically do — shown below the poem</p>
        <textarea id="taskDesc" value={form.taskDescription} onChange={(e) => setForm((f) => ({ ...f, taskDescription: e.target.value }))} required rows={2} className={textareaClass} placeholder="Find the featured sofa display in the furniture section and look for the sign." />
      </div>

      <div>
        <label htmlFor="locHint" className={labelClass}>Location Hint *</label>
        <p className="text-xs text-gray-400 mb-1">Shown in a highlighted box to help customer navigate in-store</p>
        <input id="locHint" value={form.locationHint} onChange={(e) => setForm((f) => ({ ...f, locationHint: e.target.value }))} required className={inputClass} placeholder="Furniture section, near the main entrance" />
      </div>

      <div>
        <span className={labelClass}>Answer Type *</span>
        <div className="flex gap-2 mt-1">
          {(['CODE', 'TEXT', 'NUMBER'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setForm((f) => ({ ...f, answerType: type }))}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium border transition-colors ${
                form.answerType === type
                  ? 'bg-green-700 text-white border-green-700'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">{typeInfo.description}</p>
      </div>

      <div>
        <label htmlFor="answer" className={labelClass}>Correct Answer *</label>
        <p className="text-xs text-gray-400 mb-1">{typeInfo.helper}</p>
        <div className="relative">
          <input
            id="answer"
            type={showAnswer ? 'text' : 'password'}
            value={form.correctAnswer}
            onChange={(e) => setForm((f) => ({ ...f, correctAnswer: e.target.value }))}
            required
            className={`${inputClass} pr-10`}
            placeholder={typeInfo.placeholder}
          />
          <button type="button" onClick={() => setShowAnswer((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showAnswer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {form.correctAnswer && (
          <div className="mt-2 p-2 bg-blue-50 rounded-md text-xs text-blue-700">
            Customer will need to enter: <span className="font-mono font-medium">{form.correctAnswer}</span>
            <span className="text-blue-500"> (We&apos;ll accept any capitalisation / spacing variation)</span>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="hint" className={labelClass}>Hint (shown after 2 wrong attempts, optional)</label>
        <input id="hint" value={form.hint} onChange={(e) => setForm((f) => ({ ...f, hint: e.target.value }))} className={inputClass} placeholder="Look for the small sign attached to the display frame" />
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button type="submit" disabled={saving} className="px-5 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors">
          {saving ? 'Saving...' : editingClue ? 'Update Clue' : 'Add Clue'}
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function ClueBuilderClient({ hunt, initialClues }: { hunt: Hunt; initialClues: Clue[] }) {
  const [clues, setClues] = useState<Clue[]>(initialClues)
  const [editingClue, setEditingClue] = useState<Clue | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()
  const formRef = useRef<HTMLDivElement>(null)

  function openAdd() {
    setEditingClue(null)
    setShowForm(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  function openEdit(clue: Clue) {
    setEditingClue(clue)
    setShowForm(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  function handleSave(saved: Clue) {
    setClues((prev) => {
      const exists = prev.find((c) => c.id === saved.id)
      if (exists) return prev.map((c) => c.id === saved.id ? saved : c)
      // For new clue, reload from server
      window.location.reload()
      return prev
    })
    setShowForm(false)
    setEditingClue(null)
  }

  async function handleReorder(id: string, direction: 'up' | 'down') {
    // Optimistic update
    const idx = clues.findIndex((c) => c.id === id)
    if (idx === -1) return
    const newClues = [...clues]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= newClues.length) return

    const temp = newClues[idx].order
    newClues[idx] = { ...newClues[idx], order: newClues[swapIdx].order }
    newClues[swapIdx] = { ...newClues[swapIdx], order: temp }
    newClues.sort((a, b) => a.order - b.order)
    setClues(newClues)

    const result = await reorderClue(id, direction)
    if (!result.success) {
      setClues(clues) // Revert
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const result = await deleteClue(id)
    setDeletingId(null)
    if (!result.success) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
      return
    }
    setClues((prev) => {
      const filtered = prev.filter((c) => c.id !== id)
      return filtered.map((c, i) => ({ ...c, order: i + 1 }))
    })
    toast({ title: 'Clue deleted' })
  }

  function toggleReveal(id: string) {
    setRevealedAnswers((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Clue List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-900">{clues.length} {clues.length === 1 ? 'Clue' : 'Clues'}</h2>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
            <Plus className="h-4 w-4" /> Add Clue
          </button>
        </div>

        {clues.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-lg mb-2">No clues yet</p>
            <p className="text-gray-400 text-sm mb-6">Add your first clue to get started</p>
            <button onClick={openAdd} className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
              + Add First Clue
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {clues.map((clue, idx) => (
              <div key={clue.id} className={`bg-white rounded-xl border p-4 transition-all ${editingClue?.id === clue.id ? 'border-green-400 shadow-md' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Clue {clue.order} of {clues.length}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        clue.answerType === 'CODE' ? 'bg-purple-100 text-purple-700' :
                        clue.answerType === 'TEXT' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>{clue.answerType}</span>
                    </div>
                    <p className="text-sm text-gray-700 truncate italic">
                      {clue.poem.split('\n')[0]}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">Answer:</span>
                      {revealedAnswers.has(clue.id) ? (
                        <span className="text-xs font-mono text-gray-700">{clue.correctAnswer}</span>
                      ) : (
                        <span className="text-xs text-gray-400">{'•'.repeat(Math.min(clue.correctAnswer.length, 8))}</span>
                      )}
                      <button type="button" onClick={() => toggleReveal(clue.id)} className="text-gray-300 hover:text-gray-500">
                        {revealedAnswers.has(clue.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <div className="flex gap-1">
                      <button onClick={() => handleReorder(clue.id, 'up')} disabled={idx === 0} className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors" title="Move up">
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleReorder(clue.id, 'down')} disabled={idx === clues.length - 1} className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors" title="Move down">
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(clue)} className="p-1.5 rounded text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Delete Clue ${clue.order}? This cannot be undone.`)) handleDelete(clue.id) }}
                        disabled={deletingId === clue.id}
                        className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick nav to QR code */}
        {clues.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
            <p className="text-sm text-green-800 font-medium mb-2">Hunt is ready! 🎉</p>
            <p className="text-xs text-green-700 mb-3">You have {clues.length} clue{clues.length !== 1 ? 's' : ''} set up. Generate the QR code to deploy this hunt.</p>
            <a href={`/admin/hunts/${hunt.id}/qr`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
              Generate QR Code →
            </a>
          </div>
        )}
      </div>

      {/* Clue Editor */}
      <div ref={formRef}>
        {showForm ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
            <h2 className="font-semibold text-gray-900 mb-5">
              {editingClue ? `Edit Clue ${editingClue.order}` : 'New Clue'}
            </h2>
            <ClueEditorForm
              huntId={hunt.id}
              editingClue={editingClue}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingClue(null) }}
            />
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-8 text-center sticky top-24">
            <p className="text-gray-400 mb-3">Select a clue to edit or add a new one</p>
            <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors mx-auto">
              <Plus className="h-4 w-4" /> Add New Clue
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
