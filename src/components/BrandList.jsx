import { useDispatch, useSelector } from 'react-redux'
import { fetchBrands, fetchOffers } from '../store/searchSlice'
import ErrorAlert from './ErrorAlert'
import Loader from './Loader'

export default function BrandList() {
  const dispatch = useDispatch()
  const query = useSelector((state) => state.search.query)
  const selected = useSelector((state) => state.search.selected)
  const brands = useSelector((state) => state.search.brands)

  if (brands.status === 'idle') return null
  if (brands.status === 'loading') return <Loader text="Ищем производителей…" />
  if (brands.status === 'failed') {
    return <ErrorAlert message={brands.error} onRetry={() => dispatch(fetchBrands(query))} />
  }
  if (brands.items.length === 0) {
    return (
      <div className="alert alert-secondary">
        По артикулу <strong>{query}</strong> ничего не найдено.
      </div>
    )
  }

  return (
    <>
      <h2 className="h6 text-secondary mb-2">
        Производители для «{query}» ({brands.items.length})
      </h2>
      <div className="list-group">
        {brands.items.map((item) => {
          const isActive = selected?.brand === item.brand && selected?.number === item.number
          return (
            <button
              key={item.id}
              type="button"
              className={`list-group-item list-group-item-action${isActive ? ' active' : ''}`}
              aria-current={isActive}
              onClick={() => {
                if (!isActive) dispatch(fetchOffers({ number: item.number, brand: item.brand }))
              }}
            >
              <div className="d-flex justify-content-between align-items-center gap-2">
                <strong>{item.brand}</strong>
                <span
                  className={`badge ${item.count > 0 ? 'text-bg-success' : 'text-bg-secondary'}`}
                >
                  {item.count > 0 ? `${item.count} шт.` : 'нет'}
                </span>
              </div>
              <div className="small">{item.number}</div>
              <div className={`small ${isActive ? '' : 'text-secondary'}`}>{item.name}</div>
            </button>
          )
        })}
      </div>
    </>
  )
}
