"use client";

import React, { useEffect } from "react";
import Script from "next/script";

interface MetaPixelProps {
  pixelId?: string | null;
  isActive?: boolean;
  productId?: number;
  productName?: string;
  price?: number;
}

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
  }
}

export function MetaPixel({
  pixelId,
  isActive = false,
  productId,
  productName,
  price,
}: MetaPixelProps) {
  useEffect(() => {
    if (!isActive || !pixelId) return;

    // Dispara ViewContent via Pixel no navegador se disponível
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "ViewContent", {
        content_name: productName,
        content_ids: productId ? [String(productId)] : [],
        content_type: "product",
        value: price || 0,
        currency: "BRL",
      });
    }

    // Dispara evento simultâneo para a API de Conversões do Servidor (CAPI) para máxima precisão
    if (productId) {
      fetch(`/api/public/produtos/${productId}/meta-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_name: "ViewContent",
          event_source_url: window.location.href,
        }),
      }).catch(() => {});
    }
  }, [isActive, pixelId, productId, productName, price]);

  if (!isActive || !pixelId) {
    return null;
  }

  return (
    <>
      <Script
        id="meta-pixel-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt="Meta Pixel"
        />
      </noscript>
    </>
  );
}

export function trackMetaLead(productId?: number, productName?: string, price?: number) {
  try {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "Lead", {
        content_name: productName,
        content_ids: productId ? [String(productId)] : [],
        content_type: "product",
        value: price || 0,
        currency: "BRL",
      });
    }

    if (productId) {
      fetch(`/api/public/produtos/${productId}/meta-event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_name: "Lead",
          event_source_url: typeof window !== "undefined" ? window.location.href : "",
        }),
      }).catch(() => {});
    }
  } catch (err) {
    console.warn("Erro ao disparar Lead no Meta Ads:", err);
  }
}
