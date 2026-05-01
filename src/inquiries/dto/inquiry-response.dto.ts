import { InquiryStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InquiryResponseDto {
  @ApiProperty({
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    example: 'Jane Doe',
  })
  name: string;

  @ApiProperty({
    example: 'jane@example.com',
  })
  email: string;

  @ApiProperty({
    example:
      'I would like to discuss a backend-focused role and a potential contract engagement.',
  })
  message: string;

  @ApiProperty({
    enum: InquiryStatus,
    enumName: 'InquiryStatus',
  })
  status: InquiryStatus;

  @ApiProperty()
  isRead: boolean;

  @ApiPropertyOptional({
    nullable: true,
  })
  adminNotes?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
