import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminProjectsController } from './admin-projects.controller';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { UploadsService } from '../uploads/uploads.service';

@Module({
  imports: [AuthModule],
  controllers: [ProjectsController, AdminProjectsController],
  providers: [ProjectsService, UploadsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
