"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Map, MapMarker } from "react-kakao-maps-sdk";
import useKakaoLoader from "../../components/use-kakao-loader";

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
  place_url?: string;
}

interface Review {
  id: string;
  userName: string;
  rating: number;
  content: string;
  createdAt: string;
  photos: string[];
}

export default function ShopDetail() {
  useKakaoLoader();
  const params = useParams();
  const searchParams = useSearchParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [newReview, setNewReview] = useState({ rating: 5, content: "" });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [isWritingReview, setIsWritingReview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const shopData = searchParams.get("data");
      if (!shopData) {
        console.error("Shop data not found in URL parameters");
        setLoading(false);
        return;
      }

      const parsedShop = JSON.parse(decodeURIComponent(shopData));
      
      // 필수 필드 타입 체크
      if (
        !parsedShop.id ||
        !parsedShop.name ||
        !parsedShop.location ||
        typeof parsedShop.location.lat !== 'number' ||
        typeof parsedShop.location.lng !== 'number'
      ) {
        console.error("Invalid shop data format");
        setLoading(false);
        return;
      }

      setShop(parsedShop);
    } catch (error) {
      console.error("Error parsing shop data:", error);
    }
    setLoading(false);
  }, [searchParams]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const photos: string[] = [];

    // 선택된 파일들을 처리
    if (fileInputRef.current?.files) {
      const files = Array.from(fileInputRef.current.files);
      for (const file of files) {
        const photoUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        photos.push(photoUrl);
      }
    }

    if (editingReview) {
      // 리뷰 수정
      setReviews(
        reviews.map((review) =>
          review.id === editingReview
            ? {
                ...review,
                rating: newReview.rating,
                content: newReview.content,
                photos: [...review.photos, ...photos],
              }
            : review
        )
      );
      setEditingReview(null);
    } else {
      // 새 리뷰 작성
      const review: Review = {
        id: Date.now().toString(),
        userName: "익명",
        rating: newReview.rating,
        content: newReview.content,
        createdAt: new Date().toISOString().split("T")[0],
        photos,
      };
      setReviews([review, ...reviews]);
    }

    // 입력 폼 초기화 및 모달 닫기
    setNewReview({ rating: 5, content: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsWritingReview(false);
  };

  const handleDeleteReview = (reviewId: string) => {
    if (window.confirm("리뷰를 삭제하시겠습니까?")) {
      setReviews(reviews.filter((review) => review.id !== reviewId));
    }
  };

  const handleEditReview = (review: Review) => {
    setNewReview({
      rating: review.rating,
      content: review.content,
    });
    setEditingReview(review.id);
    setIsWritingReview(true);
    setActiveTab("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeletePhoto = (reviewId: string, photoIndex: number) => {
    if (window.confirm("사진을 삭제하시겠습니까?")) {
      setReviews(
        reviews.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                photos: review.photos.filter((_, idx) => idx !== photoIndex),
              }
            : review
        )
      );
    }
  };

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        ).toFixed(1)
      : "0.0";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent"></div>
    </div>
  );

  if (!shop) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">업체 정보를 찾을 수 없습니다</h1>
      <p className="text-gray-600">올바른 접근이 아니거나 데이터가 손실되었습니다.</p>
      <Link href="/" className="text-blue-600 hover:text-blue-800">
        홈으로 돌아가기
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center">
              <Link href="/map" className="text-gray-600 hover:text-gray-800">
                ←
              </Link>
              <h1 className="ml-4 font-semibold">{shop.name}</h1>
            </div>
            <button
              onClick={() => setIsWritingReview(true)}
              className="px-4 py-2 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 font-medium text-sm flex items-center gap-1"
            >
              <span>+</span>
              리뷰작성
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-5xl mx-auto bg-white shadow-sm">
        {/* 업체 기본 정보 */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{shop.name}</h1>
              <div className="text-lg text-gray-600 mb-4">{shop.category}</div>
              <div className="flex items-center gap-4 text-gray-700">
                <div className="flex items-center">
                  <span className="text-2xl text-yellow-400 mr-1">★</span>
                  <span className="text-xl font-semibold">{averageRating}</span>
                </div>
                <div>리뷰 {reviews.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab("home")}
              className={`px-6 py-4 font-semibold ${
                activeTab === "home"
                  ? "text-yellow-400 border-b-2 border-yellow-400"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              정보
            </button>
            <button
              onClick={() => setActiveTab("review")}
              className={`px-6 py-4 font-semibold ${
                activeTab === "review"
                  ? "text-yellow-400 border-b-2 border-yellow-400"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              리뷰
            </button>
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="p-6">
          {activeTab === "home" && (
            <div>
              {/* 상세 정보 */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">업체 정보</h3>
                <div className="space-y-3">
                  {shop.address && (
                    <div className="flex gap-4">
                      <span className="text-gray-500 w-20">주소</span>
                      <span>{shop.address}</span>
                    </div>
                  )}
                  {shop.phone && (
                    <div className="flex gap-4">
                      <span className="text-gray-500 w-20">전화</span>
                      <span>{shop.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 지도 */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">위치</h3>
                <div className="h-80 rounded-lg overflow-hidden">
                  <Map
                    center={shop.location}
                    style={{ width: "100%", height: "100%" }}
                    level={3}
                  >
                    <MapMarker position={shop.location} />
                  </Map>
                </div>
              </div>
            </div>
          )}

          {activeTab === "review" && (
            <div>
              {/* 리뷰 목록 */}
              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    아직 리뷰가 없습니다.
                    <br />첫 리뷰를 작성해주세요!
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-white rounded-lg shadow-sm p-6"
                    >
                      {/* 리뷰 헤더 */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="font-semibold mb-1">
                            {review.userName}
                          </div>
                          <div className="text-yellow-400">
                            {"★".repeat(review.rating)}
                            {"☆".repeat(5 - review.rating)}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-gray-500 text-sm">
                            {review.createdAt}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                handleEditReview(review);
                                setIsWritingReview(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDeleteReview(review.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 리뷰 내용 */}
                      <div className="text-gray-700 whitespace-pre-line mb-4">
                        {review.content}
                      </div>

                      {/* 리뷰 사진 */}
                      {review.photos.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {review.photos.map((photo, index) => (
                            <div
                              key={index}
                              className="relative group aspect-square"
                            >
                              <img
                                src={photo}
                                alt={`리뷰 사진 ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg"
                              />
                              <button
                                onClick={() =>
                                  handleDeletePhoto(review.id, index)
                                }
                                className="absolute top-1 right-1 bg-black bg-opacity-50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 리뷰 작성/수정 모달 */}
      {(isWritingReview || editingReview) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleReviewSubmit} className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">
                  {editingReview ? "리뷰 수정" : "리뷰 작성"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsWritingReview(false);
                    setEditingReview(null);
                    setNewReview({ rating: 5, content: "" });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* 평점 선택 */}
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">평점</label>
                <div className="flex gap-4">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating })}
                      className={`p-2 rounded ${
                        newReview.rating === rating
                          ? "bg-yellow-400 text-white"
                          : "bg-white text-gray-400 hover:bg-gray-100 border"
                      }`}
                    >
                      {"★".repeat(rating)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 리뷰 내용 */}
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">리뷰 내용</label>
                <textarea
                  value={newReview.content}
                  onChange={(e) =>
                    setNewReview({ ...newReview, content: e.target.value })
                  }
                  className="w-full p-3 border rounded-lg h-32"
                  placeholder="서비스 이용 경험을 공유해주세요"
                />
              </div>

              {/* 사진 첨부 */}
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">사진 첨부</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  ref={fileInputRef}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-yellow-400 hover:text-yellow-600 transition-colors"
                >
                  사진을 선택하려면 클릭하세요
                </button>
              </div>

              {/* 버튼 */}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-yellow-400 text-white py-3 rounded-lg hover:bg-yellow-500 font-semibold"
                >
                  {editingReview ? "수정하기" : "등록하기"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsWritingReview(false);
                    setEditingReview(null);
                    setNewReview({ rating: 5, content: "" });
                  }}
                  className="flex-1 bg-gray-400 text-white py-3 rounded-lg hover:bg-gray-500 font-semibold"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
