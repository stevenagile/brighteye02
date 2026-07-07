import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LineLog {
  id: string;
  line_user_id: string;
  member_id: string | null;
  direction: 'inbound' | 'outbound';
  message_type: string | null;
  content: string | null;
  created_at: string;
  members?: { name: string } | null;
}

// 取最近的 LINE 對話紀錄(含會員姓名)
export function useLineLogs() {
  return useQuery({
    queryKey: ['line_logs'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('line_message_logs' as any) as any)
        .select('id, line_user_id, member_id, direction, message_type, content, created_at, members(name)')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data as unknown as LineLog[]) ?? [];
    },
  });
}
