import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { searchBrands, searchOffers } from '../api/favoritApi'

export const fetchBrands = createAsyncThunk('search/fetchBrands', searchBrands)

export const fetchOffers = createAsyncThunk('search/fetchOffers', searchOffers)

const createRequestState = () => ({ items: [], status: 'idle', error: null, requestId: null })

const initialState = {
  query: '',
  selected: null,
  brands: createRequestState(),
  offers: createRequestState(),
}

const startRequest = (action) => ({
  ...createRequestState(),
  status: 'loading',
  requestId: action.meta.requestId,
})

function finishRequest(request, action) {
  if (request.requestId !== action.meta.requestId) return
  if (action.error) {
    request.status = 'failed'
    request.error = action.error.message || 'Неизвестная ошибка.'
  } else {
    request.status = 'succeeded'
    request.items = action.payload
  }
}

const searchSlice = createSlice({
  name: 'search',
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(fetchBrands.pending, (state, action) => {
        state.query = action.meta.arg
        state.selected = null
        state.brands = startRequest(action)
        state.offers = createRequestState()
      })
      .addCase(fetchOffers.pending, (state, action) => {
        state.selected = action.meta.arg
        state.offers = startRequest(action)
      })
      .addMatcher(fetchBrands.settled, (state, action) => finishRequest(state.brands, action))
      .addMatcher(fetchOffers.settled, (state, action) => finishRequest(state.offers, action))
  },
})

export default searchSlice.reducer
