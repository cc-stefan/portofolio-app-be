import { InquiryStatus } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { InquiriesService } from './inquiries.service';

describe('InquiriesService', () => {
  let service: InquiriesService;
  const prismaService = {
    inquiry: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InquiriesService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get(InquiriesService);
  });

  it('creates an inquiry and returns the receipt payload expected by the frontend', async () => {
    prismaService.inquiry.create.mockResolvedValue({
      id: '4655853c-01a8-46f7-a685-cd45e6b2f3bd',
      name: 'Jane Doe',
      email: 'jane@example.com',
      message:
        'I would like to discuss a backend-focused role and a potential contract engagement.',
      createdAt: new Date('2026-04-30T10:30:00.000Z'),
      updatedAt: new Date('2026-04-30T10:30:00.000Z'),
    });

    const result = await service.create({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message:
        'I would like to discuss a backend-focused role and a potential contract engagement.',
    });

    expect(prismaService.inquiry.create).toHaveBeenCalledWith({
      data: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        message:
          'I would like to discuss a backend-focused role and a potential contract engagement.',
      },
    });
    expect(result).toEqual({
      id: '4655853c-01a8-46f7-a685-cd45e6b2f3bd',
      receivedAt: '2026-04-30T10:30:00.000Z',
    });
  });

  it('lists admin inquiries by status priority and newest first within each status group', async () => {
    prismaService.inquiry.findMany.mockResolvedValue([]);

    await service.findAllAdmin();

    expect(prismaService.inquiry.findMany).toHaveBeenCalledWith({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  });

  it('throws when an admin inquiry lookup misses', async () => {
    prismaService.inquiry.findUnique.mockResolvedValue(null);

    await expect(
      service.findOneAdmin('4655853c-01a8-46f7-a685-cd45e6b2f3bd'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates inquiry admin state and clears notes when given an empty string', async () => {
    const existingInquiry = {
      id: '4655853c-01a8-46f7-a685-cd45e6b2f3bd',
      name: 'Jane Doe',
      email: 'jane@example.com',
      message:
        'I would like to discuss a backend-focused role and a potential contract engagement.',
      status: InquiryStatus.NEW,
      isRead: false,
      adminNotes: 'Old note',
      createdAt: new Date('2026-04-30T10:30:00.000Z'),
      updatedAt: new Date('2026-04-30T10:30:00.000Z'),
    };
    const updatedInquiry = {
      ...existingInquiry,
      status: InquiryStatus.IN_REVIEW,
      isRead: true,
      adminNotes: null,
    };

    prismaService.inquiry.findUnique.mockResolvedValue(existingInquiry);
    prismaService.inquiry.update.mockResolvedValue(updatedInquiry);

    const result = await service.updateAdmin(existingInquiry.id, {
      status: InquiryStatus.IN_REVIEW,
      isRead: true,
      adminNotes: '',
    });

    expect(prismaService.inquiry.update).toHaveBeenCalledWith({
      where: {
        id: existingInquiry.id,
      },
      data: {
        status: InquiryStatus.IN_REVIEW,
        isRead: true,
        adminNotes: null,
      },
    });
    expect(result).toEqual(updatedInquiry);
  });

  it('deletes an inquiry after confirming it exists', async () => {
    const existingInquiry = {
      id: '4655853c-01a8-46f7-a685-cd45e6b2f3bd',
      name: 'Jane Doe',
      email: 'jane@example.com',
      message:
        'I would like to discuss a backend-focused role and a potential contract engagement.',
      status: InquiryStatus.NEW,
      isRead: false,
      adminNotes: null,
      createdAt: new Date('2026-04-30T10:30:00.000Z'),
      updatedAt: new Date('2026-04-30T10:30:00.000Z'),
    };

    prismaService.inquiry.findUnique.mockResolvedValue(existingInquiry);
    prismaService.inquiry.delete.mockResolvedValue(existingInquiry);

    await service.removeAdmin(existingInquiry.id);

    expect(prismaService.inquiry.delete).toHaveBeenCalledWith({
      where: {
        id: existingInquiry.id,
      },
    });
  });
});
