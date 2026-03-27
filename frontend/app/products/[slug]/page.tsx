'use client';

import Link from "next/link";
import { useState } from "react";

const MAIN_IMAGES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD8Kh_2ZTubCIMDWX-AgEEwXfBEVtdyZcfdcrRqzQRb17X0f-Upd3DO1L0WiTOPUpyvGsPRCg7h9EiPVAuz7LwkZMxpBZ2vPSIcoublDuu5mkC1HNpMRUbQPU8fbcBH602Mf7yCxm1PA35qFALYtWeRFUu_rrKrnUQsI7OPu5e0OChjrV2FORYW98A4u51mK3XqiY9fY2y-R1AA_s7oC2NIIlwc5okFHPM3ZCLYs3fXMQ3HS9uGJBMWJO5rf8qVAlC6Qca1zRdYL8g",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD87QWBfu0vL8Agkp4-9jYcfNg9Xb5_jofHJRmJ_pH_rTIile12Xt_nQ9wkhV9aTLYdPn1NhduG7I_iLQ9gVWGkf1JZdRY0hEOR9aTD9GgnfYna82GdF0dJs3YWjyhjq2RlwJlQ64JliA5Y_vllbx2_Gz8KC-YZjMVpFC2T2AMcCJJGPS4ooePG3owNAnmC0O9AR8bYETQI9IO4WmP62Hgb0thKuE-Z91HtT7GwkemgMGpKQ8OQY3LC19HKMzHKkKx-NHu_TyyqcuA",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBf73FTCoflMoPQrza4m4uORxtUXcyXJ-jRedmOpKah1P2PY3sqQBiEdULwsYUhZ0Vr0I1dPs28utrMKAQeowUEdKHC99MaVdpQdFKA_JjeAJQGNvneKtE9ne2nJMjE2gJHAmpSY041tebsxleGseKEeECx05YWs1gab82nAGxILG762DWqfU3hz2BV1Ir_Yz-Oum_22s4mhW3Pmm7Ugy9APYv0nhXaZFbDM12ZFzO-PxB4PqyMJ1VSSpkuG9PUKYBmcJx_NoYdEVc",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCQAdTt9NL3Q_Ylxp_-qwNANKOaSrn88r1Wr6uLZphxFIakIxzIg6cKGSSiRU0HZQzJEo2U36DrECeWAtNro-bp7O2Kec4EPmmYNNd0I81W0u4wPo56x6NPd6ZDVsFr1BCLwDhFGV1iiuqAEkg0e8ti4OYwyBmg5o37c0ts9cNLuZGwcChoNe5Wehzo5wyas6NTDv7Z1z4j33WDxr0fu5rg5gV3zgpFfeMkXvQFOtlH-UbfH0Pb2j38BLmGC9-2UBX9lIO9LauBoPE",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBicudYufkLRdbjQ-qKTNPhmEJKeK4GqqwBUGWbBNKP-01bwzA86pkrGIWwJmbAWQQKYdnU1q5f4VkQaZmD25PHVqNOlNnj2ZHvdFqKQVsOBjG71F8KvtlToJBqlMmNiNaHZUNAVmxaqS1npqN9NEyf1h3g-Ov783urOrNhx5Xe9Jmx9eCA_2vKugpQ-9uJqMoRqK5UCnAxFiHEDtivqiTkCceFc580qlbVEGK8OWW1DJfn4Tph7ra5Sh_bhOp96W0O0iX7wlDfeQM",
];

type PageProps = {
  params: { slug: string };
};

