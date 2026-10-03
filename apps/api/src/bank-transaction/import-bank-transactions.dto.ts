import { BankTransactionDirection } from '@prisma/client';

export interface ImportedBankTransactionDto {
  amount: number;
  direction: BankTransactionDirection;
  currency?: string;
  transactionDate: string;
  label?: string;
  reference?: string;
  externalId?: string;
}

export class ImportBankTransactionsDto {
  paymentAccountId!: string;
  fileName!: string;
  sourceFormat?: string;
  transactions!: ImportedBankTransactionDto[];
  allowHistorical?: boolean;
}
