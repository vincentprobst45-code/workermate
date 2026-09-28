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
import { CreateProjectDto } from './create-project.dto';
import { ProjectService } from './project.service';

@Controller('projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Post()
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateProjectDto) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.projectService.create(tenantId, dto);
  }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.projectService.findAll(tenantId);
  }

  @Get('profitability')
  async findProfitabilityOverview(@Req() req: AuthenticatedRequest) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.projectService.findProfitabilityOverview(tenantId);
  }

  @Get(':id/profitability')
  async findProfitability(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.projectService.findProfitability(tenantId, id);
  }

  @Get(':id')
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.projectService.findOne(tenantId, id);
  }

  @Post(':id/quotes/:quoteId')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async associateQuote(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('quoteId') quoteId: string,
  ) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.projectService.associateQuote(tenantId, id, quoteId);
  }

  @Post(':id/customers/:customerId')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async associateCustomer(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('customerId') customerId: string,
  ) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.projectService.associateCustomer(tenantId, id, customerId);
  }

  @Delete(':id/customers/:customerId')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async disassociateCustomer(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('customerId') customerId: string,
  ) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.projectService.disassociateCustomer(tenantId, id, customerId);
  }

  @Delete(':id/quotes/:quoteId')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async disassociateQuote(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('quoteId') quoteId: string,
  ) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.projectService.disassociateQuote(tenantId, id, quoteId);
  }

  @Post(':id/invoices/:invoiceId')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async associateInvoice(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.projectService.associateInvoice(tenantId, id, invoiceId);
  }

  @Delete(':id/invoices/:invoiceId')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async disassociateInvoice(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.projectService.disassociateInvoice(tenantId, id, invoiceId);
  }

  @Post(':id/work-orders/:workOrderId')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async associateWorkOrder(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('workOrderId') workOrderId: string,
  ) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.projectService.associateWorkOrder(tenantId, id, workOrderId);
  }

  @Delete(':id/work-orders/:workOrderId')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async disassociateWorkOrder(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('workOrderId') workOrderId: string,
  ) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.projectService.disassociateWorkOrder(tenantId, id, workOrderId);
  }

  @Delete(':id/calendar-events/:eventId')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async disassociateCalendarEvent(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('eventId') eventId: string,
  ) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.projectService.disassociateCalendarEvent(tenantId, id, eventId);
  }

  @Put(':id')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: Partial<CreateProjectDto>,
  ) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.projectService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @UseGuards(new RequireRoleGuard(['OWNER']))
  async delete(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.projectService.delete(tenantId, id);
  }
}
