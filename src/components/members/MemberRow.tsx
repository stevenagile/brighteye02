import { useNavigate } from 'react-router-dom';
import { Member } from '@/hooks/useMembers';
import { MemberBadge } from './MemberBadge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  Edit, Phone, Mail, CreditCard, Wallet, TrendingDown, ChevronRight,
} from 'lucide-react';

interface MemberRowProps {
  member: Member;
  creditUsed: number;
}

const calculateAge = (birthday: string | null) => {
  if (!birthday) return null;
  const today = new Date();
  const b = new Date(birthday);
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age;
};

export function MemberRow({ member, creditUsed }: MemberRowProps) {
  const navigate = useNavigate();
  const remaining = Number(member.shopping_credit) - creditUsed;
  const age = calculateAge(member.birthday);

  const goDetail = () => navigate(`/members/${member.id}`);

  return (
    <TableRow
      className="hover:bg-muted/30 transition-colors cursor-pointer group"
      onClick={goDetail}
    >
      <TableCell>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-foreground">{member.name}</p>
          {member.gender && <span className="text-xs text-muted-foreground">（{member.gender}）</span>}
          {age !== null && <span className="text-xs text-muted-foreground">{age} 歲</span>}
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{member.phone}</span>
          {member.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{member.email}</span>}
        </div>
      </TableCell>
      <TableCell><MemberBadge level={member.level} /></TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5 text-foreground">
          <CreditCard className="w-4 h-4 text-accent" />
          <span className="font-medium">NT${Number(member.vip_amount || 0).toLocaleString()}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5 text-destructive">
          <TrendingDown className="w-4 h-4" />
          <span className="font-medium">NT${creditUsed.toLocaleString()}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5 text-primary">
          <Wallet className="w-4 h-4" />
          <span className="font-medium">NT${remaining.toLocaleString()}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {member.vip_start_date
          ? new Date(member.vip_start_date).toLocaleDateString('zh-TW')
          : new Date(member.created_at).toLocaleDateString('zh-TW')}
      </TableCell>
      <TableCell className="text-right">
        <Button variant="outline" size="sm"
          onClick={(e) => { e.stopPropagation(); goDetail(); }}>
          <Edit className="w-3.5 h-3.5 mr-1" />檢視 / 編輯
          <ChevronRight className="w-3.5 h-3.5 ml-1 opacity-60" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
