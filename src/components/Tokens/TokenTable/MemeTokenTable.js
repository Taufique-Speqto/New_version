import { Trans } from '@lingui/macro'
import { PAGE_SIZE, useTopTokens } from 'graphql/data/TopTokens'
import { PollingInterval, usePollQueryWhileMounted, validateUrlChainParam } from 'graphql/data/util'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { useParams } from 'react-router-dom'
import styled from 'styled-components/macro'
import axios from 'axios'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '../constants'
import { HeaderRow, LoadedRow, LoadingRow } from './TokenRow'
import { useTokenQuery, useTopMemeTokenQueryTest } from 'graphql/data/__generated__/types-and-hooks'
import { ChainName } from '@uniswap/smart-order-router'
import { useTopMemeTokens } from 'graphql/data/TopMemeTokens'
import { useAtomValue } from 'jotai/utils'
import { TokenSortMethod, filterStringAtom, sortAscendingAtom, sortMethodAtom } from '../state'

const GridContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  background-color: ${({ theme }) => theme.backgroundSurface};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  margin-left: auto;
  margin-right: auto;
  border-radius: 12px;
  justify-content: center;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
`

const TokenDataContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 100%;
  width: 100%;
`

const NoTokenDisplay = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  height: 60px;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 16px;
  font-weight: 500;
  align-items: center;
  padding: 0px 28px;
  gap: 8px;
`

function NoTokensState({ message }) {
  return (
    <GridContainer>
      <HeaderRow />
      <NoTokenDisplay>{message}</NoTokenDisplay>
    </GridContainer>
  )
}

const LoadingRows = ({ rowCount }) => (
  <>
    {Array(rowCount)
      .fill(null)
      .map((_, index) => {
        return <LoadingRow key={index} first={index === 0} last={index === rowCount - 1} />
      })}
  </>
)

function LoadingTokenTable({ rowCount = PAGE_SIZE }) {
  return (
    <GridContainer>
      <HeaderRow />
      <TokenDataContainer>
        <LoadingRows rowCount={rowCount} />
      </TokenDataContainer>
    </GridContainer>
  )
}

function useSortedTokens(tokens) {
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


function useFilteredTokens(tokens) {
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




export default function MemeTokenTable() {
  const chainName = 'ETHEREUM'
  // const chainName1 = validateUrlChainParam(useParams.chainName)
  // console.log('chainName1', chainName1);

  const { tokens, tokenSortRank, loadingTokens, sparklines } = useTopTokens(chainName)
  console.log('Tokens ==========> ', tokens);


  let MemeTokenAddresses = [
    '0x6982508145454ce325ddbe47a25d4ec3d2311933',
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


  const TopMemeTokenDataTest = MemeTokenAddresses.map((addr) => {
    const { data: data2, loading: memeloadingTokens2 } = usePollQueryWhileMounted(
      useTopMemeTokenQueryTest({
        variables: {// ETHEREUM
          chain: 'ETHEREUM',
          address: addr
        },
        errorPolicy: 'all',
      }),
      PollingInterval.Fast
    )
    return data2?.token
  })

  const sortedTokens = useSortedTokens(TopMemeTokenDataTest)
  console.log('sortedTokens ========>', sortedTokens);
  const filteredTokens = useFilteredTokens(sortedTokens)
  console.log('filteredTokens ========>', filteredTokens);
  
 

  const MemetokenSortRank = useMemo(()=>{
    return sortedTokens?.reduce((acc, cur, i) => {
      if (!cur?.address) return acc
      return {
        ...acc,
        [cur?.address]: i + 1,
      }
    }, {}) ?? {}
  }, [sortedTokens])



  console.log('MemetokenSortRank ========>', MemetokenSortRank);

  /* loading and error state */



  if (loadingTokens && !tokens) {
    return <LoadingTokenTable rowCount={PAGE_SIZE} />
  } else if (!tokens) {
    return (
      <NoTokensState
        message={
          <>
            <AlertTriangle size={16} />
            <Trans>An error occurred loading tokens. Please try again.</Trans>
          </>
        }
      />
    )
  } else if (tokens?.length === 0) {
    return <NoTokensState message={<Trans>No tokens found</Trans>} />
  } else {
    return (
      <GridContainer>
        <HeaderRow />
        <TokenDataContainer>

          {filteredTokens.map(
            (token, index) =>
              token?.address && (
                <LoadedRow
                  key={token.address}
                  tokenListIndex={index}
                  tokenListLength={tokens.length}
                  token={token}
                  sparklineMap={sparklines}
                  sortRank={MemetokenSortRank[token.address]}
                />
              )
          )}

        </TokenDataContainer>
      </GridContainer>
    )
  }
}
