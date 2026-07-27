import {
  Castle,
  Radio,
  Feather,
  Swords,
  Car,
  Gem,
  Gamepad2,
  Music,
  MapPin,
  Brain,
  Heart,
  Star,
  Zap,
  Shield,
  Sword,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  castle: Castle,
  radio: Radio,
  feather: Feather,
  swords: Swords,
  car: Car,
  gem: Gem,
  gamepad2: Gamepad2,
  music: Music,
  mapPin: MapPin,
  brain: Brain,
  heart: Heart,
  star: Star,
  zap: Zap,
  shield: Shield,
  sword: Sword,
};

export function getIcon(iconName: string): LucideIcon {
  return iconMap[iconName] || Gamepad2;
}

export function getGradient(from: string, to: string): [string, string] {
  return [from, to];
}