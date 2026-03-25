'use client'

import { useState } from 'react'
import { createAdminUser, updateAdminUser, deleteAdminUser } from '@/actions/admin'

type User = {
  id: string
  username: string
  email: string | null
  role: string
  isActive: boolean
  createdAt: Date
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-violet-100 text-violet-700',
  VIEWER: 'bg-blue-100 text-blue-700',
  VOUCHER_STAFF: 'bg-amber-100 text-amber-700',
}

const roleLabel: Record<string, string> = {
  ADMIN: 'Admin',
  VIEWER: 'Viewer',
  VOUCHER_STAFF: 'Voucher Staff',
}

type DialogMode = 'create' | 'edit' | 'password' | null

export function UsersClient({ users: initial, currentUserId }: { users: User[]; currentUserId: string }) {
  const [users, setUsers] = useState(initial)
  const [mode, setMode] = useState<DialogMode>(null)
  const [selected, setSelected] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Create form state
  const [newUsername, setNewUsername] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('VIEWER')

  // Edit form state
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState('')

  // Password form state
  const [newPwd, setNewPwd] = useState('')

  function openCreate() {
    setNewUsername(''); setNewEmail(''); setNewPassword(''); setNewRole('VIEWER')
    setError(''); setMode('create')
  }

  function openEdit(user: User) {
    setSelected(user); setEditEmail(user.email ?? ''); setEditRole(user.role)
    setError(''); setMode('edit')
  }

  function openPassword(user: User) {
    setSelected(user); setNewPwd('')
    setError(''); setMode('password')
  }

  function close() { setMode(null); setSelected(null); setError('') }

  async function handleDelete(user: User) {
    if (!window.confirm(`Permanently delete user "${user.username}"?\n\nThis cannot be undone.`)) return
    const res = await deleteAdminUser(user.id)
    if (!res.success) {
      alert(res.error ?? 'Failed to delete user')
      return
    }
    window.location.reload()
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await createAdminUser({ username: newUsername, email: newEmail || undefined, password: newPassword, role: newRole })
    setLoading(false)
    if (!res.success) { setError(res.error ?? 'Failed'); return }
    // Refresh by reloading
    window.location.reload()
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setLoading(true); setError('')
    const res = await updateAdminUser(selected.id, { email: editEmail || undefined, role: editRole })
    setLoading(false)
    if (!res.success) { setError(res.error ?? 'Failed'); return }
    setUsers((prev) => prev.map((u) => u.id === selected.id ? { ...u, email: editEmail || null, role: editRole } : u))
    close()
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setLoading(true); setError('')
    const res = await updateAdminUser(selected.id, { password: newPwd })
    setLoading(false)
    if (!res.success) { setError(res.error ?? 'Failed'); return }
    close()
  }

  async function toggleActive(user: User) {
    const res = await updateAdminUser(user.id, { isActive: !user.isActive })
    if (res.success) {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: !u.isActive } : u))
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <span className="text-sm text-slate-500">{users.length} user{users.length !== 1 ? 's' : ''}</span>
          <button
            onClick={openCreate}
            className="bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors"
          >
            + New User
          </button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">
                  {user.username}
                  {user.id === currentUserId && (
                    <span className="ml-2 text-xs text-slate-400">(you)</span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-500">{user.email || '—'}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${roleColors[user.role] ?? 'bg-slate-100 text-slate-600'}`}>
                    {roleLabel[user.role] ?? user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400 text-xs">
                  {new Date(user.createdAt).toLocaleDateString('en-GB')}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => openEdit(user)} className="text-xs text-slate-500 hover:text-slate-800 underline">Edit</button>
                    <button onClick={() => openPassword(user)} className="text-xs text-slate-500 hover:text-slate-800 underline">Password</button>
                    {user.id !== currentUserId && (
                      <>
                        <button
                          onClick={() => toggleActive(user)}
                          className={`text-xs underline ${user.isActive ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="text-xs text-red-600 hover:text-red-800 underline font-semibold"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Dialogs ── */}
      {mode && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            {mode === 'create' && (
              <>
                <h2 className="text-lg font-bold text-slate-900 mb-4">New User</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                  <Field label="Username" required>
                    <input className={inputCls} value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required autoFocus />
                  </Field>
                  <Field label="Email (optional)">
                    <input className={inputCls} type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                  </Field>
                  <Field label="Password" required>
                    <input className={inputCls} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
                  </Field>
                  <Field label="Role" required>
                    <RoleSelect value={newRole} onChange={setNewRole} />
                  </Field>
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  <DialogActions onCancel={close} loading={loading} submitLabel="Create User" />
                </form>
              </>
            )}

            {mode === 'edit' && selected && (
              <>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Edit {selected.username}</h2>
                <form onSubmit={handleEdit} className="space-y-4">
                  <Field label="Email (optional)">
                    <input className={inputCls} type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} autoFocus />
                  </Field>
                  <Field label="Role" required>
                    <RoleSelect value={editRole} onChange={setEditRole} />
                  </Field>
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  <DialogActions onCancel={close} loading={loading} submitLabel="Save Changes" />
                </form>
              </>
            )}

            {mode === 'password' && selected && (
              <>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Reset Password — {selected.username}</h2>
                <form onSubmit={handlePassword} className="space-y-4">
                  <Field label="New Password" required>
                    <input className={inputCls} type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required minLength={6} autoFocus />
                  </Field>
                  {error && <p className="text-red-600 text-sm">{error}</p>}
                  <DialogActions onCancel={close} loading={loading} submitLabel="Update Password" />
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

const inputCls = 'w-full h-10 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  )
}

function RoleSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="ADMIN">Admin — full access</option>
      <option value="VIEWER">Viewer — read-only</option>
      <option value="VOUCHER_STAFF">Voucher Staff — voucher redemption only</option>
    </select>
  )
}

function DialogActions({ onCancel, loading, submitLabel }: { onCancel: () => void; loading: boolean; submitLabel: string }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onCancel} className="flex-1 h-10 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
      <button type="submit" disabled={loading} className="flex-1 h-10 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-50">
        {loading ? 'Saving…' : submitLabel}
      </button>
    </div>
  )
}
