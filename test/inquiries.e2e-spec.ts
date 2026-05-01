import { UserRole } from '@prisma/client';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { PrismaService } from '../src/prisma/prisma.service';
import { configureApp } from '../src/setup-app';

describe('InquiriesController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prismaService = app.get(PrismaService);
  });

  it('accepts a valid inquiry and returns the created receipt payload', async () => {
    jest.spyOn(prismaService.inquiry, 'create').mockResolvedValue({
      id: '4655853c-01a8-46f7-a685-cd45e6b2f3bd',
      name: 'Jane Doe',
      email: 'jane@example.com',
      message:
        'I would like to discuss a backend-focused role and a potential contract engagement.',
      createdAt: new Date('2026-04-30T10:30:00.000Z'),
      updatedAt: new Date('2026-04-30T10:30:00.000Z'),
    } as never);

    await request(app.getHttpServer())
      .post('/api/inquiries')
      .send({
        name: '  Jane Doe  ',
        email: '  jane@example.com  ',
        message:
          '  I would like to discuss a backend-focused role and a potential contract engagement.  ',
      })
      .expect(201)
      .expect({
        id: '4655853c-01a8-46f7-a685-cd45e6b2f3bd',
        receivedAt: '2026-04-30T10:30:00.000Z',
      });

    expect(prismaService.inquiry.create).toHaveBeenCalledWith({
      data: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        message:
          'I would like to discuss a backend-focused role and a potential contract engagement.',
      },
    });
  });

  it('returns field-level validation errors for invalid inquiry payloads', async () => {
    await request(app.getHttpServer())
      .post('/api/inquiries')
      .send({
        name: 'A',
        email: 'not-an-email',
        message: 'too short',
        extra: 'should be rejected',
      })
      .expect(400)
      .expect({
        message: 'Validation failed',
        errors: [
          {
            path: ['extra'],
            message: 'property extra should not exist',
          },
          {
            path: ['name'],
            message: 'name must be longer than or equal to 2 characters',
          },
          {
            path: ['email'],
            message: 'email must be an email',
          },
          {
            path: ['message'],
            message: 'message must be longer than or equal to 24 characters',
          },
        ],
      });
  });

  afterEach(async () => {
    await app.close();
  });
});

