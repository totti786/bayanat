"use client";

import { useLayoutEffect, useRef, useState } from "react";
import InvoiceDocument from "@/components/invoice/InvoiceDocument";
import ThemeStyle from "@/components/ThemeStyle";
import type { InvoiceDocumentData } from "@/components/invoice/types";

// A4 at 96dpi: 210mm ≈ 794px, 297mm ≈ 1123px.
const PAGE_W = 794;
const PAGE_H = 1123;

/**
 * Renders the exact same InvoiceDocument component used by the PDF pipeline,
 * scaled down to fit its container. Resizes live via ResizeObserver.
 */
export default function InvoicePreview({
  data,
  accent,
}: {
  data: InvoiceDocumentData;
  accent?: string | null;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / PAGE_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={frameRef} className="w-full overflow-hidden">
      <ThemeStyle accent={accent} />
      <div style={{ height: PAGE_H * scale, position: "relative" }}>
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: PAGE_W,
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          <InvoiceDocument {...data} />
        </div>
      </div>
    </div>
  );
}
