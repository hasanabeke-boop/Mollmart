'use client';

import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: number;
  from: "me" | "seller";
  text: string;
  time: string;
  type?: "offer" | "system";
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    from: "seller",
    text: "Hi! Yes, the lens is in mint condition. I barely used it for a year.",
    time: "10:42 AM",
  },
  {
    id: 2,
    from: "me",
    text: "That sounds perfect! Does it come with the original lens cap and box?",
    time: "10:44 AM",
  },
  {
    id: 3,
    from: "seller",
    text: "Absolutely, full original packaging included.",
    time: "10:45 AM",
  },
];

let nextId = 100;

export default function ChatWithSellerPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    const now = new Date();
    const time = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages((prev) => [
      ...prev,
      { id: nextId++, from: "me", text, time },
    ]);
    setInput("");
  };

  const sendOffer = () => {
    const value = prompt("Enter your offer price (e.g. 110):");
    if (!value) return;
    const num = Number(value);
    if (Number.isNaN(num) || num <= 0) {
      alert("Please enter a valid number.");
      return;
    }
    const now = new Date();
    const time = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages((prev) => [
      ...prev,
      {
        id: nextId++,
        from: "me",
        text: `Offer: $${num.toFixed(2)}`,
        time,
        type: "offer",
      },
    ]);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-[#f5f6f8]">
      {/* Chat header (упрощённый из макета) */}
      <div className="flex-none flex items-center justify-between px-6 py-3 border-b border-[#e7f3eb] bg-white">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="bg-center bg-no-repeat bg-cover rounded-full size-10"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDm0iUsxivA_SuKl8RFN-YRTJXEv735l3-lukZidmOvJiTHVqdFjWyUpRcInHSnNlT4Bq2Uwul7HK7PXV8ILKISsGmPcnW8utE7qgBt4avSa7x8ntXw4Oywd_4k5cshZEi8pdOLRcWsYAfYpoffhOcMinl3h_aPSaXn-3oxxJUFtxIyHZk06ubI8i7348myhBfownfFc66s4Q2u26WU-8a87dz9mQVXhJdhr3xe3hw4IzNTzqmnIw3dhpU1ciybKZNOS7q-6-2IAUA")',
              }}
            />
            <span className="absolute bottom-0 right-0 size-2.5 bg-primary border-2 border-white rounded-full" />
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight">PhotoPro22</h3>
            <p className="text-xs text-[#4c9a66] flex items-center gap-1">
              Active now <span className="size-1 rounded-full bg-primary inline-block" />
            </p>
          </div>
        </div>
      </div>

      {/* Chat content */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex justify-center">
          <span className="text-xs font-medium text-[#4c9a66] bg-white px-3 py-1 rounded-full shadow-sm">
            Today
          </span>
        </div>
        {messages.map((m) =>
          m.from === "seller" ? (
            <div key={m.id} className="flex gap-3 max-w-[80%]">
              <div
                className="bg-center bg-no-repeat bg-cover rounded-full size-8 shrink-0 self-end mb-1"
                style={{
                  backgroundImage:
                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAvr5U-_hSwrzMR4SFkuxB0hWbvWFGba4ZkapjwRM9Eqa0L8VIPSdInOmiQSA4LgZVCuj8pDazb2jq-VZvqXP6Lp89ixoRT3UhPzUfqS4eOJkTD2HFc79P26PKsciOuBPpcPVxHD6D_Xa18bRoTQA9ss5UKdcQ-VNEgyRxZzjX5azJHeOVPI4ZwOeK1uy8e8u5gZ6IX_P90ZDHckTrDutULrKXQAgq8S4zvSL_CBNUZFnNRJ22v8tJ5Dk8q0HZVB14e543vUMAgeGc")',
                }}
              />
              <div className="flex flex-col gap-1">
                <div className="bg-white text-[#0d1b12] p-3 rounded-2xl rounded-bl-none shadow-sm border border-[#e7f3eb]">
                  <p className="text-sm leading-relaxed">{m.text}</p>
                </div>
                <span className="text-[10px] text-[#4c9a66] ml-1">{m.time}</span>
              </div>
            </div>
          ) : (
            <div
              key={m.id}
              className="flex flex-row-reverse gap-3 max-w-[80%] ml-auto"
            >
              <div className="flex flex-col gap-1 items-end">
                <div
                  className={`p-3 rounded-2xl rounded-br-none shadow-md ${
                    m.type === "offer"
                      ? "bg-white border-2 border-primary text-[#0d1b12]"
                      : "bg-primary text-green-950"
                  }`}
                >
                  <p className="text-sm leading-relaxed font-medium">{m.text}</p>
                </div>
                <span className="text-[10px] text-[#4c9a66] mr-1">{m.time}</span>
              </div>
            </div>
          ),
        )}
      </div>

      {/* Input area */}
      <div className="flex-none p-4 bg-white border-t border-[#e7f3eb]">
        <form
          className="flex items-end gap-2 max-w-4xl mx-auto"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <button
            type="button"
            className="size-10 flex items-center justify-center text-[#4c9a66] hover:text-primary rounded-full hover:bg-[#f5f6f8] transition-colors shrink-0"
            title="Make Offer"
            onClick={sendOffer}
          >
            <span className="material-symbols-outlined">payments</span>
          </button>
          <div className="flex-1 bg-[#f5f6f8] rounded-2xl border border-transparent focus-within:border-primary/50 transition-colors flex items-center px-4 py-2 min-h-[48px]">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-transparent border-none focus:ring-0 text-[#0d1b12] placeholder:text-[#4c9a66]"
            />
          </div>
          <button
            type="submit"
            className="size-12 flex items-center justify-center bg-primary hover:bg-[#0eb544] text-white rounded-full shadow-lg shadow-primary/30 transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-[24px]">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}

