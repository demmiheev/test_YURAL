import { afterEach, describe, expect, it, vi } from 'vitest'
import { searchBrands, searchOffers } from './favoritApi'

const EMPTY_GOOD = {
  brand: '',
  count: 0,
  goodsID: '00000000-0000-0000-0000-000000000000',
  name: '',
  number: '',
  price: 0,
  rate: 0,
  warehouses: [],
}

function mockFetch(body, { status = 200 } = {}) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }),
    )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('searchBrands', () => {
  it('возвращает производителей и экранирует спецсимволы в параметрах', async () => {
    const fetchMock = mockFetch({
      goods: [{ goodsID: '1', brand: 'FEBI', number: '01089', name: 'Антифриз', count: 538 }],
    })

    const brands = await searchBrands('A#1&2')

    expect(brands).toEqual([
      { id: '1', brand: 'FEBI', number: '01089', name: 'Антифриз', count: 538 },
    ])
    const url = new URL(fetchMock.mock.calls[0][0])
    expect(url.searchParams.get('number')).toBe('A#1&2')
  })

  it('пустая структура в ответе означает «ничего не найдено»', async () => {
    mockFetch({ goods: [EMPTY_GOOD] })
    await expect(searchBrands('7260500039S')).resolves.toEqual([])
  })

  it('переводит ошибку API в понятное сообщение', async () => {
    mockFetch({ error: 'Invalid key client!' }, { status: 403 })
    await expect(searchBrands('1')).rejects.toThrow('Неверный ключ покупателя.')
  })

  it('сообщает о сбое сети', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(searchBrands('1')).rejects.toThrow('Не удалось связаться с сервером')
  })

  it('сообщает о таймауте, даже если он случился во время чтения ответа', async () => {
    const timeout = new DOMException('The operation timed out.', 'TimeoutError')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ status: 200, ok: true, json: () => Promise.reject(timeout) }),
    )
    await expect(searchBrands('1')).rejects.toThrow('Сервер не ответил вовремя')
  })

  it('сообщает о некорректном ответе сервера', async () => {
    mockFetch('<html>Bad Gateway</html>', { status: 502 })
    await expect(searchBrands('1')).rejects.toThrow('Некорректный ответ сервера (HTTP 502).')
  })
})

describe('searchOffers', () => {
  it('передаёт бренд и analogues=on, разворачивает деталь и аналоги по складам', async () => {
    const fetchMock = mockFetch({
      goods: [
        {
          goodsID: 'p',
          brand: 'MEYLE',
          number: '7160500039/S',
          name: 'Рычаги',
          price: 1,
          warehouses: [
            {
              id: 'w1',
              code: 'МСК',
              price: 300,
              stock: 2,
              shipmentDate: '2026-10-29T14:30:00+03:00',
            },
          ],
          analogues: [
            { goodsID: 'a1', brand: 'KORTEX', number: 'K1', name: 'Рычаг', warehouses: [] },
            {
              goodsID: 'a2',
              brand: 'Zekkert',
              number: 'Z1',
              name: 'Рычаг',
              warehouses: [
                { id: 'w2', code: 'СПБ', price: 200, stock: 5 },
                { id: 'w3', own: true, price: 100, stock: 1 },
              ],
            },
          ],
        },
      ],
    })

    const offers = await searchOffers({ number: '7160500039/S', brand: 'MEYLE' })

    const url = new URL(fetchMock.mock.calls[0][0])
    expect(url.searchParams.get('brand')).toBe('MEYLE')
    expect(url.searchParams.get('analogues')).toBe('on')

    expect(offers.map((o) => [o.brand, o.warehouse, o.price, o.stock, o.isOriginal])).toEqual([
      ['Zekkert', 'Собственный склад', 100, 1, false],
      ['Zekkert', 'СПБ', 200, 5, false],
      ['MEYLE', 'МСК', 300, 2, true],
      ['KORTEX', null, null, 0, false],
    ])
    expect(new Set(offers.map((o) => o.id)).size).toBe(offers.length)
  })

  it('возвращает пустой список, если деталь не найдена', async () => {
    mockFetch({ goods: [EMPTY_GOOD] })
    await expect(searchOffers({ number: 'x', brand: 'y' })).resolves.toEqual([])
  })
})
