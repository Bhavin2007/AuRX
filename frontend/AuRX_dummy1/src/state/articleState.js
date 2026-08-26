import { atom } from 'recoil'

export const articleState = atom({
  key: 'articleState',

  default: {
    articles: [],
    selectedArticle: null,

    loading: true,
    error: null,
  },
})