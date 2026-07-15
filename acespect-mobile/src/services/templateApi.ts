import { api } from './apiClient';

export type TemplateFieldType = 'text' | 'date' | 'select-tiles' | 'yesno';

export interface TemplateFieldOption {
  value: string;
  label: string;
  icon?: string;
}

export interface TemplateField {
  key: string;
  label: string;
  type: TemplateFieldType;
  order: number;
  required?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  options?: TemplateFieldOption[];
}

export interface ActiveTemplate {
  id: string;
  sectionKey: string;
  version: number;
  fields: TemplateField[];
}

/** The current published template for a section, e.g. "job-info". */
export async function getActiveTemplate(sectionKey: string): Promise<ActiveTemplate> {
  const { data } = await api.get<{ template: ActiveTemplate }>(`/templates/active/${sectionKey}`);
  return data.template;
}
