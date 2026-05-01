import { ApiProperty } from '@nestjs/swagger';

export class InquiryReceiptResponseDto {
  @ApiProperty({
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    example: '2026-04-30T12:00:00.000Z',
    format: 'date-time',
  })
  receivedAt: string;
}
