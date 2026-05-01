import { BadRequestException, ValidationError } from '@nestjs/common';

interface ValidationIssue {
  path: string[];
  message: string;
}

export function createValidationExceptionFactory() {
  return (errors: ValidationError[]) =>
    new BadRequestException({
      message: 'Validation failed',
      errors: flattenValidationErrors(errors),
    });
}

function flattenValidationErrors(
  errors: ValidationError[],
  parentPath: string[] = [],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const error of errors) {
    const path = [...parentPath, error.property];

    for (const message of Object.values(error.constraints ?? {})) {
      issues.push({
        path,
        message,
      });
    }

    if (error.children?.length) {
      issues.push(...flattenValidationErrors(error.children, path));
    }
  }

  return issues;
}
