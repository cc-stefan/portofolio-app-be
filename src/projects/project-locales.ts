export const supportedProjectLocales = ['en', 'ro'] as const;

export type ProjectLocale = (typeof supportedProjectLocales)[number];

export const defaultProjectLocale: ProjectLocale = 'en';
