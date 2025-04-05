import * as z from "zod";

interface FieldOption {
  label: string;
  value: string;
  nestedField?: Field;
}

interface Field {
  type: string;
  name?: string;
  label?: string;
  options?: FieldOption[];
  nestedField?: Field;
  action?: string;
  placeholder?: string;
}

interface Section {
  title: string;
  fields: Field[];
}

interface FormSchema {
  title: string;
  sections: Section[];
}

interface FormRendererProps {
  schema: FormSchema;
  onSubmit: (data: any) => void;
  validationSchema: z.ZodSchema<any>;
  defaultValues: any;
}

export { FieldOption, Field, Section, FormSchema, FormRendererProps };
