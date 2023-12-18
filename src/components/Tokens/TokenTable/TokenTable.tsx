import { Trans } from '@lingui/macro'
import { PAGE_SIZE, useTopTokens } from 'graphql/data/TopTokens'
import { validateUrlChainParam } from 'graphql/data/util'
import { ReactNode, useEffect, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { useParams } from 'react-router-dom'
import styled from 'styled-components/macro'
import axios from 'axios'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '../constants'
import { HeaderRow, LoadedRow, LoadingRow } from './TokenRow'
import { useTokenQuery } from 'graphql/data/__generated__/types-and-hooks'
import { ChainName } from '@uniswap/smart-order-router'
import { useTopMemeTokens } from 'graphql/data/TopMemeTokens'

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

function NoTokensState({ message }: { message: ReactNode }) {
  return (
    <GridContainer>
      <HeaderRow />
      <NoTokenDisplay>{message}</NoTokenDisplay>
    </GridContainer>
  )
}

const LoadingRows = ({ rowCount }: { rowCount: number }) => (
  <>
    {Array(rowCount)
      .fill(null)
      .map((_, index) => {
        return <LoadingRow key={index} first={index === 0} last={index === rowCount - 1} />
      })}
  </>
)

function LoadingTokenTable({ rowCount = PAGE_SIZE }: { rowCount?: number }) {
  return (
    <GridContainer>
      <HeaderRow />
      <TokenDataContainer>
        <LoadingRows rowCount={rowCount} />
      </TokenDataContainer>
    </GridContainer>
  )
}

export default function TokenTable() {
  const chainName = validateUrlChainParam(useParams<{ chainName?: string }>().chainName)

  const { tokens, tokenSortRank, loadingTokens, sparklines } = useTopTokens(chainName)
  // console.log('tokens -->', tokens);
  // console.log('tokenSortRank -->',tokenSortRank);
  // console.log('loadingTokens -->',loadingTokens);
  // console.log('sparklines -->',sparklines);  

  const { memetokens, memetokenSortRank, memesparklines, memeloadingTokens } = useTopMemeTokens(chainName)
  // console.log('memetokens ========>>>>', memetokens);
  
  // const MemeTokens = async () => {
  //   await axios.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=meme-token&order=market_cap_desc&per_page=100&page=1&sparkline=true')
  //     .then((res) => {
  //       // console.log('Top Meme Tokens',res.data);
  //     }).catch((err) => {
  //       console.log('Top meme tokens Error', err)
  //     })
  // }
  // const [memeTokens, setmemeTokens] = useState();
  // useEffect(() => {
  //   const { data: tokenQuery } = useTokenQuery({
  //     variables: {// ETHEREUM
  //       address: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
  //       chain: chainName
  //     },
  //     errorPolicy: 'all',
  //   })
  //   console.log('tokenQuery ----------->', tokenQuery);
  //   // setmemeTokens(tokenQuery?.token)
  //   // MemeTokens()
  // }, [])

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

          {tokens.map(
            (token, index) =>
              token?.address && (
                <LoadedRow
                  key={token.address}
                  tokenListIndex={index}
                  tokenListLength={tokens.length}
                  token={token}
                  sparklineMap={sparklines}
                  sortRank={tokenSortRank[token.address]}
                />
              )
          )}

        </TokenDataContainer>
      </GridContainer>
    )
  }
}
