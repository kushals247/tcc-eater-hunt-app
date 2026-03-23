'use client'
import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'

type Hunt = {
  id: string
  title: string
  registrationHeadline: string
  location: { name: string; slug: string }
}

export default function QRPageClient({ hunt, registrationUrl }: { hunt: Hunt; registrationUrl: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [showInstructions, setShowInstructions] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function generateQR() {
      const QRCode = (await import('qrcode')).default
      const dataUrl = await QRCode.toDataURL(registrationUrl, {
        errorCorrectionLevel: 'H',
        margin: 4,
        width: 400,
        color: { dark: '#000000', light: '#FFFFFF' },
      })
      setQrDataUrl(dataUrl)
    }
    generateQR()
  }, [registrationUrl])

  async function copyUrl() {
    await navigator.clipboard.writeText(registrationUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function downloadPNG() {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `qr-${hunt.location.slug}-${hunt.id}.png`
    a.click()
  }

  async function downloadPoster() {
    if (!qrDataUrl) return
    const { generatePosterHTML } = await import('@/lib/qr')
    const html = generatePosterHTML({
      qrDataUrl,
      huntTitle: hunt.title,
      locationName: hunt.location.name,
      registrationHeadline: hunt.registrationHeadline,
      baseUrl: registrationUrl,
    })
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `poster-${hunt.location.slug}-${hunt.id}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="mb-6">
        <nav className="text-sm text-gray-500 mb-2">
          <a href="/admin/hunts" className="hover:text-gray-700">Hunts</a> / <a href={`/admin/hunts/${hunt.id}/edit`} className="hover:text-gray-700">{hunt.title}</a> / QR Code
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">QR Code — {hunt.title}</h1>
        <p className="text-gray-500 mt-1">{hunt.location.name}</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Registration URL */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Registration URL</h2>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-50 px-3 py-2 rounded-md text-sm font-mono break-all border border-gray-200">{registrationUrl}</code>
            <button onClick={copyUrl} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors">
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">QR Code</h2>
          <div className="flex flex-col items-center gap-6">
            {qrDataUrl ? (
              <div className="border-4 border-gray-200 rounded-lg p-2 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="QR Code" width={300} height={300} />
              </div>
            ) : (
              <div className="w-[308px] h-[308px] border-4 border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                <p className="text-gray-400">Generating...</p>
              </div>
            )}
            <div className="flex gap-3 flex-wrap justify-center">
              <button onClick={downloadPNG} disabled={!qrDataUrl} className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors">
                ⬇ Download QR Code (PNG)
              </button>
              <button onClick={downloadPoster} disabled={!qrDataUrl} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors">
                🖨 Download Print-Ready Poster (HTML)
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button onClick={() => setShowInstructions(!showInstructions)} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors">
            <span className="font-semibold text-gray-900">How to deploy this QR code</span>
            {showInstructions ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
          </button>
          {showInstructions && (
            <div className="px-6 pb-6 text-sm text-gray-600 space-y-3 border-t border-gray-100 pt-4">
              <p>📋 <strong>Print the poster</strong> and place it at the store entrance or wherever you want to start the hunt.</p>
              <p>📍 <strong>Each location has a unique QR code</strong> — do not mix QR codes between stores.</p>
              <p>🔗 <strong>If you move a hunt to a new URL</strong>, regenerate the QR code and reprint the poster.</p>
              <p>📱 <strong>Test before printing at scale</strong> — scan with a phone to confirm the registration page loads correctly.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
