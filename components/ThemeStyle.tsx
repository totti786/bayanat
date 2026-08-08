import { themeCss } from "@/lib/theme";

export default function ThemeStyle({ accent }: { accent?: string | null }) {
  if (!accent) return null;
  return <style>{themeCss(accent)}</style>;
}
