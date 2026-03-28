export type FieldRule<TValues> = (
  value: unknown,
  values: TValues
) => string | null;

export type FormRule<TValues> = (values: TValues) => string | null;

export type FieldErrors<TValues> = Partial<Record<keyof TValues, string>>;

export type ValidationResult<TValues> = {
  valid: boolean;
  fieldErrors: FieldErrors<TValues>;
  formErrors: string[];
};

export type FormSchema<TValues> = {
  fields?: Partial<Record<keyof TValues, FieldRule<TValues>[]>>;
  formRules?: FormRule<TValues>[];
};
