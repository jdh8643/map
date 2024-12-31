'use client';

import { useState, useEffect } from 'react';
import { Map, MapMarker } from 'react-kakao-maps-sdk';
import useKakaoLoader from '../components/use-kakao-loader';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Location {
  lat: number;
  lng: number;
}

interface RepairShop {
  id: string;
  name: string;
  location: Location;
  address?: string;
  phone?: string;
  rating: number;
  category: string;
  place_url?: string;
}

export default function RepairShopMap() {
  useKakaoLoader();
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<Location>({ lat: 37.5665, lng: 126.9780 }); // 서울 시청 기본값
  const [shops, setShops] = useState<RepairShop[]>([]);
  const [selectedShop, setSelectedShop] = useState<RepairShop | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [map, setMap] = useState<kakao.maps.Map | null>(null);

  // 카테고리 버튼 목록 추가
  const categories = [
    '하수구', '설비', '인테리어', '도배', '장판', 
    'AS', '보일러', '에어컨청소', '자동차수리'
  ];

  // 현재 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(newLocation);
          searchNearbyShops(newLocation, '설비');  // 초기 검색
        },
        (error) => {
          console.error('Error getting location:', error);
          searchNearbyShops(userLocation, '설비');  // 기본 위치로 검색
        }
      );
    }
  }, []);

  // 키워드로 주변 업체 검색
  const searchNearbyShops = (location: Location, keyword: string) => {
    if (window.kakao && window.kakao.maps) {
      const ps = new window.kakao.maps.services.Places();
      
      const callback = (result: any, status: any) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const searchResults: RepairShop[] = result.map((place: any) => ({
            id: place.id,
            name: place.place_name,
            location: {
              lat: parseFloat(place.y),
              lng: parseFloat(place.x)
            },
            address: place.address_name,
            phone: place.phone,
            rating: 0, // API에서는 평점을 제공하지 않으므로 기본값
            category: place.category_name,
            place_url: place.place_url
          }));
          setShops(searchResults);
        } else {
          console.error('검색 결과가 없습니다.');
        }
      };

      // 현재 위치 기준 20km 반경 내에서 검색
      const options = {
        location: new window.kakao.maps.LatLng(location.lat, location.lng),
        radius: 20000,
        sort: window.kakao.maps.services.SortBy.DISTANCE
      };

      ps.keywordSearch(keyword, callback, options);
    }
  };

  // 내 위치로 이동
  const moveMyLocation = () => {
    if (map) {
      map.setCenter(new kakao.maps.LatLng(userLocation.lat, userLocation.lng));
    }
  };

  // 검색어 입력 처리
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      searchNearbyShops(userLocation, searchKeyword);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* 검색 폼 */}
      <div className="bg-white p-4 border-b">
        <div className="max-w-5xl mx-auto">
          {/* 상단 네비게이션 */}
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="font-medium">홈으로</span>
            </Link>
          </div>

          {/* 검색 폼 */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="수리점 검색..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              검색
            </button>
          </form>

          {/* 카테고리 버튼 */}
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSearchKeyword(category);
                  searchNearbyShops(userLocation, category);
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 지도 */}
      <div className="flex-1 relative">
        <Map
          center={userLocation}
          style={{ width: '100%', height: '100%' }}
          level={5}
          onCreate={setMap}
        >
          {/* 현재 위치 마커 */}
          <MapMarker
            position={userLocation}
            image={{
              src: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png',
              size: { width: 64, height: 69 },
            }}
          />

          {/* 업체 마커들 */}
          {shops.map((shop) => (
            <MapMarker
              key={shop.id}
              position={shop.location}
              onClick={() => setSelectedShop(shop)}
            />
          ))}
        </Map>

        {/* 내 위치로 이동 버튼 */}
        <button
          onClick={moveMyLocation}
          className="absolute bottom-8 right-4 bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-400 z-10"
          title="내 위치로 이동"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      {/* 선택된 업체 정보 */}
      {selectedShop && (
        <div className="p-4 bg-white shadow">
          <h3 className="text-lg font-bold">{selectedShop.name}</h3>
          {selectedShop.address && (
            <p className="text-gray-600 text-sm mt-1">{selectedShop.address}</p>
          )}
          <div className="flex items-center mt-2">
            <span className="text-gray-500">{selectedShop.category}</span>
          </div>
          <button 
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => {
              router.push(`/shop/${selectedShop.id}?data=${encodeURIComponent(JSON.stringify(selectedShop))}`);
            }}
          >
            상세 정보 보기
          </button>
        </div>
      )}
    </div>
  );
}
