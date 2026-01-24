import { MemberLevel } from '@/hooks/useMembers';
import { Crown, Medal, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemberBadgeProps {
  level: MemberLevel;
  size?: 'sm' | 'md';
}

const levelConfig: Record<MemberLevel, {
  icon: typeof Crown;
  label: string;
  className: string;
}> = {
  gold: { 
    icon: Crown, 
    label: '金卡',
    className: 'member-badge-gold'
  },
  silver: { 
    icon: Medal, 
    label: '銀卡',
    className: 'member-badge-silver'
  },
  black: { 
    icon: Star, 
    label: '黑卡',
    className: 'member-badge-black'
  },
};

export function MemberBadge({ level, size = 'md' }: MemberBadgeProps) {
  const config = levelConfig[level];
  const Icon = config.icon;

  return (
    <span className={cn(
      config.className,
      size === 'sm' && 'px-2 py-0.5 text-xs'
    )}>
      <Icon className={cn(
        "mr-1",
        size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
      )} />
      {config.label}
    </span>
  );
}
