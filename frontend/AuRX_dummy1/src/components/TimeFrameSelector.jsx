import { useRecoilState } from 'recoil'

import { timeframeState } from '../state/atoms'

const TIMEFRAMES = [
  {
    label: '1m',
    value: '1m',
  },
  {
    label: '30m',
    value: '30m',
  },
  {
    label: '1H',
    value: '1h',
  },
  {
    label: '4H',
    value: '4h',
  },
]

export default function TimeframeSelector() {
  const [timeframe, setTimeframe] =
    useRecoilState(timeframeState)

  return (
    <div className="flex flex-wrap gap-2">
      {TIMEFRAMES.map((item) => {
        const active =
          timeframe === item.value

        return (
          <button
            key={item.value}
            onClick={() =>
              setTimeframe(item.value)
            }
            className={`
              rounded-lg px-4 py-2 text-sm font-semibold
              transition-all duration-200
              border
              ${
                active
                  ? 'border-yellow-400 bg-yellow-400 text-black'
                  : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-yellow-400/40 hover:text-white'
              }
            `}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}