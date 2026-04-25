import { ApiProperty } from '@nestjs/swagger';

export class UploadProjectImageDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
  })
  file: unknown;
}
