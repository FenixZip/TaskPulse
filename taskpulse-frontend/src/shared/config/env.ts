// src/shared/config/env.ts


export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://pulse-zone.tech:8000";


// export const API_BASE_URL =
//   import.meta.env.VITE_API_BASE_URL || "http://pulse-zone.tech:8000";

export const TELEGRAM_BOT_URL =
  import.meta.env.VITE_TELEGRAM_BOT_URL || "https://t.me/pulse_zone_tech_bot";
