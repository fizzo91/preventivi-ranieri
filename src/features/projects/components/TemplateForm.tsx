import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { TemplateField, TemplateSchema } from "../templates/types"

interface Props {
  schema: TemplateSchema
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}

export const TemplateForm = ({ schema, value, onChange }: Props) => {
  const setField = (key: string, v: unknown) => onChange({ ...value, [key]: v })

  const renderField = (field: TemplateField) => {
    const v = (value[field.key] ?? "") as string
    const id = `tf-${field.key}`
    const common = { id, placeholder: field.placeholder }

    let control: React.ReactNode
    switch (field.type) {
      case "textarea":
        control = (
          <Textarea
            {...common}
            value={v}
            rows={field.rows ?? 3}
            onChange={(e) => setField(field.key, e.target.value)}
          />
        )
        break
      case "number":
        control = (
          <Input
            {...common}
            type="number"
            value={v}
            onChange={(e) => setField(field.key, e.target.value)}
          />
        )
        break
      case "date":
        control = (
          <Input
            {...common}
            type="date"
            value={v}
            onChange={(e) => setField(field.key, e.target.value)}
          />
        )
        break
      case "select":
        control = (
          <Select value={v} onValueChange={(val) => setField(field.key, val)}>
            <SelectTrigger id={id}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
        break
      default:
        control = (
          <Input
            {...common}
            type="text"
            value={v}
            onChange={(e) => setField(field.key, e.target.value)}
          />
        )
    }

    return (
      <div
        key={field.key}
        className={field.fullWidth ? "md:col-span-2 space-y-2" : "space-y-2"}
      >
        <Label htmlFor={id}>{field.label}</Label>
        {control}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {schema.groups.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle className="text-lg">{group.title}</CardTitle>
            {group.description && <CardDescription>{group.description}</CardDescription>}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.fields.map(renderField)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
