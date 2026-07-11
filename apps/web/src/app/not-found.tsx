import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">404</p>
      <h1 className="mt-3 font-display text-4xl font-semibold">ไม่พบหน้านี้</h1>
      <p className="mt-2 max-w-md text-sm text-ink/60">
        หน้าที่คุณกำลังมองหาอาจถูกย้ายหรือไม่มีอยู่แล้ว
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">
          หน้าแรก
        </Link>
        <Link href="/shop" className="btn-outline">
          Shop
        </Link>
        <Link href="/marketplace" className="btn-outline">
          Marketplace
        </Link>
        <Link href="/account" className="btn-outline">
          บัญชีของฉัน
        </Link>
      </div>
    </div>
  );
}
