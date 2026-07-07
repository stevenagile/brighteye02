import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, RefreshCw, Link2, Link2Off, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useMemberLineBinding, useRegenerateBindCode, useUnbindLine,
} from '@/hooks/useLineBinding';

interface LineBindingPanelProps {
  memberId: string;
  bindCode?: string | null;
}

export function LineBindingPanel({ memberId, bindCode }: LineBindingPanelProps) {
  const { data: binding, isLoading } = useMemberLineBinding(memberId);
  const regenerate = useRegenerateBindCode();
  const unbind = useUnbindLine();

  const copyCode = async () => {
    if (!bindCode) return;
    try {
      await navigator.clipboard.writeText(bindCode);
      toast.success('已複製綁定碼');
    } catch {
      toast.error('複製失敗，請手動選取');
    }
  };

  const isBound = binding?.status === 'bound';

  return (
    <div className="space-y-4">
      {/* 綁定狀態 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">綁定狀態</span>
        {isLoading ? (
          <Badge variant="outline">查詢中…</Badge>
        ) : isBound ? (
          <Badge className="bg-primary/15 text-primary border-primary/30">
            <Link2 className="w-3 h-3 mr-1" />已綁定
            {binding?.display_name ? `（${binding.display_name}）` : ''}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            <Link2Off className="w-3 h-3 mr-1" />未綁定
          </Badge>
        )}
        {isBound && binding?.bound_at && (
          <span className="text-xs text-muted-foreground">
            綁定於 {new Date(binding.bound_at).toLocaleDateString('zh-TW')}
          </span>
        )}
      </div>

      {/* 綁定碼 */}
      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">綁定碼</span>
        <div className="flex items-center gap-2 flex-wrap">
          <code className="px-4 py-2 rounded-lg bg-muted font-mono text-lg tracking-widest text-foreground">
            {bindCode || '—'}
          </code>
          <Button variant="outline" size="sm" onClick={copyCode} disabled={!bindCode}>
            <Copy className="w-4 h-4 mr-1" />複製
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={regenerate.isPending}>
                {regenerate.isPending
                  ? <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  : <RefreshCw className="w-4 h-4 mr-1" />}
                重新產生
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>重新產生綁定碼？</AlertDialogTitle>
                <AlertDialogDescription>
                  產生新綁定碼後，舊的綁定碼將立即失效。已完成綁定的客戶不受影響。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={() => regenerate.mutate(memberId)}>
                  確認重新產生
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <p className="text-xs text-muted-foreground">
          請客戶加入官方帳號好友後，於 LINE 輸入此綁定碼即可完成綁定。
        </p>
      </div>

      {/* 解除綁定 */}
      {isBound && binding && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm"
              className="text-destructive hover:text-destructive" disabled={unbind.isPending}>
              <Link2Off className="w-4 h-4 mr-1" />解除綁定
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>解除 LINE 綁定？</AlertDialogTitle>
              <AlertDialogDescription>
                解除後，此客戶的 LINE 將無法再查詢會員資料，需重新以綁定碼綁定。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => unbind.mutate(binding.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                確認解除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
