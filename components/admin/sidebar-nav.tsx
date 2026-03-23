'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MapPin, Compass, Users, LogOut } from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/locations', label: 'Locations', icon: MapPin, exact: false },
  { href: '/admin/hunts', label: 'Hunts', icon: Compass, exact: false },
  { href: '/admin/participants', label: 'Participants', icon: Users, exact: false },
]

export function SidebarNav() {
  const pathname = usePathname()

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-slate-900 flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-700/60">
        <span className="text-2xl">🎯</span>
        <div>
          <div className="text-white font-bold text-sm leading-tight">Hunt Admin</div>
          <div className="text-slate-400 text-xs">QR Treasure Hunt</div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Navigation
        </p>
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-700/60">
        <Link
          href="/api/admin/auth?logout=1"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors w-full"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Sign out
        </Link>
      </div>
    </aside>
  )
}