describe('AdminInquiriesController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: {
          switchToHttp(): {
            getRequest(): {
              user?: {
                sub: string;
                email: string;
                role: UserRole;
              };
            };
          };
        }) {
          context.switchToHttp().getRequest().user = {
            sub: 'admin-id',
            email: 'admin@example.com',
            role: UserRole.ADMIN,
          };

          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prismaService = app.get(PrismaService);
  });

  it('lists inquiries for the admin inbox using status-priority ordering', async () => {
    jest.spyOn(prismaService.inquiry, 'findMany').mockResolvedValue([
      {
        id: '4655853c-01a8-46f7-a685-cd45e6b2f3bd',
        name: 'Jane Doe',
        email: 'jane@example.com',
        message:
          'I would like to discuss a backend-focused role and a potential contract engagement.',
        status: 'NEW',
        isRead: false,
        adminNotes: null,
        createdAt: new Date('2026-04-30T10:30:00.000Z'),
        updatedAt: new Date('2026-04-30T10:30:00.000Z'),
      },
    ] as never);

    await request(app.getHttpServer())
      .get('/api/admin/inquiries')
      .expect(200)
      .expect([
        {
          id: '4655853c-01a8-46f7-a685-cd45e6b2f3bd',
          name: 'Jane Doe',
          email: 'jane@example.com',
          message:
            'I would like to discuss a backend-focused role and a potential contract engagement.',
          status: 'NEW',
          isRead: false,
          adminNotes: null,
          createdAt: '2026-04-30T10:30:00.000Z',
          updatedAt: '2026-04-30T10:30:00.000Z',
        },
      ]);

    expect(prismaService.inquiry.findMany).toHaveBeenCalledWith({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  });

  it('returns a single inquiry for the admin detail view', async () => {
    jest.spyOn(prismaService.inquiry, 'findUnique').mockResolvedValue({
      id: '4655853c-01a8-46f7-a685-cd45e6b2f3bd',
      name: 'Jane Doe',
      email: 'jane@example.com',
      message:
        'I would like to discuss a backend-focused role and a potential contract engagement.',
      status: 'IN_REVIEW',
      isRead: true,
      adminNotes: 'Sent a reply.',
      createdAt: new Date('2026-04-30T10:30:00.000Z'),
      updatedAt: new Date('2026-04-30T11:00:00.000Z'),
    } as never);

    await request(app.getHttpServer())
      .get('/api/admin/inquiries/4655853c-01a8-46f7-a685-cd45e6b2f3bd')
      .expect(200)
      .expect({
        id: '4655853c-01a8-46f7-a685-cd45e6b2f3bd',
        name: 'Jane Doe',
        email: 'jane@example.com',
        message:
          'I would like to discuss a backend-focused role and a potential contract engagement.',
        status: 'IN_REVIEW',
        isRead: true,
        adminNotes: 'Sent a reply.',
        createdAt: '2026-04-30T10:30:00.000Z',
        updatedAt: '2026-04-30T11:00:00.000Z',
      });
  });

  it('updates inquiry status, read state, and notes for the admin inbox', async () => {
    jest
      .spyOn(prismaService.inquiry, 'findUnique')
      .mockResolvedValueOnce({
        id: '4655853c-01a8-46f7-a685-cd45e6b2f3bd',
        name: 'Jane Doe',
        email: 'jane@example.com',
        message:
          'I would like to discuss a backend-focused role and a potential contract engagement.',
        status: 'NEW',
        isRead: false,
        adminNotes: null,
        createdAt: new Date('2026-04-30T10:30:00.000Z'),
        updatedAt: new Date('2026-04-30T10:30:00.000Z'),
      } as never);
    jest.spyOn(prismaService.inquiry, 'update').mockResolvedValue({
      id: '4655853c-01a8-46f7-a685-cd45e6b2f3bd',
      name: 'Jane Doe',
      email: 'jane@example.com',
      message:
        'I would like to discuss a backend-focused role and a potential contract engagement.',
      status: 'RESOLVED',
      isRead: true,
      adminNotes: 'Closed after a follow-up call.',
      createdAt: new Date('2026-04-30T10:30:00.000Z'),
      updatedAt: new Date('2026-04-30T12:00:00.000Z'),
    } as never);

    await request(app.getHttpServer())
      .patch('/api/admin/inquiries/4655853c-01a8-46f7-a685-cd45e6b2f3bd')
      .send({
        status: 'RESOLVED',
        isRead: true,
        adminNotes: '  Closed after a follow-up call.  ',
      })
      .expect(200)
      .expect({
        id: '4655853c-01a8-46f7-a685-cd45e6b2f3bd',
        name: 'Jane Doe',
        email: 'jane@example.com',
        message:
          'I would like to discuss a backend-focused role and a potential contract engagement.',
        status: 'RESOLVED',
        isRead: true,
        adminNotes: 'Closed after a follow-up call.',
        createdAt: '2026-04-30T10:30:00.000Z',
        updatedAt: '2026-04-30T12:00:00.000Z',
      });

    expect(prismaService.inquiry.update).toHaveBeenCalledWith({
      where: {
        id: '4655853c-01a8-46f7-a685-cd45e6b2f3bd',
      },
      data: {
        status: 'RESOLVED',
        isRead: true,
        adminNotes: 'Closed after a follow-up call.',
      },
    });
  });

  it('deletes an inquiry from the admin inbox', async () => {
    jest
      .spyOn(prismaService.inquiry, 'findUnique')
      .mockResolvedValueOnce({
        id: '4655853c-01a8-46f7-a685-cd45e6b2f3bd',
        name: 'Jane Doe',
        email: 'jane@example.com',
        message:
          'I would like to discuss a backend-focused role and a potential contract engagement.',
        status: 'ARCHIVED',
        isRead: true,
        adminNotes: null,
        createdAt: new Date('2026-04-30T10:30:00.000Z'),
        updatedAt: new Date('2026-04-30T10:30:00.000Z'),
      } as never);
    jest.spyOn(prismaService.inquiry, 'delete').mockResolvedValue({
      id: '4655853c-01a8-46f7-a685-cd45e6b2f3bd',
      name: 'Jane Doe',
      email: 'jane@example.com',
      message:
        'I would like to discuss a backend-focused role and a potential contract engagement.',
      status: 'ARCHIVED',
      isRead: true,
      adminNotes: null,
      createdAt: new Date('2026-04-30T10:30:00.000Z'),
      updatedAt: new Date('2026-04-30T10:30:00.000Z'),
    } as never);

    await request(app.getHttpServer())
      .delete('/api/admin/inquiries/4655853c-01a8-46f7-a685-cd45e6b2f3bd')
      .expect(204);
  });

  it('returns field-level validation errors for invalid admin updates', async () => {
    await request(app.getHttpServer())
      .patch('/api/admin/inquiries/4655853c-01a8-46f7-a685-cd45e6b2f3bd')
      .send({
        status: 'DONE',
        adminNotes: 'x'.repeat(5001),
      })
      .expect(400)
      .expect({
        message: 'Validation failed',
        errors: [
          {
            path: ['status'],
            message:
              'status must be one of the following values: NEW, IN_REVIEW, RESOLVED, ARCHIVED',
          },
          {
            path: ['adminNotes'],
            message:
              'adminNotes must be shorter than or equal to 5000 characters',
          },
        ],
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
