'use client';

import Link from "next/link";
import { useState } from "react";

type Interest = "Technology" | "Fashion" | "Home Decor" | "Outdoor" | "Books" | "Vintage";

export default function UserProfilePage() {
  const [name, setName] = useState("Alex Johnson");
  const [location, setLocation] = useState("San Francisco, CA");
  const [interests, setInterests] = useState<Interest[]>([
    "Technology",
    "Home Decor",
    "Books",
  ]);
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    priceDrops: true,
    newsletter: false,
  });

  const toggleInterest = (interest: Interest) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  const handleSaveProfile = () => {
    alert(`Profile saved:\nName: ${name}\nLocation: ${location}`);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 px-4 md:px-10 py-8 min-h-[calc(100vh-80px)]">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-6">
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#e7f3eb] shadow-sm">
          <div
            className="size-12 rounded-full bg-cover bg-center"
            style={{
              backgroundImage:
                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB9216dvtBHyVswL38uhew32TGK_lwa-Nbxt2f_cDEkrgiikmovrPu8XvUIf4zR62qSsHB53iJBrlocyGE398sOGO9-_TwhQ8He4eGTuz_lQl6Yu8z1Oh0MKFebgSPdpYDNsGn15v974D0c7UqdItCMh6yloXBtGyGMtd5ST2-C40iXzXFyEvOh95LCqdrmW6rDSs3guIRonwuddqdfTmWcd3Xgp_SoQA83_lG4Gd1qq5LS5GvD3w_VUtOL6zmhUYHFVaA8-00xSe0")',
            }}
          />
          <div className="flex flex-col overflow-hidden">
            <h3 className="font-semibold truncate">{name}</h3>
            <p className="text-xs text-[#4c9a66]">Member since 2021</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 bg-white p-2 rounded-xl border border-[#e7f3eb] shadow-sm">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 font-medium text-sm">
            <span className="material-symbols-outlined">person</span>
            Profile Info
          </button>
          <Link
            href="/orders"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#f5f6f8] text-sm transition-colors"
          >
            <span className="material-symbols-outlined">package_2</span>
            My Orders
          </Link>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#f5f6f8] text-sm transition-colors">
            <span className="material-symbols-outlined">favorite</span>
            Wishlist
          </button>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#f5f6f8] text-sm transition-colors">
            <span className="material-symbols-outlined">tune</span>
            Preferences
          </button>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#f5f6f8] text-sm transition-colors">
            <span className="material-symbols-outlined">settings</span>
            Settings
          </button>
        </nav>

        <div className="relative overflow-hidden rounded-xl p-5 bg-gradient-to-br from-[#102216] to-[#1a2e22] text-white">
          <div className="relative z-10 flex flex-col gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">
              local_offer
            </span>
            <h4 className="font-bold text-lg">Sell on Mollmart</h4>
            <p className="text-xs text-gray-300 mb-2">
              Turn your unused items into cash today.
            </p>
            <Link
              href="/seller/dashboard"
              className="w-full py-2 bg-primary text-[#0d1b12] text-xs font-bold rounded-lg hover:bg-green-400 transition-colors text-center"
            >
              Start Selling
            </Link>
          </div>
          <div className="absolute -bottom-8 -right-8 size-24 bg-primary/20 rounded-full blur-xl" />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col gap-8 min-w-0">
        {/* Profile header */}
        <section className="bg-white rounded-2xl p-6 border border-[#e7f3eb] shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div
                  className="size-24 md:size-28 rounded-full bg-cover bg-center border-4 border-[#f5f6f8] shadow-sm"
                  style={{
                    backgroundImage:
                      'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBkhpZwYMkyBPllfR-epIwRc195qP2xQXR05bLLClRJX7QuW1weyF0OHoepiMyBJKTeew7S47wzPkB1ZNRg1ODzSJTHguG-xvz8G41LrfNOJBOgaRA2oR9dN8UBfcjd2EiinPD6cy3MTniWGC9qtOMzed8CqOkdShUlz59UGHlMa1sB4fvyxukc_cKslsr_gE1JprFzfVaYwnqi4IPaXlfNItwxVi9tom8-Nov5PJW8TfL-bP2p_eDpxpgC9uvpKhebAwiYQedrVQ4")',
                  }}
                />
                <div className="absolute bottom-1 right-1 bg-blue-500 text-white p-1 rounded-full border-2 border-white">
                  <span className="material-symbols-outlined text-[16px] leading-none block">
                    verified
                  </span>
                </div>
              </div>
              <div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-2xl md:text-3xl font-bold mb-1 bg-transparent border-b border-transparent focus:border-primary focus:outline-none"
                />
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#4c9a66]">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">
                      shopping_bag
                    </span>
                    Verified Buyer
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">
                      location_on
                    </span>
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="bg-transparent border-b border-transparent focus:border-primary focus:outline-none text-xs"
                    />
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSaveProfile}
              className="w-full md:w-auto px-5 py-2.5 rounded-lg bg-[#f5f6f8] hover:bg-[#e7f3eb] border border-[#e7f3eb] text-sm font-bold flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              Save Profile
            </button>
          </div>
        </section>

        {/* Stats (статичные) */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-[#e7f3eb] shadow-sm flex flex-col gap-1">
            <p className="text-sm text-[#4c9a66] font-medium">Active Orders</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#0d1b12]">2</span>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-[#e7f3eb] shadow-sm flex flex-col gap-1">
            <p className="text-sm text-[#4c9a66] font-medium">Items Sold</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#0d1b12]">14</span>
              <span className="text-xs text-[#4c9a66] font-medium">Lifetime</span>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-[#e7f3eb] shadow-sm flex flex-col gap-1">
            <p className="text-sm text-[#4c9a66] font-medium">Reviews Given</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#0d1b12]">35</span>
              <span className="text-xs text-primary font-medium">High Trust</span>
            </div>
          </div>
        </section>

        {/* Interests & Notifications */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Interests */}
          <div className="bg-white p-6 rounded-xl border border-[#e7f3eb] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">interests</span>
                <h3 className="font-bold">Interests</h3>
              </div>
            </div>
            <p className="text-sm text-[#4c9a66] mb-4">
              Select topics to improve your recommendations.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "Technology",
                "Fashion",
                "Home Decor",
                "Outdoor",
                "Books",
                "Vintage",
              ].map((interest) => {
                const typed = interest as Interest;
                const active = interests.includes(typed);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(typed)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? "bg-primary/20 border-primary text-[#0d1b12]"
                        : "bg-[#f5f6f8] border-[#e7f3eb] text-[#4c9a66] hover:border-primary hover:text-primary"
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white p-6 rounded-xl border border-[#e7f3eb] shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">notifications</span>
              <h3 className="font-bold">Notifications</h3>
            </div>
            <div className="flex flex-col gap-4">
              <ToggleRow
                label="Order Updates"
                checked={notifications.orderUpdates}
                onChange={(v) =>
                  setNotifications((prev) => ({ ...prev, orderUpdates: v }))
                }
              />
              <ToggleRow
                label="Price Drops"
                checked={notifications.priceDrops}
                onChange={(v) =>
                  setNotifications((prev) => ({ ...prev, priceDrops: v }))
                }
              />
              <ToggleRow
                label="Newsletter"
                checked={notifications.newsletter}
                onChange={(v) =>
                  setNotifications((prev) => ({ ...prev, newsletter: v }))
                }
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

type ToggleRowProps = {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm text-[#0d1b12]">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
          checked
            ? "bg-primary border-primary"
            : "bg-[#f5f6f8] border-[#e7f3eb]"
        }`}
      >
        <span
          className={`absolute h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}

