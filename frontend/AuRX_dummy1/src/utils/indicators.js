export function calculateRSI(candles, period = 14) {
  if (candles.length <= period) return null

  const closes = candles.map(c => c.close)

  let gains = 0
  let losses = 0

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1]

    if (change >= 0) {
      gains += change
    } else {
      losses += Math.abs(change)
    }
  }

  let avgGain = gains / period
  let avgLoss = losses / period

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1]

    const gain = Math.max(change, 0)
    const loss = Math.max(-change, 0)

    avgGain =
      ((avgGain * (period - 1)) + gain) / period

    avgLoss =
      ((avgLoss * (period - 1)) + loss) / period
  }

  if (avgLoss === 0) return 100

  const rs = avgGain / avgLoss

  return 100 - (100 / (1 + rs))
}

export function calculateEMA(candles, period) {
  if (candles.length < period) return null

  const closes = candles.map(c => c.close)

  const multiplier = 2 / (period + 1)

  let ema = closes
    .slice(0, period)
    .reduce((sum, value) => sum + value, 0) / period

  for (let i = period; i < closes.length; i++) {
    ema =
      (closes[i] - ema) * multiplier + ema
  }

  return ema
}

function emaValues(values, period) {
  if (values.length < period) return []

  const multiplier = 2 / (period + 1)

  let ema =
    values
      .slice(0, period)
      .reduce((a, b) => a + b, 0) / period

  const result = [ema]

  for (let i = period; i < values.length; i++) {
    ema =
      (values[i] - ema) * multiplier + ema

    result.push(ema)
  }

  return result
}

export function calculateMACD(candles) {
  if (candles.length < 35) return null

  const closes = candles.map(c => c.close)

  const fast = emaValues(closes, 12)
  const slow = emaValues(closes, 26)

  if (!fast.length || !slow.length) return null

  const macdValues = []

  const offset = 26 - 12

  for (let i = 0; i < slow.length; i++) {
    const fastIndex = i + offset

    if (fast[fastIndex] !== undefined) {
      macdValues.push(
        fast[fastIndex] - slow[i]
      )
    }
  }

  if (macdValues.length < 9) {
    return null
  }

  const signalValues = emaValues(macdValues, 9)

  const macd = macdValues.at(-1)
  const signal = signalValues.at(-1)

  return {
    macd,
    signal,
    bullish: macd > signal,
  }
}