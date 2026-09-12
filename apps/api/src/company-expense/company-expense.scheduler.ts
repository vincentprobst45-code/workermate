import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CompanyExpenseScheduler {
  private readonly logger = new Logger(CompanyExpenseScheduler.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async processDueExpenses() {
    const templates = await this.prisma.companyExpense.findMany({
      where: { recurrenceTemplateId: null, recurrenceUnit: { not: null }, nextDueDate: { lte: new Date() } },
    });
    for (const template of templates) {
      await this.generateOccurrences(template);
    }
  }

  private async generateOccurrences(template: Prisma.CompanyExpenseGetPayload<object>) {
    if (!template.nextDueDate || !template.recurrenceUnit) return;
    let nextDate = new Date(template.nextDueDate);
    const now = new Date();
    let generated = 0;
    while (nextDate <= now && (!template.recurrenceEndDate || nextDate <= template.recurrenceEndDate)) {
      const occurrenceDate = new Date(nextDate);
      await this.prisma.$transaction(async (tx) => {
        try {
          await tx.companyExpense.create({
            data: {
              tenantId: template.tenantId,
              paymentAccountId: template.paymentAccountId,
              label: template.label,
              category: template.category,
              taxExclusiveAmount: template.taxExclusiveAmount,
              vatAmount: template.vatAmount,
              deductibleVatAmount: template.deductibleVatAmount,
              taxInclusiveAmount: template.taxInclusiveAmount,
              currency: template.currency,
              dueDate: occurrenceDate,
              recurrenceTemplateId: template.id,
              occurrenceDate,
            },
          });
        } catch (error) {
          if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
        }
        nextDate = this.addInterval(occurrenceDate, template.recurrenceUnit!, template.recurrenceInterval ?? 1);
        await tx.companyExpense.update({ where: { id: template.id }, data: { nextDueDate: nextDate, lastGeneratedAt: occurrenceDate } });
      });
      generated += 1;
    }
    if (generated) this.logger.log(`Generated ${generated} occurrence(s) for expense template ${template.id}`);
  }

  private addInterval(date: Date, unit: string, interval: number) {
    const next = new Date(date);
    if (unit === 'DAILY') next.setUTCDate(next.getUTCDate() + interval);
    if (unit === 'WEEKLY') next.setUTCDate(next.getUTCDate() + interval * 7);
    if (unit === 'MONTHLY') next.setUTCMonth(next.getUTCMonth() + interval);
    if (unit === 'YEARLY') next.setUTCFullYear(next.getUTCFullYear() + interval);
    return next;
  }
}
