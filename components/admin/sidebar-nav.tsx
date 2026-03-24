'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MapPin, Compass, Users, LogOut, Ticket, UserCog } from 'lucide-react'

type NavItem = { href: string; label: string; icon: React.ElementType; exact: boolean }

const allNavItems: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/locations', label: 'Locations', icon: MapPin, exact: false },
  { href: '/admin/hunts', label: 'Hunts', icon: Compass, exact: false },
  { href: '/admin/participants', label: 'Participants', icon: Users, exact: false },
  { href: '/admin/vouchers', label: 'Vouchers', icon: Ticket, exact: false },
  { href: '/admin/users', label: 'Users', icon: UserCog, exact: false },
]

function navItemsForRole(role: string): NavItem[] {
  if (role === 'VOUCHER_STAFF') {
    return allNavItems.filter((i) => i.href === '/admin/vouchers')
  }
  if (role === 'VIEWER') {
    return allNavItems.filter((i) => i.href !== '/admin/users')
  }
  return allNavItems // ADMIN sees all
}

const roleBadgeStyle: Record<string, string> = {
  ADMIN: 'bg-violet-500/20 text-violet-300',
  VIEWER: 'bg-blue-500/20 text-blue-300',
  VOUCHER_STAFF: 'bg-amber-500/20 text-amber-300',
}

const roleLabel: Record<string, string> = {
  ADMIN: 'Admin',
  VIEWER: 'Viewer',
  VOUCHER_STAFF: 'Voucher Staff',
}

export function SidebarNav({ role }: { role: string }) {
  const pathname = usePathname()
  const navItems = navItemsForRole(role)

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

      {/* Role badge */}
      <div className="px-6 py-3 border-b border-slate-700/40">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadgeStyle[role] ?? 'bg-slate-700 text-slate-300'}`}>
          {roleLabel[role] ?? role}
        </span>
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
        <button
          onClick={() => { window.location.href = '/api/admin/auth?logout=1' }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors w-full"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
