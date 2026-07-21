import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, Logger } from '@nestjs/common';
import { CustomerService  } from './customer.service';
import { CreateCustomerDto } from './create-customer.dto'
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import { requireTenantContext, type AuthenticatedRequest } from '../common/types/auth-request';

@Controller('customers')
export class CustomerController {
  private readonly logger = new Logger(CustomerController.name);
  private readonly isDebugEnabled = process.env.NODE_ENV !== 'production';

  constructor(private customerService: CustomerService) {}

  private debug(message: string) {
    if (this.isDebugEnabled) {
      this.logger.debug(message);
    }
  }

  @Post()
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateCustomerDto) {
    const context = requireTenantContext(req);
    const tenantId = context.tenant.id;
    this.debug(`Creating customer for tenantId=${tenantId}`);
    return this.customerService.create(tenantId, dto, context.user );
  }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    const tenantId = requireTenantContext(req).tenant.id;
    this.debug(`Listing customers for tenantId=${tenantId}`);
    const result = this.customerService.findAll(tenantId);
    return result;
  }

  @Get(':id')
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = requireTenantContext(req).tenant.id;
    this.debug(`Getting customer id=${id} for tenantId=${tenantId}`);
    return this.customerService.findOne(tenantId, id);
  }

  @Put(':id')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: Partial<CreateCustomerDto>) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.customerService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @UseGuards(new RequireRoleGuard(['OWNER']))
  async delete(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.customerService.delete(tenantId, id);
  }
}
