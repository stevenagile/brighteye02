import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Send, Users, Loader2, History } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useCampaignRecipientCount, useSendBroadcast, useCampaignHistory,
} from '@/hooks/useLineBroadcast';

const LEVELS = [
  { value: 'regular', label: '一般客戶' },
  { value: 'silver', label: 'VIP 銀卡' },
  { value: 'gold', label: 'VIP 金卡' },
  { value: 'black', label: 'VIP 黑卡' },
];

const STATUS_LABEL: Record<string, string> = {
  sent: '已送出', failed: '失敗', pending: '處理中', skipped: '略過',
};

export default function LinePush() {
  const [levels, setLevels] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const { data: count } = useCampaignRecipientCount(levels);
  const send = useSendBroadcast();
  const { data: history } = useCampaignHistory();

  const toggle = (v: string) =>
    setLevels((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));
  const canSend = levels.length > 0 && message.trim().length > 0;

  const handleSend = async () => {
    await send.mutateAsync({ levels, message: message.trim() });
    setMessage('');
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Send className="w-6 h-6" />LINE 行銷推播
        </h1>

        {/* 撰寫 */}
        <div className="stat-card space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">發送對象(會員等級)</p>
            <div className="flex flex-wrap gap-4">
              {LEVELS.map((l) => (
                <label key={l.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={levels.includes(l.value)} onCheckedChange={() => toggle(l.value)} />
                  <span>{l.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-2">訊息內容</p>
            <Textarea rows={5} value={message} maxLength={1000}
              placeholder="輸入要群發的訊息內容…"
              onChange={(e) => setMessage(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">{message.length}/1000</p>
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              預估收件人:
              <span className="font-bold text-foreground">{levels.length ? (count ?? '…') : 0}</span> 人
              <span className="text-xs">(已綁定且同意通知)</span>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={!canSend || send.isPending}
                  className="gradient-primary text-primary-foreground">
                  {send.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                  送出推播
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>確認發送群發推播?</AlertDialogTitle>
                  <AlertDialogDescription>
                    將對約 {count ?? 0} 位符合條件的會員發送訊息。主動推播會計入 LINE 官方帳號的月額度,請確認內容無誤。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSend}>確認送出</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* 發送紀錄 */}
        <div className="stat-card space-y-3">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <History className="w-4 h-4" />近期發送紀錄
          </h3>
          {history && history.length > 0 ? (
            <div className="space-y-1">
              {history.map((j) => (
                <div key={j.id} className="flex items-center justify-between gap-3 text-sm border-b border-border/40 py-2">
                  <span className="text-muted-foreground w-36 shrink-0">
                    {new Date(j.sent_at ?? j.created_at).toLocaleString('zh-TW')}
                  </span>
                  <span className="font-medium w-24 shrink-0 truncate">{j.members?.name ?? '—'}</span>
                  <span className="flex-1 truncate text-muted-foreground">{j.payload?.text ?? ''}</span>
                  <Badge variant={j.status === 'sent' ? 'default' : 'outline'}
                    className={j.status === 'failed' ? 'text-destructive' : ''}>
                    {STATUS_LABEL[j.status] ?? j.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">尚無發送紀錄</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
