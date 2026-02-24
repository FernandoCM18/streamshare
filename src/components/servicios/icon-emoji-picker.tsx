"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

const ICON_CATEGORIES = [
  {
    label: "Streaming",
    items: [
      { icon: "simple-icons:netflix", label: "Netflix" },
      { icon: "simple-icons:spotify", label: "Spotify" },
      { icon: "simple-icons:youtube", label: "YouTube" },
      { icon: "simple-icons:primevideo", label: "Prime Video" },
      { icon: "simple-icons:disneyplus", label: "Disney+" },
      { icon: "simple-icons:hbo", label: "HBO" },
      { icon: "simple-icons:appletv", label: "Apple TV" },
      { icon: "simple-icons:crunchyroll", label: "Crunchyroll" },
      { icon: "simple-icons:twitch", label: "Twitch" },
      { icon: "simple-icons:deezer", label: "Deezer" },
      { icon: "simple-icons:tidal", label: "Tidal" },
      { icon: "simple-icons:applemusic", label: "Apple Music" },
    ],
  },
  {
    label: "Productividad",
    items: [
      { icon: "simple-icons:notion", label: "Notion" },
      { icon: "simple-icons:figma", label: "Figma" },
      { icon: "simple-icons:slack", label: "Slack" },
      { icon: "simple-icons:canva", label: "Canva" },
      { icon: "simple-icons:openai", label: "ChatGPT" },
      { icon: "simple-icons:github", label: "GitHub" },
      { icon: "simple-icons:google", label: "Google" },
      { icon: "simple-icons:microsoft", label: "Microsoft" },
      { icon: "simple-icons:dropbox", label: "Dropbox" },
      { icon: "simple-icons:zoom", label: "Zoom" },
      { icon: "simple-icons:1password", label: "1Password" },
      { icon: "simple-icons:adobe", label: "Adobe" },
    ],
  },
  {
    label: "Gaming",
    items: [
      { icon: "simple-icons:playstation", label: "PlayStation" },
      { icon: "simple-icons:xbox", label: "Xbox" },
      { icon: "simple-icons:nintendoswitch", label: "Nintendo" },
      { icon: "simple-icons:steam", label: "Steam" },
      { icon: "simple-icons:epicgames", label: "Epic Games" },
      { icon: "simple-icons:riotgames", label: "Riot Games" },
    ],
  },
];

const EMOJI_CATEGORIES = [
  {
    label: "Entretenimiento",
    emojis: [
      "🎬",
      "🎵",
      "🎮",
      "📺",
      "🎧",
      "🎤",
      "🎸",
      "🎹",
      "📻",
      "🎭",
      "🎪",
      "🎨",
      "📷",
      "📹",
      "🎥",
      "🎞",
    ],
  },
  {
    label: "Tecnologia",
    emojis: [
      "💻",
      "📱",
      "🖥",
      "⌨️",
      "🖱",
      "💾",
      "📡",
      "🔌",
      "🤖",
      "⚡",
      "🔒",
      "🌐",
      "☁️",
      "🛡",
      "📊",
      "🧩",
    ],
  },
  {
    label: "Finanzas",
    emojis: ["💰", "💳", "💵", "🏦", "📈", "💎", "🪙", "🧾"],
  },
  {
    label: "Fitness & Salud",
    emojis: ["🏋️", "🧘", "🚴", "🏃", "💪", "🥗", "💊", "🩺"],
  },
  {
    label: "Educacion",
    emojis: ["📚", "🎓", "✏️", "📝", "🔬", "🧪", "📐", "🗂"],
  },
];

function isEmoji(value: string) {
  return !value.includes(":");
}

interface IconEmojiPickerProps {
  value: string | null;
  color: string;
  onChange: (value: string) => void;
}

export default function IconEmojiPicker({
  value,
  color,
  onChange,
}: IconEmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"icons" | "emojis">("icons");
  const containerRef = useRef<HTMLDivElement>(null);

  function selectValue(v: string) {
    onChange(v);
    setOpen(false);
  }

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-12 h-12 rounded-xl border border-neutral-800 bg-neutral-900/50 flex items-center justify-center relative overflow-hidden hover:border-neutral-700 transition-colors focus:outline-none group"
      >
        {value ? (
          isEmoji(value) ? (
            <span className="text-xl leading-none">{value}</span>
          ) : (
            <>
              <div
                className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ backgroundColor: color }}
              />
              <Icon
                icon={value}
                width={22}
                style={{ color }}
                className="relative z-10"
              />
            </>
          )
        ) : (
          <Icon
            icon="solar:tv-bold"
            width={22}
            className="text-neutral-400 group-hover:text-neutral-300 transition-colors"
          />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-14 left-0 z-50 w-72 bg-neutral-950 border border-neutral-800 rounded-xl shadow-xl animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Tabs */}
          <div className="flex border-b border-neutral-800">
            <button
              type="button"
              onClick={() => setTab("icons")}
              className={cn(
                "flex-1 py-2.5 text-xs font-medium transition-colors focus:outline-none",
                tab === "icons"
                  ? "text-white border-b-2 border-white"
                  : "text-neutral-500 hover:text-neutral-300",
              )}
            >
              Iconos
            </button>
            <button
              type="button"
              onClick={() => setTab("emojis")}
              className={cn(
                "flex-1 py-2.5 text-xs font-medium transition-colors focus:outline-none",
                tab === "emojis"
                  ? "text-white border-b-2 border-white"
                  : "text-neutral-500 hover:text-neutral-300",
              )}
            >
              Emojis
            </button>
          </div>

          {/* Scrollable content */}
          <div
            className="max-h-64 overflow-y-auto overscroll-contain p-3 space-y-3"
            onTouchMove={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            {tab === "icons"
              ? ICON_CATEGORIES.map((cat) => (
                  <div key={cat.label} className="space-y-1.5">
                    <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
                      {cat.label}
                    </span>
                    <div className="grid grid-cols-6 gap-1.5">
                      {cat.items.map((item) => (
                        <button
                          key={item.icon}
                          type="button"
                          onClick={() => selectValue(item.icon)}
                          title={item.label}
                          className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center transition-all focus:outline-none",
                            value === item.icon
                              ? "bg-neutral-700 ring-1 ring-white/20"
                              : "hover:bg-neutral-800",
                          )}
                        >
                          <Icon
                            icon={item.icon}
                            width={18}
                            className="text-neutral-300"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              : EMOJI_CATEGORIES.map((cat) => (
                  <div key={cat.label} className="space-y-1.5">
                    <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
                      {cat.label}
                    </span>
                    <div className="grid grid-cols-8 gap-1">
                      {cat.emojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => selectValue(emoji)}
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all focus:outline-none",
                            value === emoji
                              ? "bg-neutral-700 ring-1 ring-white/20"
                              : "hover:bg-neutral-800",
                          )}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
          </div>

          {/* Clear selection */}
          {value && (
            <div className="border-t border-neutral-800 p-2">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="w-full py-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors focus:outline-none"
              >
                Quitar icono
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
