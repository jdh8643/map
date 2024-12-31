'use client';

import { Map, MapMarker} from 'react-kakao-maps-sdk';
import useKakaoLoader from '../components/use-kakao-loader';


export default function BasicMap() {
  useKakaoLoader();

  return (
    <Map
      id="map"
      center={{ lat: 33.450701, lng: 126.570667 }}
      style={{ width: '100%', height: '350px' }}
      level={3}
    >
    <MapMarker // 마커를 생성합니다
    position={{
      // 마커가 표시될 위치입니다
      lat: 33.450701,
      lng: 126.570667,
    }}
    draggable={true}
  />
</Map>
    
  );
}
