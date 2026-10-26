import React from 'react'

const AdminUsers: React.FC = () => {
  const users = [
    { id: 1, name: 'Arthur Vance', email: 'patient@neurotwin.ai', role: 'Patient', status: 'Active' },
    { id: 2, name: 'Dr. Sarah Chen', email: 'doctor@neurotwin.ai', role: 'Doctor', status: 'Active' },
    { id: 3, name: 'Clara Vance', email: 'family@neurotwin.ai', role: 'Family', status: 'Active' },
    { id: 4, name: 'System Administrator', email: 'admin@neurotwin.ai', role: 'Admin', status: 'Active' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">User Management</h1>
        <p className="text-slate-500 dark:text-slate-400">System user accounts and access permissions</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="p-4 font-semibold text-slate-800 dark:text-white">{u.name}</td>
                <td className="p-4 text-slate-500 dark:text-slate-400">{u.email}</td>
                <td className="p-4">
                  <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    {u.role}
                  </span>
                </td>
                <td className="p-4 text-emerald-600 dark:text-emerald-400 font-medium">{u.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminUsers
