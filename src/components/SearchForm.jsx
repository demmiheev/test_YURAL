import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBrands } from '../store/searchSlice'

const MIN_LENGTH = 3
const DEBOUNCE_MS = 400

export default function SearchForm() {
  const dispatch = useDispatch()
  const query = useSelector((state) => state.search.query)
  const isLoading = useSelector((state) => state.search.brands.status === 'loading')
  const [number, setNumber] = useState('')

  const trimmed = number.trim()
  const canSearch = trimmed.length >= MIN_LENGTH

  useEffect(() => {
    if (!canSearch || trimmed === query) return
    const timer = setTimeout(() => dispatch(fetchBrands(trimmed)), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [trimmed, canSearch, query, dispatch])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (canSearch) dispatch(fetchBrands(trimmed))
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="d-flex gap-2">
        <input
          type="search"
          className="form-control form-control-lg"
          placeholder="Артикул детали, например 01089"
          aria-label="Артикул детали"
          aria-describedby="search-hint"
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          autoFocus
        />
        <button type="submit" className="btn btn-primary btn-lg px-4" disabled={!canSearch}>
          {isLoading ? (
            <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          ) : (
            'Найти'
          )}
        </button>
      </div>
      <div id="search-hint" className="form-text">
        Поиск начнётся автоматически, когда вы введёте от {MIN_LENGTH} символов
      </div>
    </form>
  )
}
