import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LineBindingRow {
  id: string;
  line_user_id: string;
  member_id: string | null;
  status: string;
  human_mode: boolean;
}

// 取所有綁定列(含 human_mode),供對話頁判斷是否真人模式
export function useLineBindings() {
  return useQuery({
    queryKey: ['line_bindings_all'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('line_bindings' as any) as any)
        .select('id, line_user_id, member_id, status, human_mode');
      if (error) throw error;
      return (data as LineBindingRow[]) ?? [];
    },
  });
}

// 接手 / 交還 AI
export function useSetHumanMode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lineUserId, human_mode }: { lineUserId: string; human_mode: boolean }) => {
      const patch: any = { human_mode };
      if (human_mode) patch.handoff_at = new Date().toISOString();
      const { error } = await (supabase.from('line_bindings' as any) as any)
        .update(patch).eq('line_user_id', lineUserId);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ['line_bindings_all'] });
      toast.success(v.human_mode ? '已接手真人客服' : '已交還 AI 客服');
    },
    onError: (e) => toast.error('操作失敗:' + e.message),
  });
}

// 店員回覆客戶
export function useStaffReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lineUserId, message }: { lineUserId: string; message: string }) => {
      const { data, error } = await supabase.functions.invoke('line-reply', {
        body: { line_user_id: lineUserId, message },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['line_logs'] });
      toast.success('已送出');
    },
    onError: (e) => toast.error('送出失敗:' + e.message),
  });
}
