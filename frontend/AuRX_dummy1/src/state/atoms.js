import { atom } from 'recoil'

export const symbolState = atom({
  key: 'symbolState',
  default: 'XAUUSDT',
})

export const timeframeState = atom({
  key: 'timeframeState',
  default: '1m',
})