'use client'
import { useState, useRef, useEffect } from 'react'
import { submitAnswer, sendVoucherEmailAction } from '@/actions/participant'
import type { ThemePreset } from '@/lib/themes'
import { hexWithOpacity } from '@/lib/themes'

type Clue = {
  id: string
  order: number
  poem: string
  taskDescription: string
  locationHint: string
  answerType: string
}

type Participant = {
  id: string
  fullName: string
  currentClueIndex: number
  completedAt: string | null
  voucherCode: string | null
}

type Hunt = {
  id: string
  title: string
  completionMessage: string
  voucherDiscountPercent: number
  voucherExpiryDate: string | null
}

function formatExpiryDate(dateStr: string | null): string {
  if (!dateStr) return 'No expiry'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function ConfettiEffect({ theme }: { theme: ThemePreset }) {
  useEffect(() => {
    let cancelled = false
    async function fire() {
      const confetti = (await import('canvas-confetti')).default
      if (cancelled) return
      const colors = [theme.primary, theme.accent, '#e76f51', '#4ecdc4', '#ff6b6b']
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors })
      setTimeout(() => {
        if (!cancelled) confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0 }, colors })
      }, 300)
      setTimeout(() => {
        if (!cancelled) confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 }, colors })
      }, 600)
    }
    fire()
    return () => { cancelled = true }
  }, [theme.primary, theme.accent])
  return null
}

function CompletionScreen({
  participant,
  hunt,
  voucherCode,
  theme,
}: {
  participant: Participant
  hunt: Hunt
  voucherCode: string
  theme: ThemePreset
}) {
  const [copied, setCopied] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const firstName = participant.fullName.split(' ')[0]

  async function copyCode() {
    await navigator.clipboard.writeText(voucherCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function sendEmail() {
    setEmailLoading(true)
    setEmailError('')
    const result = await sendVoucherEmailAction(participant.id)
    setEmailLoading(false)
    if (result.success) {
      setEmailSent(true)
    } else {
      setEmailError('Could not send email. Please copy your code instead.')
    }
  }

  const pageBg = `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgMid}, ${theme.bgTo})`

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: pageBg }}>
      <ConfettiEffect theme={theme} />
      <div className="max-w-md w-full space-y-6 slide-up">
        {/* Celebration header */}
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: theme.primary }}>
            Well done, {firstName}!
          </h1>
          <p className="text-gray-600">{hunt.completionMessage}</p>
        </div>

        {/* Voucher box */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b-2 border-dashed border-gray-200">
            <p className="text-center text-xs uppercase tracking-widest text-gray-400 font-semibold">Your Discount Code</p>
          </div>
          <div className="px-6 py-6 text-center">
            <p className="font-mono text-2xl font-bold tracking-wider mb-3 break-all" style={{ color: theme.primary }}>
              {voucherCode}
            </p>
            <p className="font-bold text-lg" style={{ color: theme.accent }}>
              {hunt.voucherDiscountPercent}% off your next purchase
            </p>
            <p className="text-gray-400 text-sm mt-1">Valid until {formatExpiryDate(hunt.voucherExpiryDate)}</p>
          </div>
          <div className="px-6 pb-6 border-t border-dashed border-gray-200 pt-4 space-y-3">
            <button
              onClick={copyCode}
              className="w-full h-12 text-white rounded-xl font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: theme.primary }}
            >
              {copied ? '✓ Copied!' : '📋 Copy Code'}
            </button>
            {!emailSent ? (
              <button
                onClick={sendEmail}
                disabled={emailLoading}
                className="w-full h-12 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {emailLoading ? 'Sending...' : '📧 Email this to me'}
              </button>
            ) : (
              <p className="text-center text-sm font-medium" style={{ color: theme.primary }}>✓ Email sent to your inbox!</p>
            )}
            {emailError && <p className="text-center text-sm text-red-600">{emailError}</p>}
          </div>
        </div>

        <a
          href="/"
          className="block w-full h-12 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-center leading-[3rem]"
        >
          🛍️ Happy Shopping!
        </a>
      </div>
    </div>
  )
}

