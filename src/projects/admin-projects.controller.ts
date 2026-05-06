import { UserRole } from '@prisma/client';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiConsumes,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UploadedImageFile } from '../uploads/uploads.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { AdminProjectResponseDto } from './dto/project-response.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UploadProjectImageDto } from './dto/upload-project-image.dto';
import { ProjectsService } from './projects.service';
import {
  ALLOWED_PROJECT_IMAGE_MIME_TYPES,
  PROJECT_IMAGE_MAX_FILE_SIZE_BYTES,
} from '../uploads/uploads.config';

function projectImageFileFilter(
  _request: unknown,
  file: { mimetype?: string },
  callback: (error: Error | null, acceptFile: boolean) => void,
): void {
  if (file.mimetype && ALLOWED_PROJECT_IMAGE_MIME_TYPES.has(file.mimetype)) {
    callback(null, true);
    return;
  }

  callback(
    new BadRequestException(
      'Only JPEG, PNG, WEBP, GIF, and AVIF images are supported',
    ),
    false,
  );
}

@ApiTags('projects')
@Controller('admin/projects')
@Roles(UserRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiCreatedResponse({ type: AdminProjectResponseDto })
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  @ApiOkResponse({ type: AdminProjectResponseDto, isArray: true })
  findAll() {
    return this.projectsService.findAllAdmin();
  }

  @Get(':id')
  @ApiOkResponse({ type: AdminProjectResponseDto })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.projectsService.findOneAdmin(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: AdminProjectResponseDto })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Post(':id/image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: PROJECT_IMAGE_MAX_FILE_SIZE_BYTES,
      },
      fileFilter: projectImageFileFilter,
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadProjectImageDto })
  @ApiOkResponse({ type: AdminProjectResponseDto })
  uploadImage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file: UploadedImageFile | undefined,
  ) {
    return this.projectsService.uploadImage(id, file);
  }

  @Delete(':id/image')
  @ApiOkResponse({ type: AdminProjectResponseDto })
  removeImage(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.projectsService.removeImage(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.projectsService.remove(id);
  }
}
