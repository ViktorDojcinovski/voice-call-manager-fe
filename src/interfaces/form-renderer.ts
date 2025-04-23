import * as z from "zod";
import { SubmitHandler, FieldValues } from "react-hook-form";

interface FieldOption {
  label: string;
  value: string | boolean;
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
  fullWidth?: boolean;
  onClick?: (data: any) => {};
}

interface Section {
  title?: string;
  fields: Field[];
}

interface FormSchema {
  title: string;
  sections: Section[];
}

interface FormRendererProps {
  schema: FormSchema;
  onSubmit?: SubmitHandler<FieldValues>;
  onNext?: (data: any) => void;
  onPrevious?: () => void;
}

export { FieldOption, Field, Section, FormSchema, FormRendererProps };
