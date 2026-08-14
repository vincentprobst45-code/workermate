'use client';

import type { WorkOrder } from './WorkOrdersList';

type WorkOrderDetailsProps = {
  workOrder: WorkOrder;
  onClose: () => void;
  onEdit: () => void;
  onSelect?: () => void;
};

export default function WorkOrderDetails({ workOrder, onClose, onEdit, onSelect }: WorkOrderDetailsProps) {
  const totalPrice = workOrder.items.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0,
  );

  return (
    <div className="bg-white rounded-lg p-6 max-w-2xl w-[92vw] max-h-[85vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
      <div className="pb-4 flex items-center gap-3">
        <h3 className="text-2xl"><strong>Détails chantier</strong></h3>
        <button
          type="button"
          className="ml-auto rounded-md border-2 border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-800 hover:bg-blue-100"
          onClick={onEdit}
        >
          Modifier le chantier
        </button>
        <button type="button" className="border-2 rounded-md px-3 py-2" onClick={onClose}>
          Fermer X
        </button>
      </div>

      <p>id : {workOrder.id}</p>
      <p>titre : {workOrder.title}</p>
      <p>description : {workOrder.description || '-'}</p>
      <p>reference : {workOrder.reference || '-'}</p>
      <p>status : {workOrder.status}</p>
      <p>startDate : {workOrder.startDate || '-'}</p>
      <p>endDate : {workOrder.endDate || '-'}</p>
      <p>customerId : {workOrder.customerId || '-'}</p>
      <p>addressId : {workOrder.addressId || '-'}</p>
      <p>createdById : {workOrder.createdById || '-'}</p>
      <p>createdAt : {workOrder.createdAt || '-'}</p>

      <div className="mt-4">
        <p className="font-semibold">Étapes chantier</p>
        {workOrder.items.length > 0 ? (
          <ul className="list-disc pl-5 mt-2 space-y-1">
            {workOrder.items.map((item) => (
              <li key={item.id}>
                {item.position}. {item.title} ({item.type}) - {item.quantity} {item.unit || ''} - {item.unitPrice} € par unité - coût d&apos;achat unitaire : {item.unitCost === undefined || item.unitCost === null ? '-' : `${item.unitCost} €`} - TVA achat : {item.purchaseVatRate === undefined || item.purchaseVatRate === null ? '-' : `${item.purchaseVatRate} %`} - {item.unitPrice * item.quantity} € au total
              </li>
            ))}
            <li>Total : {totalPrice} €</li>
          </ul>
        ) : (
          <p className="text-sm text-slate-600 mt-1">Aucune étape.</p>
        )}
      </div>

      {onSelect && (
        <button
          type="button"
          onClick={onSelect}
          className="border-double border-gray-700 border-2 shadow-md text-xl text-white rounded-sm mx-4 my-2 py-2 px-3 bg-blue-400 hover:bg-blue-600 active:bg-blue-900"
        >
          Sélectionner ce chantier
        </button>
      )}
    </div>
  );
}
