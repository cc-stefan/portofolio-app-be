import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ProjectResponseDto } from './dto/project-response.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOkResponse({ type: ProjectResponseDto, isArray: true })
  findAllPublished() {
    return this.projectsService.findAllPublished();
  }

  @Get(':slug')
  @ApiOkResponse({ type: ProjectResponseDto })
  findPublishedBySlug(@Param('slug') slug: string) {
    return this.projectsService.findPublishedBySlug(slug);
  }
}
