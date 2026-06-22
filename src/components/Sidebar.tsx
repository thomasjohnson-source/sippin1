'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: 'Dashboard',  icon: '▦' },
  { href: '/books',     label: 'Books',      icon: '⊟' },
  { href: '/inventory', label: 'Inventory',  icon: '⊞' },
  { href: '/invoices',  label: 'Invoices',   icon: '⊠' },
  { href: '/contacts',  label: 'Contacts',   icon: '⊙' },
  { href: '/settings',  label: 'Settings',   icon: '⊚' },
]

const NAVY  = '#1C2035'
const NAVY2 = '#252843'
const ORANGE = '#FD8141'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const signOut = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' })
    router.push('/login')
  }

  return (
    <aside className="w-56 flex flex-col shrink-0" style={{ background: NAVY }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: NAVY2 }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
            style={{ background: ORANGE, color: '#fff', fontFamily: "'Barlow Condensed', sans-serif", fontStyle: 'italic', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.02em' }}>
            OJ
          </div>
          <div>
            <p className="font-black leading-none tracking-wide"
              style={{ color: ORANGE, fontFamily: "'Barlow Condensed', sans-serif", fontStyle: 'italic', fontSize: '1rem', letterSpacing: '0.04em' }}>
              OJ SIPPIN
            </p>
            <p className="text-xs mt-0.5 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.6rem' }}>Juice Company</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: active ? 'rgba(253,129,65,0.12)' : 'transparent',
                color: active ? ORANGE : 'rgba(255,255,255,0.55)',
                borderLeft: active ? `3px solid ${ORANGE}` : '3px solid transparent',
              }}
            >
              <span className="text-base w-5 text-center" style={{ opacity: active ? 1 : 0.7 }}>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-2 py-4 border-t" style={{ borderColor: NAVY2 }}>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all hover:bg-white/5"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          <span>↪</span> Sign out
        </button>
      </div>
    </aside>
  )
}
