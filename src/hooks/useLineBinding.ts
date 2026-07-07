import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LineBinding {
  id: string;
  line_user_id: string;
  display_name: string | null;
  status: 'pending' | 'bound' | 'unbound';
  bound_at: string | null;
}

// 綁定碼字元集（與後端 gen_member_bind_code 一致，去除易混淆字元）
const BIND_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateBindCode(): string {
  let s = '';
  for (let i = 0; i < 8; i++) {
    s += BIND_ALPHABET[Math.floor(Math.random() * BIND_ALPHABET.length)];
  }
  return s;
}

// 查詢某會員目前的 LINE 綁定狀態
export function useMemberLineBinding(memberId?: string) {
  return useQuery({
    queryKey: ['line_binding', memberId],
    enabled: !!memberId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('line_bindings' as any)
        .select('id, line_user_id, display_name, status, bound_at')
        .eq('member_id', memberId!)
        .eq('status', 'bound')
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as LineBinding) ?? null;
    },
  });
}

// 重新產生綁定碼（舊碼即失效）
export function useRegenerateBindCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      const code = generateBindCode();
      const { data, error } = await supabase
        .from('members')
        .update({ bind_code: code } as any)
        .eq('id', memberId)
        .select('bind_code')
        .single();
      if (error) throw error;
      return (data as any).bind_code as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('已重新產生綁定碼');
    },
    onError: (error) => {
      toast.error('重新產生失敗：' + error.message);
    },
  });
}

// 解除綁定
export function useUnbindLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bindingId: string) => {
      const { error } = await supabase
        .from('line_bindings' as any)
        .update({ status: 'unbound', member_id: null } as any)
        .eq('id', bindingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['line_binding'] });
      toast.success('已解除綁定');
    },
    onError: (error) => {
      toast.error('解除綁定失敗：' + error.message);
    },
  });
}
