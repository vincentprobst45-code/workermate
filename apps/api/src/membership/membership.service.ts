import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class MembershipService {
  constructor(private prisma: PrismaService) {}

  async findForUser(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      select: {
        tenantId: true,
        role: true,
        tenant: { select: { name: true } },
      },
      orderBy: { tenant: { name: 'asc' } },
    });

    return memberships.map((membership) => ({
      tenantId: membership.tenantId,
      tenantName: membership.tenant.name,
      role: membership.role,
    }));
  }
}