export default function ProductDetailsPage({ params }: PageProps) {
  // Пока один продукт, но slug пригодится, когда появятся другие
  const { slug } = params;
  const [activeIndex, setActiveIndex] = useState(0);
  const [offer, setOffer] = useState<string>("");
  const [offerError, setOfferError] = useState<string | null>(null);

  const handleSendOffer = () => {
    const value = Number(offer);
    if (!offer || Number.isNaN(value) || value <= 0) {
      setOfferError("Введите корректную сумму предложения.");
      return;
    }
    setOfferError(null);
    alert(`Ваше предложение $${value.toFixed(2)} отправлено продавцу (демо).`);
  };

  const mainImage = MAIN_IMAGES[activeIndex] ?? MAIN_IMAGES[0];

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-10 lg:px-20 py-6">
      {/* Breadcrumbs */}
      <div className="flex flex-wrap gap-2 pb-6 px-4">
        <Link href="/" className="text-[#4c9a66] text-sm font-medium hover:underline">
          Home
        </Link>
        <span className="text-[#4c9a66] text-sm font-medium">/</span>
        <a className="text-[#4c9a66] text-sm font-medium hover:underline" href="#">
          Electronics
        </a>
        <span className="text-[#4c9a66] text-sm font-medium">/</span>
        <a className="text-[#4c9a66] text-sm font-medium hover:underline" href="#">
          Audio
        </a>
        <span className="text-[#4c9a66] text-sm font-medium">/</span>
        <span className="text-[#0d1b12] text-sm font-medium">Headphones</span>
      </div>

      {/* Product Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 px-4">
        {/* Left: gallery */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="w-full aspect-square md:aspect-[4/3] bg-white rounded-xl border border-[#e7f3eb] overflow-hidden relative group">
            <div
              className="w-full h-full bg-center bg-contain bg-no-repeat p-8 transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundImage: `url("${mainImage}")` }}
            />
            <button className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-[#0d1b12] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined">favorite</span>
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {MAIN_IMAGES.map((img, index) => (
              <button
                key={img}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`flex-shrink-0 size-20 md:size-24 rounded-lg bg-white p-2 border ${
                  activeIndex === index ? "border-primary" : "border-transparent hover:border-[#e7f3eb]"
                }`}
              >
                <div
                  className="w-full h-full bg-center bg-cover bg-no-repeat rounded"
                  style={{ backgroundImage: `url("${img}")` }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right: details */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-1 rounded bg-[#e7f3eb] text-[#4c9a66] text-xs font-bold uppercase tracking-wider">
                Best Seller
              </span>
              <span className="px-2 py-1 rounded bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider">
                Low Stock
              </span>
            </div>
            <h1 className="text-[#0d1b12] text-3xl md:text-4xl font-bold leading-tight">
              Sony WH-1000XM5 Wireless Noise Canceling Headphones
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex text-primary">
                <span className="material-symbols-outlined text-[20px]">star</span>
                <span className="material-symbols-outlined text-[20px]">star</span>
                <span className="material-symbols-outlined text-[20px]">star</span>
                <span className="material-symbols-outlined text-[20px]">star</span>
                <span className="material-symbols-outlined text-[20px]">star_half</span>
              </div>
              <span className="text-[#0d1b12] font-bold">4.8</span>
              <a
                href="#reviews"
                className="text-[#4c9a66] underline decoration-[#4c9a66]/50 hover:decoration-[#4c9a66] text-sm"
              >
                (1,240 reviews)
              </a>
            </div>
          </div>

          {/* Price */}
          <div className="p-5 rounded-xl bg-white border border-[#e7f3eb] shadow-sm">
            <div className="flex flex-col gap-1">
              <p className="text-[#4c9a66] text-xs font-bold uppercase tracking-wider">
                Asking Price
              </p>
              <div className="flex items-end gap-3">
                <p className="text-[#0d1b12] text-4xl font-black tracking-tight">$348.00</p>
                <p className="text-[#4c9a66] text-lg line-through mb-1.5">$399.99</p>
                <span className="mb-2 px-2 py-0.5 rounded-full bg-primary/20 text-[#0d1b12] text-xs font-bold">
                  -13%
                </span>
              </div>
              <p className="text-[#4c9a66] text-sm">Free shipping on orders over $50</p>
            </div>
          </div>

          {/* Seller */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#e7f3eb]">
            <div className="flex items-center gap-3">
              <div
                className="size-10 rounded-full bg-gray-200 bg-center bg-cover"
                style={{
                  backgroundImage:
                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB60yniJhXZnD2wF1VD5X1ijEtrgO0AT1QHX6Bn20357uhIOvC8TtZGTEpBriZ10Lr8dhpm9OSN37WJj_ROvJbEKgKU1szVYOKZiPnWGIJXRfuJv3QYOdf4oofNrw0fzN9m7d8U7-M67YK5Qmev8Zw-0ibuFsP64q2iaCf7V5-FaHpOop3j19FVhQZHP2TzeNjgl7H1VNIOkwZPsJebXCsPhx7HmA--JjgEJnWrS5VAz9UpJbIzWt6B0fvFAJqatGie5p_0KWyDNns")',
                }}
              />
              <div className="flex flex-col">
                <p className="text-[#0d1b12] font-bold text-sm">Sold by TechGiant</p>
                <div className="flex items-center gap-1 text-xs text-[#4c9a66]">
                  <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                  <span>Verified Seller</span>
                  <span>•</span>
                  <span>98% Positive</span>
                </div>
              </div>
            </div>
            <button className="text-[#0d1b12] text-sm font-bold hover:text-primary">
              View Profile
            </button>
          </div>

          {/* Offer */}
          <div className="flex flex-col gap-4 p-5 rounded-xl bg-white border-2 border-primary/20 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">payments</span>
              <h3 className="text-[#0d1b12] font-bold text-lg">Make an Offer</h3>
            </div>
            <p className="text-[#4c9a66] text-sm">
              Think this product is worth a different price? Let the seller know what you&apos;re
              willing to pay.
            </p>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <span className="text-[#4c9a66] text-lg font-medium">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                  className="block w-full rounded-lg border-[#e7f3eb] bg-[#f5f6f8] py-3 pl-8 pr-4 text-[#0d1b12] focus:border-primary focus:ring-primary sm:text-lg font-bold"
                  placeholder="0.00"
                />
              </div>
              {offerError && (
                <p className="text-xs text-red-600">
                  {offerError}
                </p>
              )}
              <button
                type="button"
                onClick={handleSendOffer}
                className="w-full h-12 rounded-lg bg-primary hover:bg-[#4a63e8] text-white text-base font-bold shadow-md transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">send</span>
                Send Offer
              </button>
            </div>
            <p className="text-[10px] text-[#4c9a66] text-center uppercase tracking-widest">
              Sellers usually respond within 24 hours
            </p>
          </div>

          {/* Short description */}
          <div className="pt-4 border-t border-[#e7f3eb] text-[#0d1b12]/80 text-sm space-y-2">
            <p>
              Industry-leading noise cancellation optimized to you. Magnificent Sound, engineered to
              perfection. Crystal clear hands-free calling. Up to 30-hour battery life with quick
              charging (3 min charge for 3 hours of playback).
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Ultra-comfortable, lightweight design</li>
              <li>Multipoint connection</li>
              <li>Carry case included</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

