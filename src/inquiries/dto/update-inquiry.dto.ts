import { InquiryStatus } from '@prisma/client';
import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

function trimOptionalString({ value }: TransformFnParams): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim();
}

export class UpdateInquiryDto {
  @ApiPropertyOptional({
    enum: InquiryStatus,
    enumName: 'InquiryStatus',
  })
  @IsOptional()
  @IsEnum(InquiryStatus)
  status?: InquiryStatus;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({
    example: 'Followed up and waiting for a reply.',
    nullable: true,
    maxLength: 5000,
  })
  @IsOptional()
  @Transform(trimOptionalString)
  @IsString()
  @MaxLength(5000)
  adminNotes?: string | null;
}
