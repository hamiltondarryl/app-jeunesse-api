import { ValidationError } from 'class-validator';

export function flattenValidationErrors(
  errors: ValidationError[],
  parent = '',
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const error of errors) {
    const path = parent ? `${parent}.${error.property}` : error.property;
    if (error.constraints) {
      result[path] = Object.values(error.constraints)[0];
    }
    if (error.children?.length) {
      Object.assign(result, flattenValidationErrors(error.children, path));
    }
  }

  return result;
}
