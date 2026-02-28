import type { FieldErrors, FormSchema, ValidationResult } from './types.ts';

type FormValidatorApi<TValues> = {
  validate: (values: TValues) => ValidationResult<TValues>;
  validateField: <K extends keyof TValues>(
    field: K,
    values: TValues
  ) => string | null;
};

export function createFormValidator<TValues>(
  schema: FormSchema<TValues>
): FormValidatorApi<TValues> {
  const fieldRules = schema.fields ?? {};
  const formRules = schema.formRules ?? [];

  const validateField = <K extends keyof TValues>(
    field: K,
    values: TValues
  ): string | null => {
    const rules = fieldRules[field] ?? [];
    for (const rule of rules) {
      const error = rule(values[field], values);
      if (error) return error;
    }
    return null;
  };

  const validate = (values: TValues): ValidationResult<TValues> => {
    const fieldErrors: FieldErrors<TValues> = {};
    (Object.keys(fieldRules) as (keyof TValues)[]).forEach((field) => {
      const error = validateField(field, values);
      if (error) {
        fieldErrors[field] = error;
      }
    });

    const formErrors: string[] = [];
    formRules.forEach((rule) => {
      const error = rule(values);
      if (error) formErrors.push(error);
    });

    return {
      valid: Object.keys(fieldErrors).length === 0 && formErrors.length === 0,
      fieldErrors,
      formErrors,
    };
  };

  return { validate, validateField };
}
