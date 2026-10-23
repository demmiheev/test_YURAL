import { describe, expect, it } from 'vitest'
import reducer, { fetchBrands, fetchOffers } from './searchSlice'

const init = () => reducer(undefined, { type: '@@init' })

describe('searchSlice', () => {
  it('проходит оба этапа: бренды → предложения', () => {
    let state = reducer(init(), fetchBrands.pending('r1', '01089'))
    expect(state.brands.status).toBe('loading')
    expect(state.query).toBe('01089')

    state = reducer(state, fetchBrands.fulfilled([{ id: '1', brand: 'FEBI' }], 'r1', '01089'))
    expect(state.brands).toMatchObject({ status: 'succeeded', items: [{ brand: 'FEBI' }] })

    const arg = { number: '01089', brand: 'FEBI' }
    state = reducer(state, fetchOffers.pending('r2', arg))
    expect(state.selected).toEqual(arg)
    expect(state.offers.status).toBe('loading')

    state = reducer(state, fetchOffers.rejected(new Error('Сбой'), 'r2', arg))
    expect(state.offers).toMatchObject({ status: 'failed', error: 'Сбой' })
  })

  it('новый поиск сбрасывает выбранного производителя и предложения', () => {
    let state = reducer(init(), fetchOffers.pending('r1', { number: '1', brand: 'A' }))
    state = reducer(state, fetchBrands.pending('r2', '2'))
    expect(state.selected).toBeNull()
    expect(state.offers.status).toBe('idle')
  })

  it('игнорирует ответ устаревшего запроса', () => {
    let state = reducer(init(), fetchBrands.pending('old', '1'))
    state = reducer(state, fetchBrands.pending('new', '2'))
    state = reducer(state, fetchBrands.fulfilled([{ brand: 'OLD' }], 'old', '1'))
    expect(state.brands.status).toBe('loading')
    expect(state.brands.items).toEqual([])
  })
})
