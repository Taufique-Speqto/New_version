import {
  filterStringAtom,
  filterTimeAtom,
  sortAscendingAtom,
  sortMethodAtom,
  TokenSortMethod,
} from 'components/Tokens/state'
import gql from 'graphql-tag'
import { useAtomValue } from 'jotai/utils'
import { useMemo } from 'react'

import {
  Chain,
  TopMemeTokenQueryTest,
  TopTokens100Document,
  TopTokens100DocumentCopy,
  TopTokens100Query,
  useTokenQuery,
  useTopMemeTokenQuery,
  useTopMemeTokenQueryTest,
  useTopTokens100Query,
  useTopTokensSparklineQuery,
} from './__generated__/types-and-hooks'
import {
  CHAIN_NAME_TO_CHAIN_ID,
  getTokenDetailsURL,
  isPricePoint,
  PollingInterval,
  PricePoint,
  toHistoryDuration,
  unwrapToken,
  usePollQueryWhileMounted,
} from './util'
import { useQuery } from '@apollo/client'

gql`
  query TopTokens100($duration: HistoryDuration!, $chain: Chain!) {
    topTokens(pageSize: 100, page: 1, chain: $chain, orderBy: VOLUME) {
      id
      name
      chain
      address
      symbol
      standard
      market(currency: USD) {
        id
        totalValueLocked {
          id
          value
          currency
        }
        price {
          id
          value
          currency
        }
        pricePercentChange(duration: $duration) {
          id
          currency
          value
        }
        volume(duration: $duration) {
          id
          value
          currency
        }
      }
      project {
        id
        logoUrl
      }
    }
  }
`

// We separately query sparkline data so that the large download time does not block Token Explore rendering
gql`
  query TopTokensSparkline($duration: HistoryDuration!, $chain: Chain!) {
    topTokens(pageSize: 100, page: 1, chain: $chain, orderBy: VOLUME) {
      id
      address
      chain
      market(currency: USD) {
        id
        priceHistory(duration: $duration) {
          id
          timestamp
          value
        }
      }
    }
  }
`

function useSortedTokens(tokens: TopTokens100Query['topTokens']) {
  const sortMethod = useAtomValue(sortMethodAtom)
  const sortAscending = useAtomValue(sortAscendingAtom)

  return useMemo(() => {
    if (!tokens) return undefined
    let tokenArray = Array.from(tokens)
    switch (sortMethod) {
      case TokenSortMethod.PRICE:
        tokenArray = tokenArray.sort((a, b) => (b?.market?.price?.value ?? 0) - (a?.market?.price?.value ?? 0))
        break
      case TokenSortMethod.PERCENT_CHANGE:
        tokenArray = tokenArray.sort(
          (a, b) => (b?.market?.pricePercentChange?.value ?? 0) - (a?.market?.pricePercentChange?.value ?? 0)
        )
        break
      case TokenSortMethod.TOTAL_VALUE_LOCKED:
        tokenArray = tokenArray.sort(
          (a, b) => (b?.market?.totalValueLocked?.value ?? 0) - (a?.market?.totalValueLocked?.value ?? 0)
        )
        break
      case TokenSortMethod.VOLUME:
        tokenArray = tokenArray.sort((a, b) => (b?.market?.volume?.value ?? 0) - (a?.market?.volume?.value ?? 0))
        break
    }

    return sortAscending ? tokenArray.reverse() : tokenArray
  }, [tokens, sortMethod, sortAscending])
}

function useFilteredTokens(tokens: TopTokens100Query['topTokens']) {
  const filterString = useAtomValue(filterStringAtom)


  const lowercaseFilterString = useMemo(() => filterString.toLowerCase(), [filterString])

  return useMemo(() => {
    if (!tokens) return undefined
    let returnTokens = tokens
    if (lowercaseFilterString) {
      returnTokens = returnTokens?.filter((token) => {
        const addressIncludesFilterString = token?.address?.toLowerCase().includes(lowercaseFilterString)
        const nameIncludesFilterString = token?.name?.toLowerCase().includes(lowercaseFilterString)
        const symbolIncludesFilterString = token?.symbol?.toLowerCase().includes(lowercaseFilterString)
        return nameIncludesFilterString || symbolIncludesFilterString || addressIncludesFilterString
      })
    }
    return returnTokens
  }, [tokens, lowercaseFilterString])
}

// Number of items to render in each fetch in infinite scroll.
export const PAGE_SIZE = 20
export type SparklineMap = { [key: string]: PricePoint[] | undefined }
// export type TopToken = NonNullable<NonNullable<TopTokens100Query>['topTokens']>[number]
export type TopToken = NonNullable<NonNullable<TopMemeTokenQueryTest>['token']>[number]

