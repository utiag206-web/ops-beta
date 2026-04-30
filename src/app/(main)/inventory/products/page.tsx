import { getProducts } from '../actions'
import { ProductsList } from '@/components/inventory/products-list'

export const dynamic = 'force-dynamic'

export default async function ProductsCatalogPage() {
  const { data, error } = await getProducts()

  if (error) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-100 rounded-[2rem] text-rose-700">
        <p className="font-black">Error al cargar el catálogo:</p>
        <p className="text-sm font-medium">{error}</p>
      </div>
    )
  }

  return <ProductsList initialProducts={data || []} />
}
