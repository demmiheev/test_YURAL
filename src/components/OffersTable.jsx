import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchOffers } from '../store/searchSlice'
import ErrorAlert from './ErrorAlert'
import Loader from './Loader'

const PAGE_SIZE = 100

const priceFormat = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' })

const formatPrice = (price) => (price == null ? '—' : priceFormat.format(price))

function formatDate(date) {
  const match = /^\d{4}-(\d{2})-(\d{2})/.exec(date)
  return match ? `${match[2]}.${match[1]}` : '—'
}

export default function OffersTable() {
  const dispatch = useDispatch()
  const selected = useSelector((state) => state.search.selected)
  const offers = useSelector((state) => state.search.offers)
  const hasBrands = useSelector((state) => state.search.brands.items.length > 0)

  if (!selected) {
    if (!hasBrands) return null
    return (
      <div className="text-secondary text-center py-5 border rounded">
        Выберите производителя, чтобы увидеть предложения и аналоги
      </div>
    )
  }

  const originals = offers.items.filter((offer) => offer.isOriginal)
  const analogues = offers.items.filter((offer) => !offer.isOriginal)

  return (
    <>
      <h2 className="h5 mb-3">
        Предложения{' '}
        <span className="text-secondary">
          {selected.brand} {selected.number}
        </span>
      </h2>
      {offers.status === 'loading' && <Loader text="Загружаем предложения и аналоги…" />}
      {offers.status === 'failed' && (
        <ErrorAlert message={offers.error} onRetry={() => dispatch(fetchOffers(selected))} />
      )}
      {offers.status === 'succeeded' &&
        (originals.length === 0 ? (
          <div className="alert alert-secondary">Предложений не найдено.</div>
        ) : (
          <>
            <OffersGrid offers={originals} />
            <h2 className="h5 mt-4 mb-3">Аналоги</h2>
            {analogues.length === 0 ? (
              <div className="alert alert-secondary">Аналоги не найдены.</div>
            ) : (
              <AnaloguesList key={offers.requestId} items={analogues} />
            )}
          </>
        ))}
    </>
  )
}

function AnaloguesList({ items }) {
  const [inStockOnly, setInStockOnly] = useState(true)
  const [limit, setLimit] = useState(PAGE_SIZE)

  const filtered = inStockOnly ? items.filter((offer) => offer.stock > 0) : items
  const visible = filtered.slice(0, limit)

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
        <div className="form-check">
          <input
            id="in-stock-only"
            type="checkbox"
            className="form-check-input"
            checked={inStockOnly}
            onChange={(event) => setInStockOnly(event.target.checked)}
          />
          <label htmlFor="in-stock-only" className="form-check-label">
            Только в наличии
          </label>
        </div>
        <span className="text-secondary small">
          Показано {visible.length} из {filtered.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="alert alert-secondary">
          Нет аналогов в наличии. Снимите фильтр, чтобы увидеть все позиции.
        </div>
      ) : (
        <OffersGrid offers={visible} />
      )}

      {visible.length < filtered.length && (
        <div className="text-center">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => setLimit(limit + PAGE_SIZE)}
          >
            Показать ещё
          </button>
        </div>
      )}
    </>
  )
}

function OffersGrid({ offers }) {
  return (
    <div className="table-responsive">
      <table className="table table-sm table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th>Производитель</th>
            <th>Номер</th>
            <th>Наименование</th>
            <th>Склад</th>
            <th>Отгрузка</th>
            <th className="text-end">Остаток</th>
            <th className="text-end">Цена</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer) => (
            <tr key={offer.id}>
              <td className="fw-semibold text-nowrap">{offer.brand}</td>
              <td className="text-nowrap">{offer.number}</td>
              <td>{offer.name}</td>
              <td className="text-nowrap">{offer.warehouse || '—'}</td>
              <td>{formatDate(offer.shipmentDate)}</td>
              <td className={`text-end ${offer.stock > 0 ? '' : 'text-secondary'}`}>
                {offer.stock} шт.
              </td>
              <td className="text-end text-nowrap fw-semibold">{formatPrice(offer.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
