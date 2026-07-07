import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Search, User, Send, Headset, Bot } from 'lucide-react';
import { useLineLogs, type LineLog } from '@/hooks/useLineLogs';
import { useLineBindings, useSetHumanMode, useStaffReply } from '@/hooks/useLineHandoff';
import { cn } from '@/lib/utils';

interface Conversation {
  userId: string;
  name: string | null;
  messages: LineLog[];
}

export default function LineLogs() {
  const { data: logs, isLoading } = useLineLogs();
  const { data: bindings } = useLineBindings();
  const setMode = useSetHumanMode();
  const reply = useStaffReply();
  const [q, setQ] = useState('');
  const [onlyHuman, setOnlyHuman] = useState(false);

  const humanMap = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const b of bindings ?? []) m.set(b.line_user_id, b.human_mode);
    return m;
  }, [bindings]);

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
        (g) => g.name?.toLowerCase().includes(kw) || g.messages.some((m) => (m.content ?? '').toLowerCase().includes(kw)),
      );
    }
    if (onlyHuman) arr = arr.filter((g) => humanMap.get(g.userId));
    return arr;
  }, [logs, q, onlyHuman, humanMap]);

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />LINE 對話紀錄
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant={onlyHuman ? 'default' : 'outline'} size="sm" onClick={() => setOnlyHuman((v) => !v)}>
              <Headset className="w-4 h-4 mr-1" />只看真人待處理
            </Button>
            <div className="relative w-64 max-w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="搜尋會員或訊息"
                value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
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
              <ConversationCard
                key={c.userId}
                conversation={c}
                humanMode={!!humanMap.get(c.userId)}
                onSetMode={(human) => setMode.mutate({ lineUserId: c.userId, human_mode: human })}
                onReply={(msg) => reply.mutate({ lineUserId: c.userId, message: msg })}
                replyPending={reply.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function ConversationCard({
  conversation, humanMode, onSetMode, onReply, replyPending,
}: {
  conversation: Conversation;
  humanMode: boolean;
  onSetMode: (human: boolean) => void;
  onReply: (msg: string) => void;
  replyPending: boolean;
}) {
  const [textVal, setTextVal] = useState('');
  const send = () => {
    const t = textVal.trim();
    if (!t) return;
    onReply(t);
    setTextVal('');
  };

  return (
    <div className="stat-card space-y-3">
      <div className="flex items-center gap-2 border-b border-border pb-2 flex-wrap">
        <User className="w-4 h-4 text-muted-foreground" />
        <span className="font-semibold text-foreground">{conversation.name ?? '未綁定訪客'}</span>
        <Badge variant="outline" className="text-xs">{conversation.messages.length} 則</Badge>
        {humanMode && (
          <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">
            <Headset className="w-3 h-3 mr-1" />真人服務中
          </Badge>
        )}
        <span className="text-xs text-muted-foreground ml-auto font-mono">{conversation.userId.slice(0, 12)}…</span>
        {humanMode ? (
          <Button size="sm" variant="outline" onClick={() => onSetMode(false)}>
            <Bot className="w-3.5 h-3.5 mr-1" />交還 AI
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => onSetMode(true)}>
            <Headset className="w-3.5 h-3.5 mr-1" />接手真人
          </Button>
        )}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {conversation.messages.map((m) => (
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

      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <Input
          placeholder={humanMode ? '輸入回覆訊息…' : '建議先接手再回覆,避免與 AI 撞口'}
          value={textVal}
          onChange={(e) => setTextVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
        />
        <Button size="sm" onClick={send} disabled={!textVal.trim() || replyPending}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
