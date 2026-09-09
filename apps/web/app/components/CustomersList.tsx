'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import CustomersDetails from './CustomersDetails';

export interface AddressOneLine {
  street1?: string;
  postalCode?: string;
  city?: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  createdById?: string;
  firstName: string;
  lastName?: string;
  company?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  addressId?: string;
  address?: AddressOneLine;
  siret?: string;
  vatNumber?: string;
  notes?: string;
  createdAt: string;
}

interface CustomersListProps {
  customers: Customer[];
  onDelete?: ((id: string) => void | Promise<void>) | null;
  onEdit?: ((customer: Customer) => void) | null;
  handleSelectedCustomer?: ((customer: Customer) => void | Promise<void>) | null;
}

export default function CustomersList({ customers, onDelete = null, onEdit = null, handleSelectedCustomer = null }: CustomersListProps) {
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customersPerPage, setCustomersPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  const [deletionError, setDeletionError] = useState('');
  const deleteCancelRef = useRef<HTMLButtonElement>(null);
  const [sortBy, setSortBy] = useState<'createdAtDesc' | 'createdAtAsc' | 'lastNameAsc' | 'lastNameDesc'>('createdAtDesc');

  const filteredAndSortedCustomers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('fr');
    const filtered = customers.filter((customer) =>
      !normalizedSearch || [customer.firstName, customer.lastName, customer.company, customer.email, customer.phone, customer.mobile]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase('fr').includes(normalizedSearch)),
    );
    return [...filtered].sort((a, b) => {
    if (sortBy === 'createdAtDesc') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'createdAtAsc') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'lastNameAsc') {
      return (a.lastName || '').localeCompare(b.lastName || '', 'fr', { sensitivity: 'base' });
    }
    return (b.lastName || '').localeCompare(a.lastName || '', 'fr', { sensitivity: 'base' });
    });
  }, [customers, searchTerm, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedCustomers.length / customersPerPage));
  const effectiveCurrentPage = Math.min(currentPage, totalPages);
  const firstItemIndex = (effectiveCurrentPage - 1) * customersPerPage;
  const currentCustomers = filteredAndSortedCustomers.slice(firstItemIndex, firstItemIndex + customersPerPage);

  useEffect(() => {
    if (!customerToDelete) return;
    deleteCancelRef.current?.focus();
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !deletingCustomerId) setCustomerToDelete(null);
    }
    document.addEventListener('keydown', closeWithEscape);
    return () => document.removeEventListener('keydown', closeWithEscape);
  }, [customerToDelete, deletingCustomerId]);

  async function confirmDelete() {
    if (!customerToDelete || !onDelete) return;
    setDeletingCustomerId(customerToDelete.id);
    setDeletionError('');
    try {
      await onDelete(customerToDelete.id);
      setCustomerToDelete(null);
    } catch {
      setDeletionError('La suppression a échoué. Le client est toujours présent.');
    } finally {
      setDeletingCustomerId(null);
    }
  }

  return (
    <>
      <div className="mb-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
          <label className="relative block">
            <span className="sr-only">Rechercher un client</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input type="search" value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1); }} placeholder="Rechercher par nom, entreprise ou contact" className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus-visible:outline-none" />
          </label>
          <label htmlFor="customers-sort" className="flex flex-col gap-1 text-sm text-slate-500"><span>Trier par</span>
        <select
          id="customers-sort"
          className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus-visible:outline-none"
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as 'createdAtDesc' | 'createdAtAsc' | 'lastNameAsc' | 'lastNameDesc');
            setCurrentPage(1);
          }}
        >
          <option value="createdAtDesc">Date d&apos;ajout: plus récent</option>
          <option value="createdAtAsc">Date d&apos;ajout: plus ancien</option>
          <option value="lastNameAsc">Nom de famille: A - Z</option>
          <option value="lastNameDesc">Nom de famille: Z - A</option>
        </select></label>

        <label htmlFor="customers-per-page" className="flex flex-col gap-1 text-sm text-slate-500"><span>Clients par page</span>
        <select
          id="customers-per-page"
          className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus-visible:outline-none"
          value={customersPerPage}
          onChange={(e) => {
            setCustomersPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select></label>
      </div>
      <div className="flex flex-wrap gap-2" role="status" aria-label="Statistiques des clients">
        <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">{customers.length} client{customers.length !== 1 ? 's' : ''}</span>
        {searchTerm && <button type="button" onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Effacer la recherche</button>}
      </div>
      </div>

      {/* Desktop / tablet: dense customer table */}
      <section className="hidden overflow-hidden border-y border-slate-200 bg-white sm:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th scope="col" className="w-24 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"><span className="sr-only">Ouvrir</span></th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Client</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Adresse</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Créé le</th>
                {onDelete && <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentCustomers.map((customer) => (
                <tr key={customer.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => { if (handleSelectedCustomer) void handleSelectedCustomer(customer); else { setShowCustomerDetails(true); setSelectedCustomer(customer); } }} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2" aria-label={`Ouvrir le client ${customer.firstName} ${customer.lastName || ''}`}>Ouvrir</button>
                  </td>
                  <td className="max-w-[16rem] px-4 py-3">
                    <p className="truncate font-semibold text-slate-900">{customer.firstName} {customer.lastName}</p>
                    {customer.company && <p className="truncate text-sm text-slate-500">{customer.company}</p>}
                  </td>
                  <td className="max-w-[16rem] px-4 py-3 text-slate-600">
                    {customer.email && <p className="truncate">{customer.email}</p>}
                    {(customer.mobile || customer.phone) && <p className="truncate text-slate-500">{customer.mobile || customer.phone}</p>}
                  </td>
                  <td className="max-w-[14rem] px-4 py-3 text-slate-500">
                    <p className="truncate">{customer.address?.street1 || 'Adresse non renseignée'}</p>
                    {customer.address?.city && <p className="truncate">{customer.address.postalCode} {customer.address.city}</p>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{new Date(customer.createdAt).toLocaleDateString('fr-FR')}</td>
                  {onDelete && <td className="px-4 py-3 text-right"><button type="button" onClick={() => setCustomerToDelete(customer)} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2" aria-label={`Supprimer le client ${customer.firstName} ${customer.lastName || ''}`}>Supprimer</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Mobile: stacked cards */}
      <section className="grid gap-3 sm:hidden">
        {currentCustomers.map((customer) => (
          <div
            key={customer.id}
            className="flex min-h-44 flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-sm"
          >
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-slate-900">{customer.firstName} {customer.lastName}</p>
              {customer.company && <p className="mt-1 truncate text-sm text-slate-600">{customer.company}</p>}
              <div className="mt-4 space-y-1 text-sm text-slate-500">
                {(customer.mobile || customer.phone) && <p>{customer.mobile || customer.phone}</p>}
                {customer.email && <p className="truncate">{customer.email}</p>}
                {customer.address?.city && <p>{customer.address.city}</p>}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <button type="button" onClick={() => { if (handleSelectedCustomer) void handleSelectedCustomer(customer); else { setShowCustomerDetails(true); setSelectedCustomer(customer); } }} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2" aria-label={`Ouvrir le client ${customer.firstName} ${customer.lastName || ''}`}>Ouvrir</button>
              {onDelete && <button type="button" onClick={() => setCustomerToDelete(customer)} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2" aria-label={`Supprimer le client ${customer.firstName} ${customer.lastName || ''}`}>Supprimer</button>}
            </div>
          </div>
        ))}
      </section>

      {filteredAndSortedCustomers.length === 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
          <p className="font-semibold text-slate-800">{customers.length === 0 ? 'Aucun client' : 'Aucun résultat'}</p>
          <p className="mt-1 text-sm text-slate-500">{customers.length === 0 ? 'Ajoutez votre premier client pour commencer.' : 'Modifiez votre recherche.'}</p>
        </div>
      )}

      {filteredAndSortedCustomers.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination des clients">
          <button
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
            aria-label="Page précédente"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={effectiveCurrentPage === 1}
          >
            Precedent
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              className={`rounded-lg border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${pageNumber === effectiveCurrentPage ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-slate-700'}`}
              onClick={() => setCurrentPage(pageNumber)}
              aria-current={pageNumber === effectiveCurrentPage ? 'page' : undefined}
            >
              {pageNumber}
            </button>
          ))}

          <button
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
            aria-label="Page suivante"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={effectiveCurrentPage === totalPages}
          >
            Suivant
          </button>
        </div>
      )}

      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="presentation">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="delete-customer-title" aria-describedby="delete-customer-description">
            <div className="flex items-start justify-between gap-4">
              <div><h2 id="delete-customer-title" className="text-lg font-bold text-slate-900">Supprimer ce client ?</h2><p id="delete-customer-description" className="mt-2 text-sm text-slate-600">Cette action est irréversible.</p></div>
              <button type="button" onClick={() => setCustomerToDelete(null)} aria-label="Fermer la confirmation" disabled={Boolean(deletingCustomerId)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><X className="h-5 w-5" aria-hidden="true" /></button>
            </div>
            {deletionError && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{deletionError}</p>}
            <div className="mt-6 flex justify-end gap-3"><button ref={deleteCancelRef} type="button" onClick={() => setCustomerToDelete(null)} disabled={Boolean(deletingCustomerId)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Annuler</button><button type="button" onClick={() => void confirmDelete()} disabled={Boolean(deletingCustomerId)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-60">{deletingCustomerId ? 'Suppression...' : 'Supprimer définitivement'}</button></div>
          </div>
        </div>
      )}

      {showCustomerDetails && selectedCustomer && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-9"
          onClick={() => {
            setShowCustomerDetails(false);
            setSelectedCustomer(null);
          }}
        >
          <CustomersDetails
            customer={selectedCustomer}
            onEdit={onEdit ? (customer) => { setShowCustomerDetails(false); setSelectedCustomer(null); onEdit(customer); } : undefined}
            onClose={() => {
              setShowCustomerDetails(false);
              setSelectedCustomer(null);
            }}
          />
        </div>
      )}
    </>
  );
}
