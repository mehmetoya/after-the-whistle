import SiteHeader from "@/components/SiteHeader";

export default function TrLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader locale="tr" />
      {children}
    </>
  );
}
