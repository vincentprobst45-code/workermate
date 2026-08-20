'use client';

import { useCallback, useEffect, useState } from 'react';
import { useApiClient } from '../api-client';
import { useAuth } from '../auth.context';

type EmployeeRole = 'OWNER' | 'ADMIN' | 'MEMBER';

type Employee = {
  userId: string;
  role: EmployeeRole;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    firstname?: string | null;
    lastname?: string | null;
  };
};

const roleLabels: Record<EmployeeRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Membre',
};

function employeeName(employee: Employee): string {
  return [employee.user.firstname, employee.user.lastname].filter(Boolean).join(' ') || employee.user.email;
}

export default function EmployeesList() {
  const api = useApiClient();
  const { user, activeTenant } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/memberships/current');
      if (!response.ok) throw new Error('Impossible de charger les employés.');
      setEmployees(await response.json() as Employee[]);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Impossible de charger les employés.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  async function changeRole(employee: Employee, role: EmployeeRole) {
    setSavingUserId(employee.userId);
    setError('');
    try {
      const response = await api.patch(`/memberships/${employee.userId}/role`, { role });
      if (!response.ok) throw new Error('Impossible de modifier le rôle.');
      setEmployees((current) => current.map((item) => item.userId === employee.userId ? { ...item, role } : item));
    } catch (roleError) {
      setError(roleError instanceof Error ? roleError.message : 'Impossible de modifier le rôle.');
    } finally {
      setSavingUserId(null);
    }
  }

  async function removeMembership(employee: Employee) {
    if (!window.confirm(`Supprimer ${employeeName(employee)} de cette entreprise ?`)) return;
    setSavingUserId(employee.userId);
    setError('');
    try {
      const response = await api.delete(`/memberships/${employee.userId}`);
      if (!response.ok) throw new Error('Impossible de supprimer ce membership.');
      setEmployees((current) => current.filter((item) => item.userId !== employee.userId));
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Impossible de supprimer ce membership.');
    } finally {
      setSavingUserId(null);
    }
  }

  const canManage = activeTenant?.role === 'OWNER' || activeTenant?.role === 'ADMIN';
  const isOwner = activeTenant?.role === 'OWNER';

  if (loading) return <section className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Chargement des membres...</p></section>;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/80">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Équipe</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">Membres de l’entreprise</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">{employees.length} membre{employees.length === 1 ? '' : 's'}</span>
      </div>
      {error && <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!employees.length ? <p className="text-sm text-slate-600">Aucun membre dans cette entreprise.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-3 py-3 font-medium">Employé</th><th className="px-3 py-3 font-medium">Rôle</th>{canManage && <th className="px-3 py-3 font-medium">Actions</th>}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((employee) => {
                const canManageTarget = canManage && (isOwner || employee.role !== 'OWNER');
                const canRemoveTarget = canManageTarget && employee.userId !== user?.id;
                const roleOptions: EmployeeRole[] = isOwner ? ['MEMBER', 'ADMIN', 'OWNER'] : ['MEMBER', 'ADMIN'];
                return (
                  <tr key={employee.userId}>
                    <td className="px-3 py-4"><p className="font-medium text-slate-900">{employeeName(employee)}{employee.userId === user?.id && <span className="ml-2 text-xs text-slate-500">(vous)</span>}</p><p className="text-slate-500">{employee.user.email}</p></td>
                    <td className="px-3 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{roleLabels[employee.role]}</span></td>
                    {canManage && <td className="px-3 py-4"><div className="flex flex-wrap items-center gap-2">{canManageTarget && <select aria-label={`Rôle de ${employeeName(employee)}`} value={employee.role} disabled={savingUserId === employee.userId} className="rounded border border-slate-300 bg-white px-2 py-1.5 text-xs" onChange={(event) => void changeRole(employee, event.target.value as EmployeeRole)}>{roleOptions.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</select>}{canRemoveTarget && <button type="button" disabled={savingUserId === employee.userId} className="rounded border border-red-200 px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50" onClick={() => void removeMembership(employee)}>Supprimer</button>}</div></td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
