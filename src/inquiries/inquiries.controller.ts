import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { InquiryReceiptResponseDto } from './dto/inquiry-receipt-response.dto';
import { InquiriesService } from './inquiries.service';

@ApiTags('inquiries')
@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Post()
  @ApiCreatedResponse({ type: InquiryReceiptResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation failed',
    schema: {
      example: {
        message: 'Validation failed',
        errors: [
          {
            path: ['email'],
            message: 'email must be an email',
          },
        ],
      },
    },
  })
  create(@Body() createInquiryDto: CreateInquiryDto) {
    return this.inquiriesService.create(createInquiryDto);
  }
}
