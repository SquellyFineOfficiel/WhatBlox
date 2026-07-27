/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_ROBLOX_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.css' {
  const content: string;
  export default content;
}

declare module 'tailwind-merge' {
  export function twMerge(...inputs: (string | undefined | null | false)[]): string;
  export function extendTailwindMerge<T>(config: T): typeof twMerge;
}

declare module 'lucide-react' {
  import { ComponentType, SVGAttributes } from 'react';
  export type LucideIcon = ComponentType<SVGAttributes<SVGSVGElement> & { size?: number; strokeWidth?: number }> & {
    displayName: string;
  };
  export const Shuffle: LucideIcon;
  export const Play: LucideIcon;
  export const Info: LucideIcon;
  export const Users: LucideIcon;
  export const Castle: LucideIcon;
  export const Radio: LucideIcon;
  export const Feather: LucideIcon;
  export const Swords: LucideIcon;
  export const Car: LucideIcon;
  export const Gem: LucideIcon;
  export const Gamepad2: LucideIcon;
  export const Music: LucideIcon;
  export const MapPin: LucideIcon;
  export const Brain: LucideIcon;
  export const Heart: LucideIcon;
  export const Star: LucideIcon;
  export const Zap: LucideIcon;
  export const Shield: LucideIcon;
  export const Sword: LucideIcon;
  export const Search: LucideIcon;
  export const X: LucideIcon;
  export const Check: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const Upload: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const CheckCheck: LucideIcon;
  export const Lock: LucideIcon;
  export const Loader2: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const Settings: LucideIcon;
  export const LogOut: LucideIcon;
  export const Menu: LucideIcon;
  export const Sparkles: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const Globe: LucideIcon;
  export const Sparkle: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Mail: LucideIcon;
}