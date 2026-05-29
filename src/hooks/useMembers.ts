import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';
import { memberInputSchema, memberUpdateSchema, formatZodError } from '@/lib/validation';

export type Member = Tables<'members'>;
export type MemberInsert = TablesInsert<'members'>;
export type MemberLevel = 'regular' | 'gold' | 'silver' | 'black';

export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Member[];
    },
  });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: ['members', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Member | null;
    },
    enabled: !!id,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (member: MemberInsert) => {
      const parsed = memberInputSchema.safeParse(member);
      if (!parsed.success) throw new Error(formatZodError(parsed.error));
      const { data, error } = await supabase
        .from('members')
        .insert(parsed.data as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('會員新增成功');
    },
    onError: (error) => {
      toast.error('新增會員失敗：' + error.message);
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Member> & { id: string }) => {
      const parsed = memberUpdateSchema.safeParse(updates);
      if (!parsed.success) throw new Error(formatZodError(parsed.error));
      const { data, error } = await supabase
        .from('members')
        .update(parsed.data as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('會員更新成功');
    },
    onError: (error) => {
      toast.error('更新會員失敗：' + error.message);
    },
  });
}
}

export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('會員刪除成功');
    },
    onError: (error) => {
      toast.error('刪除會員失敗：' + error.message);
    },
  });
}
