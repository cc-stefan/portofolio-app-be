import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ProjectLocaleQueryDto } from './dto/project-query.dto';
import { PublicProjectResponseDto } from './dto/project-response.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOkResponse({ type: PublicProjectResponseDto, isArray: true })
  findAllPublished(@Query() query: ProjectLocaleQueryDto) {
    return this.projectsService.findAllPublished(query.locale);
  }

  @Get(':slug')
  @ApiOkResponse({ type: PublicProjectResponseDto })
  findPublishedBySlug(
    @Param('slug') slug: string,
    @Query() query: ProjectLocaleQueryDto,
  ) {
    return this.projectsService.findPublishedBySlug(slug, query.locale);
  }
}
