import { UserRole } from '@prisma/client';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { InquiryResponseDto } from './dto/inquiry-response.dto';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';
import { InquiriesService } from './inquiries.service';

@ApiTags('inquiries')
@Controller('admin/inquiries')
@Roles(UserRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminInquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Get()
  @ApiOkResponse({ type: InquiryResponseDto, isArray: true })
  findAll() {
    return this.inquiriesService.findAllAdmin();
  }

  @Get(':id')
  @ApiOkResponse({ type: InquiryResponseDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.inquiriesService.findOneAdmin(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: InquiryResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateInquiryDto: UpdateInquiryDto,
  ) {
    return this.inquiriesService.updateAdmin(id, updateInquiryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.inquiriesService.removeAdmin(id);
  }
}
