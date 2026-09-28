import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import {
  BadRequestException,
} from '@nestjs/common';
import {
  requireTenantContext,
  type AuthenticatedRequest,
} from '../common/types/auth-request';
import { CreateQuoteDto } from './create-quote.dto';
import { QuoteService } from './quote.service';
import { AddDepositDto } from './add-deposit.dto';
import { InvoiceService } from '../invoice/invoice.service';
import { EmailService } from '../email/email.service';
import { EmailDocumentType } from '@prisma/client';

@Controller('quotes')
export class QuoteController {
  constructor(private quoteService: QuoteService, private invoiceService: InvoiceService, private emailService: EmailService) {}

  @Post()
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateQuoteDto) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.quoteService.create(tenantId, dto);
  }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.quoteService.findAll(tenantId);
  }

  @Get('requiring-deposit')
  async findRequiringDeposit(@Req() req: AuthenticatedRequest) {
    return this.quoteService.findRequiringDeposit(requireTenantContext(req).tenant.id);
  }

  @Post(':id/deposit')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async addDeposit(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: AddDepositDto) {
    return this.invoiceService.addQuoteDeposit(requireTenantContext(req).tenant.id, id, dto);
  }

  @Get(':id')
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.quoteService.findOne(tenantId, id);
  }

  @Post(':id/send-email')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async sendEmail(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const quote = await this.quoteService.findOne(requireTenantContext(req).tenant.id, id);
    if (!quote.customerEmail) {
      throw new BadRequestException('Le client du devis n’a pas d’adresse email.');
    }
    const tenantId = requireTenantContext(req).tenant.id;
    const result = await this.emailService.sendQuote(tenantId, quote.customerEmail, {
      ...quote,
      number: quote.number,
      title: quote.title,
      customerName: quote.customerName,
      total: quote.taxInclusiveAmount,
      currency: quote.currency,
      validUntil: quote.validUntil,
      tenantName: quote.tenantLegalName,
    });
    return result;
  }

  @Get(':id/email-history')
  async emailHistory(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.emailService.listHistory(requireTenantContext(req).tenant.id, EmailDocumentType.QUOTE, id);
  }

  @Put(':id')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: Partial<CreateQuoteDto>,
  ) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.quoteService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @UseGuards(new RequireRoleGuard(['OWNER']))
  async delete(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.quoteService.delete(tenantId, id);
  }
}