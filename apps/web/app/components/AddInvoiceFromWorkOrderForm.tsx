'use client';

import type { WorkOrder } from './WorkOrdersList';

export interface AddInvoiceFromWorkOrderFormData {
  workOrderId: string;
  issueDate: string;
  dueDate?: string;
  paymentTerms?: string;
  legalMentions?: string;
  notes?: string;
  discountAmount?: number;
  depositAmount?: number;
}

type AddInvoiceFromWorkOrderFormProps = {
  selectedWorkOrder?: WorkOrder;
  formData: AddInvoiceFromWorkOrderFormData;
  onChange: (value: AddInvoiceFromWorkOrderFormData) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export default function AddInvoiceFromWorkOrderForm({
  selectedWorkOrder,
  formData,
  onChange,
  onSubmit,
}: AddInvoiceFromWorkOrderFormProps) {
  if (!selectedWorkOrder) {
    return null;
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900">
          WorkOrder sélectionné : {selectedWorkOrder.title}
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input type="hidden" value={formData.workOrderId} readOnly />
          <input
            type="datetime-local"
            className="rounded border px-3 py-2"
            placeholder="Date d'échéance"
            value={formData.dueDate}
            onChange={(event) => onChange({ ...formData, dueDate: event.target.value })}
            required
          />
          <input
            type="datetime-local"
            className="rounded border px-3 py-2"
            placeholder="Date d'émission"
            value={formData.issueDate}
            onChange={(event) => onChange({ ...formData, issueDate: event.target.value })}
            required
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="Mentions légales"
            value={formData.legalMentions}
            onChange={(event) => onChange({ ...formData, legalMentions: event.target.value })}
            required
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="Notes"
            value={formData.notes}
            onChange={(event) => onChange({ ...formData, notes: event.target.value })}
            required
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="Conditions de paiement"
            value={formData.paymentTerms}
            onChange={(event) => onChange({ ...formData, paymentTerms: event.target.value })}
            required
          />
          <input
            type="number"
            className="rounded border px-3 py-2"
            placeholder="Remise"
            value={formData.discountAmount}
            onChange={(event) => onChange({ ...formData, discountAmount: event.target.valueAsNumber })}
            required
          />
          <input
            type="number"
            className="rounded border px-3 py-2"
            placeholder="Acompte"
            value={formData.depositAmount}
            onChange={(event) => onChange({ ...formData, depositAmount: event.target.valueAsNumber })}
            required
          />
        </div>
        <button
          type="submit"
          className="mt-4 rounded-sm border-2 border-double border-gray-700 bg-blue-400 px-3 py-2 text-xl text-white shadow-md hover:bg-blue-600 active:bg-blue-900"
        >
          Créer la facture pour ce chantier
        </button>
      </form>
    </div>
  );
}
