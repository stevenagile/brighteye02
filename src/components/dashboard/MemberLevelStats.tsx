import { useMembers, MemberLevel } from '@/hooks/useMembers';
import { Crown, Medal, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const levelConfig: Record<MemberLevel, {
  icon: typeof Crown;
  label: string;
}> = {
  gold: { icon: Crown, label: '金卡會員' },
  silver: { icon: Medal, label: '銀卡會員' },
  black: { icon: Star, label: '黑卡會員' },
};

export function MemberLevelStats() {
  const { data: members, isLoading } = useMembers();

  if (isLoading) {
    return (
      <div className="stat-card">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-48 mb-6" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const levelCounts = (members || []).reduce((acc, member) => {
    acc[member.level] = (acc[member.level] || 0) + 1;
    return acc;
  }, {} as Record<MemberLevel, number>);

  const total = members?.length || 1;

  return (
    <div className="stat-card">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">會員等級分佈</h3>
        <p className="text-sm text-muted-foreground">各等級會員數量</p>
      </div>

      <div className="space-y-4">
        {(Object.keys(levelConfig) as MemberLevel[]).map((level) => {
          const config = levelConfig[level];
          const count = levelCounts[level] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          return (
            <div key={level} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <config.icon className="w-4 h-4" style={{
                    color: level === 'gold' ? 'hsl(45 93% 47%)' : 
                           level === 'silver' ? 'hsl(210 10% 60%)' : 
                           'hsl(0 0% 15%)'
                  }} />
                  <span className="text-sm font-medium text-foreground">
                    {config.label}
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {count} 人
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${percentage}%`,
                    background: level === 'gold' 
                      ? 'linear-gradient(90deg, hsl(38 92% 55%), hsl(45 90% 60%))' 
                      : level === 'silver'
                      ? 'linear-gradient(90deg, hsl(210 10% 55%), hsl(210 10% 70%))'
                      : 'linear-gradient(90deg, hsl(0 0% 20%), hsl(0 0% 35%))'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
