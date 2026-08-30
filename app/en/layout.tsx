import SiteHeader from "@/components/SiteHeader";

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader locale="en" />
      {children}
    </>
  );
}
