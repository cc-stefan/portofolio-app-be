import { UserRole } from '@prisma/client';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminDashboardOverviewDto } from './dto/admin-dashboard-response.dto';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('admin')
@Roles(UserRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOkResponse({ type: AdminDashboardOverviewDto })
  getDashboardOverview() {
    return this.adminService.getDashboardOverview();
  }
}
