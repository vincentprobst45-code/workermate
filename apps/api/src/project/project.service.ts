import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProjectStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateProjectDto } from './create-project.dto';

@Injectable()
export class ProjectService {
  private static readonly PROJECT_REFERENCE_RETRY_LIMIT = 3;

  constructor(private prisma: PrismaService) {}

  private normalizeOptionalString(value?: string | null): string | undefined {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  private normalizeCustomerIds(customerIds?: string[]): string[] {
    if (!customerIds?.length) {
      return [];
    }

    return [...new Set(customerIds.map((id) => id.trim()).filter(Boolean))];
  }

  private normalizeEntityIds(ids?: string[]): string[] {
    if (!ids?.length) {
      return [];
    }

    return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  }

  private isTransactionRetryable(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2034' || error.code === 'P2002')
    );
  }

  private async generateProjectReference(
    tx: Prisma.TransactionClient,
    tenantId: string,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PRJ-${year}-`;

    const existing = await tx.project.findMany({
      where: {
        tenantId,
        reference: {
          startsWith: prefix,
        },
      },
      select: {
        reference: true,
      },
    });

    let maxNumber = 0;
    for (const item of existing) {
      const match = item.reference.match(new RegExp(`^${prefix}(\\d+)$`));
      if (!match) {
        continue;
      }

      const parsed = Number(match[1]);
      if (Number.isFinite(parsed) && parsed > maxNumber) {
        maxNumber = parsed;
      }
    }

    const nextNumber = maxNumber + 1;
    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  }

  private async validateTenantCustomers(tenantId: string, customerIds: string[]) {
    if (!customerIds.length) {
      return;
    }

    const found = await this.prisma.customer.findMany({
      where: {
        tenantId,
        id: {
          in: customerIds,
        },
      },
      select: { id: true },
    });

    if (found.length !== customerIds.length) {
      throw new BadRequestException('Un ou plusieurs clients ne sont pas valides pour ce tenant.');
    }
  }

  private async validateTenantQuotes(tenantId: string, quoteIds: string[]) {
    if (!quoteIds.length) {
      return;
    }

    const found = await this.prisma.quote.findMany({
      where: {
        tenantId,
        id: {
          in: quoteIds,
        },
      },
      select: { id: true },
    });

    if (found.length !== quoteIds.length) {
      throw new BadRequestException('Un ou plusieurs devis ne sont pas valides pour ce tenant.');
    }
  }

  private async validateTenantWorkOrders(tenantId: string, workOrderIds: string[]) {
    if (!workOrderIds.length) {
      return;
    }

    const found = await this.prisma.workOrder.findMany({
      where: {
        tenantId,
        id: {
          in: workOrderIds,
        },
      },
      select: { id: true },
    });

    if (found.length !== workOrderIds.length) {
      throw new BadRequestException('Un ou plusieurs chantiers ne sont pas valides pour ce tenant.');
    }
  }

  private buildCustomerLinks(customerIds: string[], primaryCustomerId?: string | null) {
    if (!customerIds.length) {
      return undefined;
    }

    const primaryId = primaryCustomerId?.trim() || '';

    return {
      create: customerIds.map((customerId) => ({
        customer: {
          connect: { id: customerId },
        },
        isPrimary: primaryId === customerId,
      })),
    };
  }

  async create(tenantId: string, dto: CreateProjectDto) {
    const customerIds = this.normalizeCustomerIds(dto.customerIds);
    const quoteIds = this.normalizeEntityIds(dto.quoteIds);
    const workOrderIds = this.normalizeEntityIds(dto.workOrderIds);
    const primaryCustomerId = dto.primaryCustomerId?.trim();

    if (primaryCustomerId && !customerIds.includes(primaryCustomerId)) {
      throw new BadRequestException('Le client principal doit faire partie des clients sélectionnés.');
    }

    await this.validateTenantCustomers(tenantId, customerIds);
    await this.validateTenantQuotes(tenantId, quoteIds);
    await this.validateTenantWorkOrders(tenantId, workOrderIds);

    for (let attempt = 0; attempt < ProjectService.PROJECT_REFERENCE_RETRY_LIMIT; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const generatedReference = await this.generateProjectReference(tx, tenantId);

            const data: Prisma.ProjectCreateInput = {
              tenant: {
                connect: { id: tenantId },
              },
              reference: generatedReference,
              title: dto.title.trim(),
              description: this.normalizeOptionalString(dto.description),
              status: dto.status || ProjectStatus.OPEN,
              notes: this.normalizeOptionalString(dto.notes),
              customers: this.buildCustomerLinks(customerIds, primaryCustomerId),
            };

            const createdProject = await tx.project.create({
              data,
              include: {
                customers: {
                  include: {
                    customer: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        company: true,
                      },
                    },
                  },
                },
                _count: {
                  select: {
                    quotes: true,
                    workOrders: true,
                    invoices: true,
                    calendarEvents: true,
                  },
                },
              },
            });

            if (quoteIds.length) {
              await tx.quote.updateMany({
                where: {
                  tenantId,
                  id: {
                    in: quoteIds,
                  },
                },
                data: {
                  projectId: createdProject.id,
                },
              });
            }

            if (workOrderIds.length) {
              await tx.workOrder.updateMany({
                where: {
                  tenantId,
                  id: {
                    in: workOrderIds,
                  },
                },
                data: {
                  projectId: createdProject.id,
                },
              });
            }

            return createdProject;
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error) {
        if (
          !this.isTransactionRetryable(error) ||
          attempt === ProjectService.PROJECT_REFERENCE_RETRY_LIMIT - 1
        ) {
          throw error;
        }
      }
    }

    throw new BadRequestException('Unable to generate project reference.');
  }

  async findAll(tenantId: string) {
    return this.prisma.project.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        customers: {
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                company: true,
              },
            },
          },
        },
        _count: {
          select: {
            quotes: true,
            workOrders: true,
            invoices: true,
            calendarEvents: true,
          },
        },
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, tenantId },
      include: {
        customers: {
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                company: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        quotes: {
          include: {
            items: {
              orderBy: {
                position: 'asc',
              },
            },
            workOrderAddress: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        workOrders: {
          select: {
            id: true,
            customerId: true,
            addressId: true,
            reference: true,
            title: true,
            description: true,
            status: true,
            plannedStartDate: true,
            plannedEndDate: true,
            createdAt: true,
            customer: {
              select: {
                firstName: true,
                lastName: true,
                company: true,
              },
            },
            address: {
              select: {
                street1: true,
                postalCode: true,
                city: true,
              },
            },
            items: {
              select: {
                id: true,
                position: true,
                type: true,
                title: true,
                description: true,
                quantity: true,
                unitCode: true,
                unitLabel: true,
                baseQuantity: true,
                baseQuantityUnitCode: true,
                unitPrice: true,
                unitCost: true,
                purchaseVatRate: true,
                vatRate: true,
              },
              orderBy: {
                position: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        invoices: {
          include: {
            items: {
              orderBy: {
                position: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        workLogs: {
          select: {
            id: true,
            date: true,
            title: true,
            description: true,
            timePlannedMinutes: true,
            timeSpentMinutes: true,
            items: {
              select: {
                id: true,
                title: true,
                description: true,
                quantity: true,
                unitCode: true,
                unitLabel: true,
                baseQuantity: true,
                baseQuantityUnitCode: true,
                unitCost: true,
                purchaseVatRate: true,
                totalCost: true,
                type: true,
              },
              orderBy: {
                position: 'asc',
              },
            },
          },
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Projet introuvable pour ce tenant.');
    }

    const mappedQuotes = project.quotes.map((quote) => {
      const { workOrderAddress, ...rest } = quote;
      return {
        ...rest,
        workOrderAddress: workOrderAddress?.street1 ?? undefined,
        workOrderPostalCode: workOrderAddress?.postalCode ?? undefined,
        workOrderCity: workOrderAddress?.city ?? undefined,
      };
    });

    return {
      ...project,
      quotes: mappedQuotes,
    };
  }

  async findProfitabilityOverview(tenantId: string) {
    const projects = await this.prisma.project.findMany({
      where: { tenantId, archivedAt: null },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(projects.map((project) => this.findProfitability(tenantId, project.id)));
  }

  async findProfitability(tenantId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        reference: true,
        title: true,
        status: true,
        customers: {
          where: { isPrimary: true },
          take: 1,
          select: { customer: { select: { firstName: true, lastName: true, company: true } } },
        },
        quotes: {
          where: { status: 'ACCEPTED' },
          select: { id: true, number: true, title: true, taxExclusiveAmount: true },
        },
        invoices: {
          where: { status: { in: ['ISSUED'] } },
          select: { id: true, number: true, status: true, paymentStatus: true, taxExclusiveAmount: true },
        },
        workOrders: {
          select: {
            id: true,
            reference: true,
            title: true,
            items: { select: { id: true, title: true, type: true, quantity: true, baseQuantity: true, unitCost: true } },
          },
        },
        workLogs: {
          select: {
            id: true,
            title: true,
            date: true,
            items: { select: { id: true, title: true, type: true, quantity: true, baseQuantity: true, unitCost: true, totalCost: true } },
          },
        },
        purchaseItems: {
          select: {
            id: true,
            title: true,
            quantity: true,
            effectiveCostAmount: true,
            purchase: { select: { id: true, label: true, purchaseDate: true } },
          },
        },
        companyExpenses: {
          select: { id: true, label: true, category: true, dueDate: true, taxExclusiveAmount: true },
        },
      },
    });

    if (!project) throw new NotFoundException('Projet introuvable pour ce tenant.');

    const toNumber = (value: unknown) => Number(value ?? 0);
    const customer = project.customers[0]?.customer;
    const customerName = customer
      ? [customer.company, customer.firstName, customer.lastName].filter(Boolean).join(' ')
      : null;
    const acceptedRevenue = project.quotes.reduce((sum, quote) => sum + toNumber(quote.taxExclusiveAmount), 0);
    const billedRevenue = project.invoices.reduce((sum, invoice) => sum + toNumber(invoice.taxExclusiveAmount), 0);
    const collectedRevenue = project.invoices
      .filter((invoice) => invoice.paymentStatus === 'PAID')
      .reduce((sum, invoice) => sum + toNumber(invoice.taxExclusiveAmount), 0);
    const plannedCost = project.workOrders.reduce(
      (sum, workOrder) => sum + workOrder.items.reduce((itemSum, item) => {
        const quantity = toNumber(item.quantity);
        const baseQuantity = toNumber(item.baseQuantity) || 1;
        return itemSum + (quantity / baseQuantity) * toNumber(item.unitCost);
      }, 0),
      0,
    );
    const workLogItems = project.workLogs.flatMap((workLog) => workLog.items.map((item) => ({ ...item, workLogId: workLog.id, workLogTitle: workLog.title, date: workLog.date })));
    const costOf = (types: string[]) => workLogItems
      .filter((item) => types.includes(item.type))
      .reduce((sum, item) => sum + toNumber(item.totalCost), 0);
    const laborConsumed = costOf(['LABOR']);
    const materialConsumed = costOf(['MATERIAL']);
    const workLogOtherConsumed = costOf(['TRAVEL', 'SERVICE', 'OTHER']);
    const companyExpenses = project.companyExpenses.reduce((sum, expense) => sum + toNumber(expense.taxExclusiveAmount), 0);
    const otherConsumed = workLogOtherConsumed + companyExpenses;
    const totalConsumed = laborConsumed + materialConsumed + otherConsumed;
    const assignedPurchases = project.purchaseItems.reduce((sum, item) => sum + toNumber(item.effectiveCostAmount), 0);
    const assignedPurchasesNotConsumed = Math.max(0, assignedPurchases - materialConsumed);
    const forecastRemaining = Math.max(0, plannedCost - totalConsumed);
    const realizedMargin = billedRevenue - totalConsumed;
    const realizedMarginRate = billedRevenue > 0 ? (realizedMargin / billedRevenue) * 100 : null;
    const forecastMargin = acceptedRevenue - totalConsumed - forecastRemaining;
    const progressPercent = acceptedRevenue > 0 ? Math.min(100, Math.max(0, (billedRevenue / acceptedRevenue) * 100)) : 0;

    return {
      project: { id: project.id, reference: project.reference, title: project.title, status: project.status, customerName },
      summary: {
        acceptedRevenue, billedRevenue, collectedRevenue, laborConsumed, materialConsumed, otherConsumed,
        totalConsumed, assignedPurchasesNotConsumed, forecastRemaining, realizedMargin, realizedMarginRate,
        forecastMargin, progressPercent,
      },
      details: {
        quotes: project.quotes,
        invoices: project.invoices,
        plannedItems: project.workOrders.flatMap((workOrder) => workOrder.items.map((item) => ({ ...item, workOrderId: workOrder.id, workOrderReference: workOrder.reference }))),
        workLogItems,
        companyExpenses: project.companyExpenses,
        purchaseItems: project.purchaseItems,
      },
    };
  }

  async associateQuote(tenantId: string, projectId: string, quoteId: string) {
    const [project, quote] = await Promise.all([
      this.prisma.project.findFirst({
        where: { id: projectId, tenantId },
        select: { id: true },
      }),
      this.prisma.quote.findFirst({
        where: { id: quoteId, tenantId },
        select: { id: true },
      }),
    ]);

    if (!project) {
      throw new NotFoundException('Projet introuvable pour ce tenant.');
    }

    if (!quote) {
      throw new NotFoundException('Devis introuvable pour ce tenant.');
    }

    await this.prisma.quote.update({
      where: { id: quote.id },
      data: { projectId: project.id },
    });

    return this.findOne(tenantId, project.id);
  }

  async associateCustomer(tenantId: string, projectId: string, customerId: string) {
    const [project, customer] = await Promise.all([
      this.prisma.project.findFirst({ where: { id: projectId, tenantId }, select: { id: true } }),
      this.prisma.customer.findFirst({ where: { id: customerId, tenantId }, select: { id: true } }),
    ]);

    if (!project) throw new NotFoundException('Projet introuvable pour ce tenant.');
    if (!customer) throw new NotFoundException('Client introuvable pour ce tenant.');

    const existingLink = await this.prisma.projectCustomer.findUnique({
      where: { projectId_customerId: { projectId: project.id, customerId: customer.id } },
      select: { projectId: true, customerId: true },
    });

    if (!existingLink) {
      await this.prisma.projectCustomer.create({
        data: { projectId: project.id, customerId: customer.id, isPrimary: false },
      });
    }

    return this.findOne(tenantId, project.id);
  }

  async disassociateCustomer(tenantId: string, projectId: string, customerId: string) {
    const link = await this.prisma.projectCustomer.findFirst({
      where: { projectId, customerId, project: { tenantId } },
      select: { projectId: true, customerId: true },
    });

    if (!link) throw new NotFoundException('Client associé introuvable pour ce projet.');

    await this.prisma.projectCustomer.delete({
      where: { projectId_customerId: { projectId: link.projectId, customerId: link.customerId } },
    });

    return this.findOne(tenantId, projectId);
  }

  async disassociateQuote(tenantId: string, projectId: string, quoteId: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id: quoteId, tenantId, projectId },
      select: { id: true },
    });

    if (!quote) {
      throw new NotFoundException('Devis associé introuvable pour ce projet.');
    }

    await this.prisma.quote.update({
      where: { id: quote.id },
      data: { projectId: null },
    });

    return this.findOne(tenantId, projectId);
  }

  async associateInvoice(tenantId: string, projectId: string, invoiceId: string) {
    const [project, invoice] = await Promise.all([
      this.prisma.project.findFirst({
        where: { id: projectId, tenantId },
        select: { id: true },
      }),
      this.prisma.invoice.findFirst({
        where: { id: invoiceId, tenantId },
        select: { id: true },
      }),
    ]);

    if (!project) {
      throw new NotFoundException('Projet introuvable pour ce tenant.');
    }

    if (!invoice) {
      throw new NotFoundException('Facture introuvable pour ce tenant.');
    }

    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { projectId: project.id },
    });

    return this.findOne(tenantId, project.id);
  }

  async disassociateInvoice(tenantId: string, projectId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId, projectId },
      select: { id: true },
    });

    if (!invoice) {
      throw new NotFoundException('Facture associée introuvable pour ce projet.');
    }

    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { projectId: null },
    });

    return this.findOne(tenantId, projectId);
  }

  async associateWorkOrder(tenantId: string, projectId: string, workOrderId: string) {
    const [project, workOrder] = await Promise.all([
      this.prisma.project.findFirst({
        where: { id: projectId, tenantId },
        select: { id: true },
      }),
      this.prisma.workOrder.findFirst({
        where: { id: workOrderId, tenantId },
        select: { id: true },
      }),
    ]);

    if (!project) {
      throw new NotFoundException('Projet introuvable pour ce tenant.');
    }

    if (!workOrder) {
      throw new NotFoundException('Chantier introuvable pour ce tenant.');
    }

    await this.prisma.workOrder.update({
      where: { id: workOrder.id },
      data: { projectId: project.id },
    });

    return this.findOne(tenantId, project.id);
  }

  async disassociateWorkOrder(tenantId: string, projectId: string, workOrderId: string) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, tenantId, projectId },
      select: { id: true },
    });

    if (!workOrder) throw new NotFoundException('Chantier associé introuvable pour ce projet.');

    await this.prisma.workOrder.update({ where: { id: workOrder.id }, data: { projectId: null } });
    return this.findOne(tenantId, projectId);
  }

  async disassociateCalendarEvent(tenantId: string, projectId: string, eventId: string) {
    const event = await this.prisma.calendarEvent.findFirst({
      where: { id: eventId, tenantId, projectId },
      select: { id: true },
    });

    if (!event) throw new NotFoundException('Événement associé introuvable pour ce projet.');

    await this.prisma.calendarEvent.update({ where: { id: event.id }, data: { projectId: null } });
    return this.findOne(tenantId, projectId);
  }

  async update(tenantId: string, id: string, dto: Partial<CreateProjectDto>) {
    const customerIds = dto.customerIds ? this.normalizeCustomerIds(dto.customerIds) : undefined;
    const quoteIds = dto.quoteIds ? this.normalizeEntityIds(dto.quoteIds) : undefined;
    const workOrderIds = dto.workOrderIds ? this.normalizeEntityIds(dto.workOrderIds) : undefined;
    const primaryCustomerId = dto.primaryCustomerId?.trim();

    if (customerIds && primaryCustomerId && !customerIds.includes(primaryCustomerId)) {
      throw new BadRequestException('Le client principal doit faire partie des clients sélectionnés.');
    }

    if (customerIds) {
      await this.validateTenantCustomers(tenantId, customerIds);
    }

    if (quoteIds) {
      await this.validateTenantQuotes(tenantId, quoteIds);
    }

    if (workOrderIds) {
      await this.validateTenantWorkOrders(tenantId, workOrderIds);
    }

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.project.updateMany({
        where: { id, tenantId },
        data: {
          reference: dto.reference?.trim(),
          title: dto.title?.trim(),
          description:
            dto.description !== undefined ? this.normalizeOptionalString(dto.description) : undefined,
          status: dto.status,
          notes: dto.notes !== undefined ? this.normalizeOptionalString(dto.notes) : undefined,
        },
      });

      if (!updated.count) {
        throw new NotFoundException('Projet introuvable pour ce tenant.');
      }

      if (customerIds) {
        await tx.projectCustomer.deleteMany({ where: { projectId: id } });

        if (customerIds.length) {
          await tx.projectCustomer.createMany({
            data: customerIds.map((customerId) => ({
              projectId: id,
              customerId,
              isPrimary: primaryCustomerId === customerId,
            })),
          });
        }
      }

      if (quoteIds) {
        await tx.quote.updateMany({
          where: {
            tenantId,
            projectId: id,
            id: {
              notIn: quoteIds,
            },
          },
          data: {
            projectId: null,
          },
        });

        if (quoteIds.length) {
          await tx.quote.updateMany({
            where: {
              tenantId,
              id: {
                in: quoteIds,
              },
            },
            data: {
              projectId: id,
            },
          });
        }
      }

      if (workOrderIds) {
        await tx.workOrder.updateMany({
          where: {
            tenantId,
            projectId: id,
            id: {
              notIn: workOrderIds,
            },
          },
          data: {
            projectId: null,
          },
        });

        if (workOrderIds.length) {
          await tx.workOrder.updateMany({
            where: {
              tenantId,
              id: {
                in: workOrderIds,
              },
            },
            data: {
              projectId: id,
            },
          });
        }
      }
    });

    return this.findOne(tenantId, id);
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.project.deleteMany({
      where: { id, tenantId },
    });
  }
}
