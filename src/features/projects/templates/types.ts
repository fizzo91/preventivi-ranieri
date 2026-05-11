export type FieldType = "text" | "textarea" | "number" | "date" | "select"

export interface TemplateField {
  key: string
  label: string
  type: FieldType
  placeholder?: string
  options?: { value: string; label: string }[]
  rows?: number
  fullWidth?: boolean
}

export interface TemplateGroup {
  title: string
  description?: string
  fields: TemplateField[]
}

export interface TemplateSchema {
  groups: TemplateGroup[]
}
