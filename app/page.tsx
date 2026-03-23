import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-yellow-50">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold text-green-800 mb-4">🎯 QR Treasure Hunt</h1>
        <p className="text-gray-600 mb-8 text-lg">
          Scan a QR code in-store to begin your treasure hunt experience!
        </p>
        <Link
          href="/admin"
          className="inline-flex items-center px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors font-medium"
        >
          Admin Dashboard →
        </Link>
      </div>
    </div>
  )
}
