import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({
    example: 'portfolio-api',
  })
  service: string;

  @ApiProperty({
    example: 'ok',
  })
  status: string;
}
