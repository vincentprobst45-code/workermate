import { InvoicePdpStatus, InvoiceStatus, PaymentMethod } from "@prisma/client";
import { useApiClient } from "../api-client";

export interface InvoiceItem {
    id: string;
    invoiceId: string;
    position: number;
    title: string;
    description: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    vatRate: number;
    total: number;
}

export interface Invoice {
    id: string;
    tenantId: string;
    customerId: string;
    projectId?: string;
    number: string;
    issueDate: string;
    dueDate?: string;
    projectReference: string;
    projectTitle: string;
    tenantName: string;
    tenantStreet1: string;
    tenantStreet2?: string;
    tenantPostalCode: string;
    tenantCity: string;
    tenantSiretNumber: string;
    tenantVatNumber: string;
    tenantEmail: string;
    tenantPhoneNumber: string;
    tenantIban?: string;
    tenantBic?: string;
    customerFirstName: string;
    customerLastName: string;
    customerStreet1: string;
    customerStreet2?: string;
    customerPostalCode: string;
    customerCity: string;
    customerEmail?: string;
    customerPhoneNumber?: string;
    customerVatNumber?: string;
    projectStartDate?: string;
    projectEndDate?: string;
    projectAddress?: string;
    projectPostalCode?: string;
    projectCity?: string;
    status: InvoiceStatus;
    currency: string;
    subtotal: number;
    vatAmount: number;
    total: number;
    paymentTerms?: string;
    legalMentions?: string;
    notes?: string;
    depositAmount?: number;
    discountAmount?: number;
    paidAt?: string;
    paymentMethod?: PaymentMethod;
    pdfFileId?: string;
    pdpStatus: InvoicePdpStatus;
    pdpMessageId?: string;
    quoteId?: string;
    quoteNumber?: string;
    createdAt: string;
    updatedAt: string;
    items?: InvoiceItem[];
}

export interface AddInvoiceFormData {
    // id: string;
    // tenantId: string;
    customerId: string;
    projectId?: string;
    // number: string;
    issueDate: string;
    dueDate?: string;
    projectReference: string;
    projectTitle: string;
    
    // tenantName: string;
    // tenantStreet1: string;
    // tenantStreet2?: string;
    // tenantPostalCode: string;
    // tenantCity: string;
    // tenantSiretNumber: string;
    // tenantVatNumber: string;
    // tenantEmail: string;
    // tenantPhoneNumber: string;
    // tenantIban?: string;
    // tenantBic?: string;

    customerFirstName: string;
    customerLastName: string;
    customerStreet1: string;
    customerStreet2?: string;
    customerPostalCode: string;
    customerCity: string;
    customerEmail?: string;
    customerPhoneNumber?: string;
    customerVatNumber?: string;

    projectStartDate?: string;
    projectEndDate?: string;
    projectAddress?: string;
    projectPostalCode?: string;
    projectCity?: string;

    status: InvoiceStatus;

    currency: string;
    subtotal: number;
    vatAmount: number;

    total: number;

    paymentTerms?: string;
    legalMentions?: string;
    notes?: string;

    depositAmount?: number;
    discountAmount?: number;

    paidAt?: string;
    paymentMethod?: PaymentMethod;

    pdfFileId?: string;

    pdpStatus: InvoicePdpStatus;
    pdpMessageId?: string;

    quoteId?: string;
    quoteNumber?: string;

    createdAt: string;
    updatedAt: string;
    
    items?: InvoiceItem[];
}

type AddInvoiceFormProps = {
  onCreated : (invoice: Invoice) => void;
  show : boolean;
};


export default function AddInvoiceForm({ onCreated, show }: AddInvoiceFormProps){
    const api = useApiClient();
    const [newInvoice, setNewInvoice] = useState<AddInvoiceFormData>(createEmptyProject());
    const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
    const [customersLoading, setCustomersLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [addressError, setAddressError] = useState('');
    const [addressSuccess, setAddressSuccess] = useState('');


}