import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { CustomerService, CreateCustomerDto } from './customer.service';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import type { AuthenticatedRequest } from '../common/types/auth-request';

@Controller('customers')
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Post()
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateCustomerDto) {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║      [CustomerController] POST /customers START        ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log(`[Controller] req.user: ${req.user ? '✅ Present' : '❌ MISSING'}`);
    console.log(`[Controller] req.membership: ${req.membership ? '✅ Present (role: ' + req.membership.role + ')' : '❌ MISSING'}`);
    console.log(`[Controller] req.tenant: ${req.tenant ? '✅ Present (ID: ' + req.tenant.id + ')' : '❌ MISSING'}`);
    const tenantId = req.tenant?.id;
    console.log(`[Controller] Final tenantId to use: ${tenantId || 'UNDEFINED - WILL FAIL'}`);
    return this.customerService.create(tenantId, dto);
  }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║       [CustomerController] GET /customers START       ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log(`[Controller] req.user: ${req.user ? '✅ Present (email: ' + req.user.email + ')' : '❌ MISSING'}`);
    console.log(`[Controller] req.membership: ${req.membership ? '✅ Present (role: ' + req.membership.role + ')' : '❌ MISSING'}`);
    console.log(`[Controller] req.tenant: ${req.tenant ? '✅ Present (ID: ' + req.tenant.id + ')' : '❌ MISSING'}`);
    const tenantId = req.tenant?.id;
    console.log(`[Controller] Final tenantId to use: ${tenantId || 'UNDEFINED - WILL FAIL'}`);
    const result = this.customerService.findAll(tenantId);
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║       [CustomerController] GET /customers END         ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    return result;
  }

  @Get(':id')
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    console.log(`\n[CustomerController] GET /customers/${id}`);
    console.log(`[Controller] Tenant ID: ${req.tenant?.id}`);
    return this.customerService.findOne(req.tenant?.id ?? '', id);
  }

  @Put(':id')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: Partial<CreateCustomerDto>) {
    return this.customerService.update(req.tenant?.id ?? '', id, dto);
  }

  @Delete(':id')
  @UseGuards(new RequireRoleGuard(['OWNER']))
  async delete(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.customerService.delete(req.tenant?.id ?? '', id);
  }
}
