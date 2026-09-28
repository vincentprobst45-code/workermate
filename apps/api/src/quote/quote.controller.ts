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
  requireTenantContext,
  type AuthenticatedRequest,
} from '../common/types/auth-request';
import { CreateQuoteDto } from './create-quote.dto';
import { QuoteService } from './quote.service';
import { AddDepositDto } from './add-deposit.dto';
import { InvoiceService } from '../invoice/invoice.service';

@Controller('quotes')
export class QuoteController {
  constructor(private quoteService: QuoteService, private invoiceService: InvoiceService) {}

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