interface UseTopTokensReturnValue {
  memetokens: TopToken[] | undefined
  memetokenSortRank: Record<string, number>
  memeloadingTokens: boolean
  memesparklines: SparklineMap
}
interface UseTopMemeTokensReturnValue {
  memetokens: TopToken[] | undefined
  memetokenSortRank: Record<string, number>
  memeloadingTokens: boolean
  memesparklines: SparklineMap
}


export function useTopMemeTokens(chain: Chain): UseTopMemeTokensReturnValue {
  const chainId = CHAIN_NAME_TO_CHAIN_ID[chain]
  const duration = toHistoryDuration(useAtomValue(filterTimeAtom))
  console.log('duration', duration);

  const { data: sparklineQuery } = usePollQueryWhileMounted(
    useTopTokensSparklineQuery({
      variables: { duration, chain },
    }),
    PollingInterval.Slow
  )
  // const { data: data1, error: error1 } = useQuery(TopTokens100DocumentCopy, {
  //   variables: { duration: 'DAY', chain: 'ETHEREUM' },
  // });
  // console.log('data1', data1);
  // console.log('error1', error1);

  // const tokenDetails = getTokenDetailsURL({ address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', chain });
  // console.log('tokenDetails', tokenDetails);


  const memesparklines = useMemo(() => {
    const unwrappedTokens = sparklineQuery?.topTokens?.map((topToken) => unwrapToken(chainId, topToken))
    // console.log('unwrappedTokens ---------', unwrappedTokens, '-------unwrappedTokens');

    const map: SparklineMap = {}
    unwrappedTokens?.forEach(
      (current) => current?.address && (map[current.address] = current?.market?.priceHistory?.filter(isPricePoint))
    )
    return map
  }, [chainId, sparklineQuery?.topTokens])

  const { data, loading: memeloadingTokens } = usePollQueryWhileMounted(
    useTopTokens100Query({
      variables: { duration, chain },
    }),
    PollingInterval.Fast
  )

  let MemeTokenAddresses = [
    '0x6bf765c43030387a983f429c1438e9d2025b7e12',
    '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
    '0x761d38e5ddf6ccf6cf7c55759d5210750b5d60f3',
    '0xc5fb36dd2fb59d3b98deff88425a3f425ee469ed',
    '0x7d8146cf21e8d7cbe46054e01588207b51198729',
    '0x12b6893ce26ea6341919fe289212ef77e51688c8',
    '0xa35923162c49cf95e6bf26623385eb431ad920d3',
    '0x49642110b712c1fd7261bc074105e9e44676c68f',
    '0x5026f006b85729a8b14553fae6af249ad16c9aab',
    '0xfb130d93e49dca13264344966a611dc79a456bc5'
  ]

  // const TopMemeTokenData = MemeTokenAddresses.map((addr) => {
  //   const { data: data2, loading: memeloadingTokens2 } = usePollQueryWhileMounted(
  //     useTopMemeTokenQuery({
  //       variables: {// ETHEREUM
  //         address: addr,
  //         chain: chain
  //       },
  //       errorPolicy: 'all',
  //     }),
  //     PollingInterval.Fast
  //   )
  //   return data2?.token
  // })
  const TopMemeTokenDataTest = MemeTokenAddresses.map((addr) => {
    const { data: data2, loading: memeloadingTokens2 } = usePollQueryWhileMounted(
      useTopMemeTokenQueryTest({
        variables: {// ETHEREUM
          chain: chain,
          address: addr
        },
        errorPolicy: 'all',
      }),
      PollingInterval.Fast
    )
    return data2?.token
  })
  
  // console.log('data -----> ', data);
  // console.log('TopMemeTokenDataTest -----> ', TopMemeTokenDataTest);
  
// const topMemeUnwrappedTokens = useMemo(() => data1?.topTokens.map((token) => unwrapToken(chainId, token)), [chainId, data1])
  const unwrappedTokens = useMemo(() => data?.topTokens?.map((token) => unwrapToken(chainId, token)), [chainId, data])

  const sortedTokens = useSortedTokens(unwrappedTokens)
  const memetokenSortRank = useMemo(
    () =>
      sortedTokens?.reduce((acc, cur, i) => {
        if (!cur.address) return acc
        return {
          ...acc,
          [cur.address]: i + 1,
        }
      }, {}) ?? {},
    [sortedTokens]
  )



  const filteredTokens = useFilteredTokens(sortedTokens)


 
  return useMemo(
    () => ({ memetokens: filteredTokens, memetokenSortRank, memeloadingTokens, memesparklines  }),
    [filteredTokens, memetokenSortRank, memeloadingTokens, memesparklines]
  )




}

