const API_URL = 'https://api.favorit-parts.ru/hs/hsprice/'
const API_KEY = import.meta.env.VITE_API_KEY || '00000000-0000-0000-0000-000000000001'
const TIMEOUT_MS = 30000

const ERROR_MESSAGES = {
  'Empty key!': 'Не указан ключ покупателя.',
  'Invalid key client!': 'Неверный ключ покупателя.',
  'Invalid access key': 'Неверный ключ доступа к API.',
  'Empty number goods!': 'Не указан номер детали.',
  'Request quota exceeded!': 'Превышен лимит запросов. Попробуйте позже.',
}

function translateError(error) {
  const messages = Array.isArray(error) ? error : [error]
  return messages.map((message) => ERROR_MESSAGES[message] || String(message)).join(' ')
}

const isEmptyGood = (good) => !good || (!good.brand && !good.number)

async function requestGoods(params) {
  const url = new URL(API_URL)
  url.search = new URLSearchParams({ key: API_KEY, ...params })

  let response
  let data
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    data = await response.json()
  } catch (error) {
    if (error.name === 'TimeoutError') {
      throw new Error('Сервер не ответил вовремя. Попробуйте ещё раз.', { cause: error })
    }
    if (error.name === 'SyntaxError') {
      throw new Error(`Некорректный ответ сервера (HTTP ${response.status}).`, { cause: error })
    }
    throw new Error('Не удалось связаться с сервером. Проверьте подключение к интернету.', {
      cause: error,
    })
  }

  if (data?.error) throw new Error(translateError(data.error))
  if (!response.ok) throw new Error(`Ошибка сервера (HTTP ${response.status}).`)

  return Array.isArray(data?.goods) ? data.goods.filter((good) => !isEmptyGood(good)) : []
}

export async function searchBrands(number) {
  const goods = await requestGoods({ number })
  return goods.map((good) => ({
    id: good.goodsID,
    brand: good.brand,
    number: good.number,
    name: good.name,
    count: good.count ?? 0,
  }))
}

export async function searchOffers({ number, brand }) {
  const [part] = await requestGoods({ number, brand, analogues: 'on' })
  if (!part) return []

  const analogues = (part.analogues || []).filter((good) => !isEmptyGood(good))
  return [...toOffers(part, true), ...analogues.flatMap((good) => toOffers(good, false))].sort(
    compareOffers,
  )
}

function toOffers(good, isOriginal) {
  const warehouses = good.warehouses?.length ? good.warehouses : [{}]
  return warehouses.map((warehouse, index) => ({
    id: `${good.goodsID}-${index}`,
    brand: good.brand,
    number: good.number,
    name: good.name,
    isOriginal,
    warehouse: warehouse.code || (warehouse.own ? 'Собственный склад' : null),
    shipmentDate: warehouse.shipmentDate || null,
    price: warehouse.price ?? null,
    stock: warehouse.stock ?? 0,
  }))
}

function compareOffers(a, b) {
  return Number(b.stock > 0) - Number(a.stock > 0) || (a.price ?? Infinity) - (b.price ?? Infinity)
}
