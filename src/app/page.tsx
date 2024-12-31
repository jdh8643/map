"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface Location {
  lat: number;
  lng: number;
}

interface Shop {
  id: string;
  name: string;
  location: Location;
  address?: string;
  phone?: string;
  category: string;
  distance?: number; // 현재 위치로부터의 거리
  place_url?: string;
}

// 카테고리 정의
const categories = [
  { id: "plumbing", name: "설비", icon: "🔧" },
  { id: "electronics", name: "전자기기", icon: "📱" },
  { id: "appliance", name: "가전제품", icon: "🔌" },
  { id: "interior", name: "인테리어", icon: "🏠" },
  { id: "boiler", name: "보일러", icon: "♨️" },
  { id: "aircon", name: "에어컨", icon: "❄️" },
  { id: "car", name: "자동차", icon: "🚗" },
  { id: "computer", name: "PC/노트북", icon: "💻" },
];

export default function Home() {
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [nearbyShops, setNearbyShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");

  // 현재 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("위치 정보를 가져오는데 실패했습니다:", error);
        }
      );
    }
  }, []);

  // 거리 계산 함수
  const calculateDistance = (shop: Location) => {
    if (!userLocation) return 0;

    const R = 6371; // 지구의 반경 (km)
    const dLat = ((shop.lat - userLocation.lat) * Math.PI) / 180;
    const dLon = ((shop.lng - userLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLocation.lat * Math.PI) / 180) *
        Math.cos((shop.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // 카테고리별 주변 업체 검색
  const searchNearbyShops = async (category: string) => {
    if (!userLocation) return;

    setIsLoading(true);
    setSelectedCategory(category);

    try {
      // 카카오맵 API 초기화
      const places = new kakao.maps.services.Places();

      const searchByCategory = (query: string) => {
        return new Promise<kakao.maps.services.PlacesSearchResult>(
          (resolve, reject) => {
            places.keywordSearch(
              query,
              (result, status) => {
                if (status === kakao.maps.services.Status.OK) {
                  resolve(result);
                } else {
                  reject(new Error("검색 실패"));
                }
              },
              {
                location: new kakao.maps.LatLng(
                  userLocation.lat,
                  userLocation.lng
                ),
                radius: 20000, // 20km 반경
                sort: kakao.maps.services.SortBy.DISTANCE,
              }
            );
          }
        );
      };

      // 카테고리에 따른 검색어 설정
      const searchQueries = {
        plumbing: ["설비", "배관"],
        electronics: ["전자기기 수리", "휴대폰 수리"],
        appliance: ["가전제품 수리", "가전 수리"],
        interior: ["인테리어", "집수리"],
        boiler: ["보일러 설치", "보일러 수리"],
        aircon: ["에어컨 설치", "에어컨 수리"],
        car: ["자동차 정비", "카센터"],
        computer: ["컴퓨터 수리", "PC 수리"],
      }[category] || ["수리"];

      // 모든 검색어에 대해 검색 실행
      const results = await Promise.all(
        searchQueries.map((query) => searchByCategory(query))
      );

      // 결과 합치기 및 중복 제거
      const uniqueShops = Array.from(
        new Map(
          results.flat().map((shop) => [
            shop.id,
            {
              id: shop.id,
              name: shop.place_name,
              location: {
                lat: Number(shop.y),
                lng: Number(shop.x),
              },
              address: shop.address_name,
              phone: shop.phone,
              category: shop.category_name,
              distance: shop.distance
                ? Number(shop.distance) / 1000
                : undefined, // m를 km로 변환
              place_url: shop.place_url,
            },
          ])
        ).values()
      );

      setNearbyShops(uniqueShops);
    } catch (error) {
      console.error("업체 검색 중 오류 발생:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 검색어로 업체 검색
  const searchByKeyword = async (keyword: string) => {
    if (!userLocation || !keyword.trim()) return;

    setIsLoading(true);
    setSelectedCategory(null);

    try {
      const places = new kakao.maps.services.Places();

      const result = await new Promise<kakao.maps.services.PlacesSearchResult>(
        (resolve, reject) => {
          places.keywordSearch(
            `${keyword} 수리`,
            (result, status) => {
              if (status === kakao.maps.services.Status.OK) {
                resolve(result);
              } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
                resolve([]);
              } else {
                reject(new Error("검색 실패"));
              }
            },
            {
              location: new kakao.maps.LatLng(
                userLocation.lat,
                userLocation.lng
              ),
              radius: 20000,
              sort: kakao.maps.services.SortBy.DISTANCE,
            }
          );
        }
      );

      const shops = result.map((shop) => ({
        id: shop.id,
        name: shop.place_name,
        location: {
          lat: Number(shop.y),
          lng: Number(shop.x),
        },
        address: shop.address_name,
        phone: shop.phone,
        category: shop.category_name,
        distance: shop.distance ? Number(shop.distance) / 1000 : undefined,
        place_url: shop.place_url,
      }));

      setNearbyShops(shops);
    } catch (error) {
      console.error("검색 중 오류 발생:", error);
      setNearbyShops([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 검색 폼 제출 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchByKeyword(searchKeyword);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">우리동네 수리</h1>
            <Link href="/map" className="text-blue-600 hover:text-blue-800">
              지도보기
            </Link>
          </div>
        </div>
      </header>

      {/* 검색 바 */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="어떤 수리가 필요하세요?"
            className="w-full px-4 py-3 pr-12 rounded-full border-2 border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            🔍
          </button>
        </form>
      </div>

      {/* 카테고리 그리드 */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-4 gap-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => searchNearbyShops(category.id)}
              className={`aspect-square rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all
                ${
                  selectedCategory === category.id
                    ? "bg-yellow-400 text-white"
                    : "bg-white hover:bg-gray-50"
                }`}
            >
              <span className="text-3xl">{category.icon}</span>
              <span className="text-sm font-medium">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 업체 목록 */}
      {(selectedCategory || nearbyShops.length > 0) && (
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h2 className="text-lg font-bold mb-4">
            {selectedCategory
              ? `${
                  categories.find((c) => c.id === selectedCategory)?.name
                } 수리점`
              : `'${searchKeyword}' 검색 결과`}
            <span className="text-sm font-normal text-gray-500 ml-2">
              {nearbyShops.length}개의 업체
            </span>
          </h2>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-yellow-400 border-t-transparent mx-auto"></div>
              <p className="mt-2 text-gray-600">주변 업체를 찾고 있습니다...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {nearbyShops.map((shop) => (
                <Link
                  key={shop.id}
                  href={`/shop/${shop.id}?data=${encodeURIComponent(
                    JSON.stringify(shop)
                  )}`}
                  className="block bg-white rounded-lg p-4 shadow hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{shop.name}</h3>
                        {shop.distance !== undefined && (
                          <span className="text-sm text-yellow-500 font-medium">
                            {shop.distance.toFixed(1)}km
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mt-1">{shop.address}</p>
                      {shop.phone && (
                        <p className="text-blue-600 text-sm mt-1">
                          📞 {shop.phone}
                        </p>
                      )}
                      <p className="text-gray-500 text-sm mt-1">{shop.category}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {shop.place_url && (
                        <a
                          href={shop.place_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-500 hover:text-gray-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          카카오맵에서 보기 →
                        </a>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
