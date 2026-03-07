import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2 } from "lucide-react"
import type { Product } from "@/hooks/useProducts"

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  isDeleting: boolean
}

export const ProductCard = ({ product, onEdit, onDelete, isDeleting }: ProductCardProps) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-lg">{product.name}</CardTitle>
          <Badge variant="secondary" className="mt-1">{product.category}</Badge>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => onEdit(product)}><Edit className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(product.id)} disabled={isDeleting}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">Prezzo:</span>
        <span className="font-semibold text-success">€ {product.price_dt.toFixed(2)} / {product.unit}</span>
      </div>
    </CardContent>
  </Card>
)
