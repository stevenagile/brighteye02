import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BroadcastResult {
  total: number;
  sent: number;
  failed: number;
}

// 預估收件人數:選定等級 + 同意通知 + 已綁定
export function useCampaignRecipientCount(levels: string[]) {
  return useQuery({
    queryKey: ['campaign_count', levels],
    enabled: levels.length > 0,
    queryFn: async () => {
      const { count, error } = await (supabase.from('members') as any)
        .select('id, line_bindings!inner(status)', { count: 'exact', head: true })
        .in('level', levels)
        .eq('line_notify_opt_in', true)
        .eq('line_bindings.status', 'bound');
      if (error) throw error;
      return count ?? 0;
    },
  });
}

// 送出群發推播(呼叫 line-broadcast Edge Function)
export function useSendBroadcast() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ levels, message }: { levels: string[]; message: string }) => {
      const { data, error } = await supabase.functions.invoke('line-broadcast', {
        body: { levels, message },
      });
      if (error) throw error;
      return data as BroadcastResult;
    },
    onSuccess: (d) => {
      queryClient.invalidateQueries({ queryKey: ['campaign_history'] });
      toast.success(`已送出:成功 ${d.sent} 則,失敗 ${d.failed} 則(共 ${d.total})`);
    },
    onError: (e) => toast.error('發送失敗:' + e.message),
  });
}

// 近期群發發送紀錄
export function useCampaignHistory() {
  return useQuery({
    queryKey: ['campaign_history'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('line_push_jobs' as any) as any)
        .select('id, member_id, status, sent_at, created_at, payload, members(name)')
        .eq('type', 'campaign')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data as any[]) ?? [];
    },
  });
}
