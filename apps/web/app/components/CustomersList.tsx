'use client';

import { useState } from 'react';
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
  handleSelectedCustomer?: ((customer: Customer) => void | Promise<void>) | null;
}

export default function CustomersList({ customers, onDelete = null, handleSelectedCustomer = null }: CustomersListProps) {
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customersPerPage, setCustomersPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'createdAtDesc' | 'createdAtAsc' | 'lastNameAsc' | 'lastNameDesc'>('createdAtDesc');

  const sortedCustomers = [...customers].sort((a, b) => {
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

  const totalPages = Math.max(1, Math.ceil(sortedCustomers.length / customersPerPage));
  const effectiveCurrentPage = Math.min(currentPage, totalPages);
  const firstItemIndex = (effectiveCurrentPage - 1) * customersPerPage;
  const currentCustomers = sortedCustomers.slice(firstItemIndex, firstItemIndex + customersPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <>
      <div className="mb-4 flex flex-wrap justify-end items-center gap-2">
        <label htmlFor="customers-sort" className="text-sm text-slate-700">
          Trier
        </label>
        <select
          id="customers-sort"
          className="border px-2 py-1 rounded bg-white"
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
        </select>

        <label htmlFor="customers-per-page" className="text-sm text-slate-700">
          Clients par page
        </label>
        <select
          id="customers-per-page"
          className="border px-2 py-1 rounded bg-white"
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
        </select>
      </div>

      <section className="grid gap-4">
        <p>Cliquez sur un client pour obtenir les details</p>
        {currentCustomers.map((customer) => (
          <div
            key={customer.id}
            role={handleSelectedCustomer ? 'button' : undefined}
            tabIndex={handleSelectedCustomer ? 0 : undefined}
            className="hover:bg-gray-100 active:bg-gray-400 p-4 bg-white rounded-lg shadow flex justify-between items-center border-2 border-gray-700"
            onClick={() => {
              if (handleSelectedCustomer) {
                void handleSelectedCustomer(customer);
                return;
              }

              setShowCustomerDetails(true);
              setSelectedCustomer(customer);
            }}
            onKeyDown={(event) => {
              if (handleSelectedCustomer && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                void handleSelectedCustomer(customer);
              }
            }}
          >
            <div>
              <p className="font-semibold">
                {customer.firstName} {customer.lastName}
              </p>
              <p className="font-semibold">
                {customer.mobile} {customer.email}
              </p>
              <p className="font-semibold">
                {customer.address?.street1} {customer.address?.postalCode} {customer.address?.city}
              </p>
              {customer.company && <p className="text-sm text-slate-600">{customer.company}</p>}
            </div>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  void onDelete(customer.id);
                }}
                className="text-red-600 hover:text-red-800"
              >
                Supprimer
              </button>
            )}
          </div>
        ))}
      </section>

      {sortedCustomers.length === 0 && (
        <p className="mt-4 text-sm text-slate-600">Aucun client a afficher.</p>
      )}

      {sortedCustomers.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button
            className="border px-3 py-1 rounded disabled:opacity-50"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={effectiveCurrentPage === 1}
          >
            Precedent
          </button>

          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              className={`border px-3 py-1 rounded ${pageNumber === effectiveCurrentPage ? 'bg-slate-900 text-white' : 'bg-white'}`}
              onClick={() => setCurrentPage(pageNumber)}
              aria-current={pageNumber === effectiveCurrentPage ? 'page' : undefined}
            >
              {pageNumber}
            </button>
          ))}

          <button
            className="border px-3 py-1 rounded disabled:opacity-50"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={effectiveCurrentPage === totalPages}
          >
            Suivant
          </button>
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
