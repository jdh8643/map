import { useKakaoLoader as useKakaoLoaderOrigin } from 'react-kakao-maps-sdk';

export default function useKakaoLoader() {
  useKakaoLoaderOrigin({
    appkey: "a774ce07b39afd5e5b45e0974820336a",
    libraries: ['clusterer', 'drawing', 'services'],
  });
}
