import { CollectionInfoForAsset, GenieAsset } from 'nft/types'
import styled from 'styled-components/macro'
import { Z_INDEX } from 'theme/zIndex'

import { DataPage } from './DataPage'
import { LandingPage } from './LandingPage'

interface NftDetailsProps {
  asset: GenieAsset
  collection: CollectionInfoForAsset
}

const DetailsBackground = styled.div<{ backgroundImage: string }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: ${({ backgroundImage }) => `url(${backgroundImage})`};
  filter: blur(100px);
  opacity: ${({ theme }) => (theme.darkMode ? 0.2 : 0.24)};
`

const DetailsContentContainer = styled.div`
  z-index: ${Z_INDEX.hover};
`

export const NftDetails = ({ asset, collection }: NftDetailsProps) => {
  return (
    <>
      {asset.imageUrl && <DetailsBackground backgroundImage={asset.imageUrl} />}
      <DetailsContentContainer>
        <LandingPage asset={asset} collection={collection} />
        <DataPage asset={asset} />
      </DetailsContentContainer>
    </>
  )
}
