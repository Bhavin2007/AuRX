import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

import { useRecoilValue } from 'recoil'

import { marketState } from '../state/marketState'

export default function PriceChart() {
  const { chartData } = useRecoilValue(marketState)

  const data = chartData.map((candle) => ({
    time: new Date(candle.time).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),

    price: candle.close,
  }))

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="mb-5">
        <h2 className="text-2xl font-bold">
          Live XAUUSDT Chart
        </h2>

        <p className="text-sm text-white/40">
          Binance Futures market data
        </p>
      </div>

      <div className="h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient
                id="goldGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#facc15"
                  stopOpacity={0.35}
                />

                <stop
                  offset="100%"
                  stopColor="#facc15"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="rgba(255,255,255,0.08)"
              vertical={false}
            />

            <XAxis
              dataKey="time"
              stroke="rgba(255,255,255,0.35)"
              tickLine={false}
            />

            <YAxis
              domain={['auto', 'auto']}
              stroke="rgba(255,255,255,0.35)"
              tickLine={false}
              width={70}
            />

            <Tooltip
              contentStyle={{
                background: '#111',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
              }}
            />

            <Area
              type="monotone"
              dataKey="price"
              stroke="#facc15"
              fill="url(#goldGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}