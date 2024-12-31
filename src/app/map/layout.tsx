import Script from 'next/script';
import React from 'react';

export const API = `//dapi.kakao.com/v2/maps/sdk.js?appkey=a774ce07b39afd5e5b45e0974820336a&libraries=services,clusterer&autoload=false`;

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script src={API} strategy="beforeInteractive" />
      {children}
    </>
  );
}