export default function HuntPlayClient({
  participant: initialParticipant,
  hunt,
  clues,
  theme,
}: {
  participant: Participant
  hunt: Hunt
  clues: Clue[]
  theme: ThemePreset
}) {
  const [currentClueIndex, setCurrentClueIndex] = useState(initialParticipant.currentClueIndex)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [wrongCount, setWrongCount] = useState(0)
  const [hint, setHint] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [shake, setShake] = useState(false)
  const [flash, setFlash] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [isComplete, setIsComplete] = useState(!!initialParticipant.completedAt)
  const [voucherCode, setVoucherCode] = useState(initialParticipant.voucherCode)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentClue = clues[currentClueIndex]
  const progress = clues.length > 0 ? ((currentClueIndex + 1) / clues.length) * 100 : 0

  useEffect(() => {
    if (!isComplete && inputRef.current) {
      inputRef.current.focus()
    }
  }, [currentClueIndex, isComplete])

  if (isComplete && voucherCode) {
    return (
      <CompletionScreen
        participant={initialParticipant}
        hunt={hunt}
        voucherCode={voucherCode}
        theme={theme}
      />
    )
  }

  if (!currentClue) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: theme.bgFrom }}>
        <p className="text-gray-500">Loading your next clue...</p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!answer.trim() || submitting) return
    setSubmitting(true)
    setErrorMsg('')

    const result = await submitAnswer(initialParticipant.id, currentClue.id, answer.trim())
    setSubmitting(false)

    if (!result.success) {
      setErrorMsg(result.error || 'Something went wrong. Please try again.')
      return
    }

    if (!result.correct) {
      setWrongCount((c) => c + 1)
      setErrorMsg('Not quite! Try again.')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      if (result.hint) setHint(result.hint)
      setTimeout(() => inputRef.current?.focus(), 550)
      return
    }

    // Correct!
    if (result.isComplete && result.voucherCode) {
      setVoucherCode(result.voucherCode)
      setIsComplete(true)
      return
    }

    // Move to next clue
    setFlash(true)
    setSuccessMsg('Well done! 🎉')
    setTimeout(() => {
      setFlash(false)
      setSuccessMsg('')
      setCurrentClueIndex((i) => i + 1)
      setAnswer('')
      setWrongCount(0)
      setHint(null)
      setErrorMsg('')
    }, 800)
  }

  const inputPlaceholder =
    currentClue.answerType === 'CODE' ? 'Enter the code' :
    currentClue.answerType === 'NUMBER' ? 'Enter the number' :
    'Type your answer'

  const pageBg = `linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgMid}, ${theme.bgTo})`
  const hintBg = hexWithOpacity(theme.accent, 0.1)
  const hintBorder = hexWithOpacity(theme.accent, 0.4)

  return (
    <div className="min-h-screen" style={{ background: pageBg }}>
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Clue {currentClueIndex + 1} of {clues.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-2 bg-white/60 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: theme.primary }}
              role="progressbar"
              aria-valuenow={currentClueIndex + 1}
              aria-valuemin={1}
              aria-valuemax={clues.length}
            />
          </div>
        </div>

        {/* Clue Card */}
        <div className={`bg-white rounded-2xl shadow-lg overflow-hidden slide-up ${flash ? 'flash-green' : ''}`}>
          {/* Clue header */}
          <div
            className="text-white text-center py-2 text-sm font-semibold tracking-wide"
            style={{ backgroundColor: theme.primary }}
          >
            CLUE {currentClue.order}
          </div>

          <div className="p-6 space-y-5">
            {/* Poem */}
            <div className="text-center">
              <p className="text-gray-700 italic text-base leading-relaxed whitespace-pre-line">
                {currentClue.poem}
              </p>
            </div>

            <hr className="border-gray-100" />

            {/* Task */}
            <div>
              <p className="text-gray-800 text-sm">
                <span className="font-semibold">📍 Your task:</span> {currentClue.taskDescription}
              </p>
            </div>

            {/* Location Hint box */}
            <div
              className="rounded-xl p-3"
              style={{ backgroundColor: hintBg, borderWidth: 1, borderStyle: 'solid', borderColor: hintBorder }}
            >
              <p className="text-sm" style={{ color: theme.primary }}>
                <span className="font-semibold">🗺 Where to look:</span> {currentClue.locationHint}
              </p>
            </div>

            {/* Hint after wrong attempts */}
            {hint && wrongCount >= 2 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3" role="alert">
                <p className="text-amber-800 text-sm">
                  <span className="font-semibold">💡 Hint:</span> {hint}
                </p>
              </div>
            )}

            {/* Answer Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor="answer-input" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Your Answer
                </label>
                <input
                  id="answer-input"
                  ref={inputRef}
                  type="text"
                  value={answer}
                  onChange={(e) => { setAnswer(e.target.value); setErrorMsg('') }}
                  placeholder={inputPlaceholder}
                  inputMode={currentClue.answerType === 'NUMBER' ? 'numeric' : 'text'}
                  aria-describedby={errorMsg ? 'answer-error' : undefined}
                  className={`w-full h-12 px-4 rounded-xl border text-base focus:outline-none focus:ring-2 transition-all ${
                    errorMsg ? 'border-red-400 focus:ring-red-400' : 'border-gray-200'
                  } ${shake ? 'shake' : ''}`}
                  style={!errorMsg ? { '--tw-ring-color': theme.primary } as React.CSSProperties : {}}
                  disabled={submitting}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                />
                {errorMsg && (
                  <p id="answer-error" className="text-sm text-red-600 mt-1" role="alert">
                    {errorMsg}
                  </p>
                )}
              </div>

              {successMsg ? (
                <div
                  className="w-full h-12 rounded-xl flex items-center justify-center font-semibold text-lg"
                  style={{ backgroundColor: hexWithOpacity(theme.primary, 0.12), color: theme.primary }}
                  role="status"
                >
                  {successMsg}
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={submitting || !answer.trim()}
                  className="w-full h-12 text-white rounded-xl font-semibold text-base disabled:opacity-60 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
                  style={{ backgroundColor: theme.primary }}
                >
                  {submitting ? 'Checking...' : 'Submit Answer'}
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-6">
          {clues.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all ${i === currentClueIndex ? 'ring-2' : ''}`}
              style={{
                width: i < currentClueIndex ? 12 : i === currentClueIndex ? 12 : 8,
                height: i < currentClueIndex ? 12 : i === currentClueIndex ? 12 : 8,
                marginTop: i < currentClueIndex || i === currentClueIndex ? 0 : 2,
                backgroundColor: i < currentClueIndex ? theme.primary :
                  i === currentClueIndex ? theme.primary :
                  '#d1d5db',
                opacity: i < currentClueIndex ? 1 : i === currentClueIndex ? 1 : 0.5,
                outline: i === currentClueIndex ? `2px solid ${hexWithOpacity(theme.primary, 0.3)}` : undefined,
                outlineOffset: i === currentClueIndex ? '2px' : undefined,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
