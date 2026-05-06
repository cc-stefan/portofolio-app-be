import { Prisma } from '@prisma/client';

export const projectTranslationSelect = {
  locale: true,
  title: true,
  summary: true,
  description: true,
} satisfies Prisma.ProjectTranslationSelect;

export const projectWithTranslationsInclude = {
  translations: {
    select: projectTranslationSelect,
    orderBy: {
      locale: 'asc',
    },
  },
} satisfies Prisma.ProjectInclude;

export type ProjectTranslationRecord = Prisma.ProjectTranslationGetPayload<{
  select: typeof projectTranslationSelect;
}>;

export type ProjectWithTranslationsRecord = Prisma.ProjectGetPayload<{
  include: typeof projectWithTranslationsInclude;
}>;
