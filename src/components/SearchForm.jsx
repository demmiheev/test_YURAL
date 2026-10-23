import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBrands } from '../store/searchSlice'

export default function SearchForm() {
  const dispatch = useDispatch()
  const isLoading = useSelector((state) => state.search.brands.status === 'loading')
  const [number, setNumber] = useState('')

  const trimmed = number.trim()

  const handleSubmit = (event) => {
    event.preventDefault()
    if (trimmed) dispatch(fetchBrands(trimmed))
  }

  return (
    <form className="d-flex gap-2" onSubmit={handleSubmit}>
      <input
        type="search"
        className="form-control form-control-lg"
        placeholder="Артикул детали, например 01089"
        aria-label="Артикул детали"
        value={number}
        onChange={(event) => setNumber(event.target.value)}
        autoFocus
      />
      <button
        type="submit"
        className="btn btn-primary btn-lg px-4"
        disabled={!trimmed || isLoading}
      >
        {isLoading ? (
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
        ) : (
          'Найти'
        )}
      </button>
    </form>
  )
}
