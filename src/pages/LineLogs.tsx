import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Search, User } from 'lucide-react';
import { useLineLogs, type LineLog } from '@/hooks/useLineLogs';
import { cn } from '@/lib/utils';

interface Conversation {
  userId: string;
  name: string | null;
  messages: LineLog[];
}

export default function LineLogs() {
  const { data: logs, isLoading } = useLineLogs();
  const [q, setQ] = useState('');

  const conversations = useMemo<Conversation[]>(() => {
    const map = new Map<string, Conversation>();
    for (const log of logs ?? []) {
      const key = log.line_user_id;
      if (!map.has(key)) map.set(key, { userId: key, name: log.members?.name ?? null, messages: [] });
      const g = map.get(key)!;
      if (!g.name && log.members?.name) g.name = log.members.name;
      g.messages.push(log);
    }
    let arr = Array.from(map.values()).map((g) => ({
      ...g,
      messages: g.messages.slice().sort((a, b) => a.created_at.localeCompare(b.created_at)),
    }));
    arr.sort((a, b) =>
      b.messages[b.messages.length - 1].created_at.localeCompare(a.messages[a.messages.length - 1].created_at),
    );
    const kw = q.trim().toLowerCase();
    if (kw) {
      arr = arr.filter(
        (g) =>
          g.name?.toLowerCase().includes(kw) ||
          g.messages.some((m) => (m.content ?? '').toLowerCase().includes(kw)),
      );
    }
    return arr;
  }, [logs, q]);

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />LINE 對話紀錄
          </h1>
          <div className="relative w-72 max-w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="搜尋會員姓名或訊息內容"
              value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : conversations.length === 0 ? (
          <div className="stat-card text-center py-16 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>尚無對話紀錄</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((c) => (
              <div key={c.userId} className="stat-card space-y-3">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold text-foreground">{c.name ?? '未綁定訪客'}</span>
                  <Badge variant="outline" className="text-xs">{c.messages.length} 則</Badge>
                  <span className="text-xs text-muted-foreground ml-auto font-mono">{c.userId.slice(0, 12)}…</span>
                </div>
                <div className="space-y-2">
                  {c.messages.map((m) => (
                    <div key={m.id} className={cn('flex', m.direction === 'outbound' ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-[78%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap',
                        m.direction === 'outbound' ? 'bg-primary/10' : 'bg-muted',
                      )}>
                        <div className="text-foreground">{m.content}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {new Date(m.created_at).toLocaleString('zh-TW')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
