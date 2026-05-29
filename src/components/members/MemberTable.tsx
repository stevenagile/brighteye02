import { useState, useMemo } from 'react';
import { useMembers, MemberLevel } from '@/hooks/useMembers';
import { MemberRow } from './MemberRow';
import { Input } from '@/components/ui/input';
import { Search, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function MemberTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<MemberLevel | 'all'>('all');
  const { data: members, isLoading } = useMembers();

  const { data: prescriptions } = useQuery({
    queryKey: ['prescriptions-credit-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('member_id, credit_used');
      if (error) throw error;
      return data;
    },
  });

  const memberCreditUsed = useMemo(() => {
    const map: Record<string, number> = {};
    prescriptions?.forEach((p) => {
      if (p.member_id && p.credit_used) {
        map[p.member_id] = (map[p.member_id] || 0) + Number(p.credit_used);
      }
    });
    return map;
  }, [prescriptions]);

  const filteredMembers = (members || []).filter((m) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(term) ||
      m.phone.includes(searchTerm) ||
      (m.email || '').toLowerCase().includes(term);
    const matchesLevel = levelFilter === 'all' || m.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  if (isLoading) {
    return (
      <div className="stat-card">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="stat-card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">客戶列表</h3>
            <p className="text-sm text-muted-foreground">
              共 {(members?.length || 0).toLocaleString()} 位客戶
              {filteredMembers.length !== (members?.length || 0) && (
                <span>（顯示 {filteredMembers.length.toLocaleString()} 筆）</span>
              )}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as any)}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="所有等級" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有等級</SelectItem>
                <SelectItem value="regular">一般客戶</SelectItem>
                <SelectItem value="silver">VIP 銀卡</SelectItem>
                <SelectItem value="gold">VIP 金卡</SelectItem>
                <SelectItem value="black">VIP 黑卡</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜尋姓名、電話或 Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{searchTerm || levelFilter !== 'all' ? '找不到符合的客戶' : '尚無客戶資料'}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="font-semibold">客戶資訊</TableHead>
                  <TableHead className="font-semibold">等級</TableHead>
                  <TableHead className="font-semibold">VIP 金額</TableHead>
                  <TableHead className="font-semibold">已折抵</TableHead>
                  <TableHead className="font-semibold">剩餘購物金</TableHead>
                  <TableHead className="font-semibold">入會日期</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    creditUsed={memberCreditUsed[member.id] || 0}
                    onEdit={setEditMember}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <EditMemberDialog
        member={editMember}
        open={!!editMember}
        onOpenChange={(open) => !open && setEditMember(null)}
      />
    </>
  );
}
