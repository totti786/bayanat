import { formatHijriDate, type Lang, type Numerals } from "@/lib/format";

export default function HijriLine({
  date,
  lang,
  numerals,
  enabled,
}: {
  date: Date | string;
  lang: Lang;
  numerals: Numerals;
  enabled?: boolean;
}) {
  if (!enabled) return null;
  return (
    <p className="text-[9px] leading-relaxed text-neutral-400" dir="rtl">
      {formatHijriDate(date, lang, numerals)}
    </p>
  );
}
