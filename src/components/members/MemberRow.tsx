import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Member } from '@/hooks/useMembers';
import { MemberBadge } from './MemberBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  CreditCard,
  Wallet,
  TrendingDown,
  Eye,
  Receipt,
  AlertCircle,
  MessageCircle,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemberRowProps {
  member: Member;
  creditUsed: number;
  onEdit: (m: Member) => void;
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

const formatAddress = (m: Member) => {
  const parts = [
    (m as any).postal_code,
    (m as any).city,
    (m as any).district,
    m.address,
  ].filter(Boolean);
  return parts.length ? parts.join(' ') : null;
};

export function MemberRow({ member, creditUsed, onEdit }: MemberRowProps) {
  const [open, setOpen] = useState(false);
  const remaining = Number(member.shopping_credit) - creditUsed;
  const age = calculateAge(member.birthday);

  // Lazy-load history when row expands
  const { data: history, isLoading } = useQuery({
  // Lazy-load 客戶服務紀錄 when row expands
  const { data: serviceRecords, isLoading } = useQuery({
    queryKey: ['member-service-records', member.id],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('member_id', member.id)
        .order('exam_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
  const address = formatAddress(member);

  return (
    <>
      <TableRow
        className="hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <TableCell className="w-10">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
            onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}>
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-foreground">{member.name}</p>
            {member.gender && <span className="text-xs text-muted-foreground">({member.gender})</span>}
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
            onClick={(e) => { e.stopPropagation(); onEdit(member); }}>
            <Edit className="w-3.5 h-3.5 mr-1" />編輯
          </Button>
        </TableCell>
      </TableRow>

      {open && (
        <TableRow className="bg-muted/20 hover:bg-muted/20">
          <TableCell colSpan={8} className="p-0">
            <div className="p-6 space-y-6 animate-fade-in">
              {/* 基本資料區塊 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />聯絡與個人資訊
                  </h4>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    {member.home_phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />住家：{member.home_phone}
                      </div>
                    )}
                    {(member as any).line_id && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MessageCircle className="w-3.5 h-3.5" />LINE：{(member as any).line_id}
                      </div>
                    )}
                    {address && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 mt-0.5" />
                        <span>{address}</span>
                      </div>
                    )}
                    {member.birthday && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />生日：{member.birthday}
                      </div>
                    )}
                    {member.occupation && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Briefcase className="w-3.5 h-3.5" />職業：{member.occupation}
                      </div>
                    )}
                    {(member as any).referral_source && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <UserPlus className="w-3.5 h-3.5" />介紹來源：{(member as any).referral_source}
                      </div>
                    )}
                    {!member.home_phone && !(member as any).line_id && !address &&
                     !member.birthday && !member.occupation && !(member as any).referral_source && (
                      <p className="text-muted-foreground italic">尚未填寫</p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />健康狀況
                  </h4>
                  <div className="space-y-2 text-sm">
                    {member.health_conditions && member.health_conditions.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">身體狀況</p>
                        <div className="flex flex-wrap gap-1">
                          {member.health_conditions.map((c, i) => (
                            <Badge key={i} variant="secondary">{c}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {member.eye_conditions && member.eye_conditions.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">眼睛狀況</p>
                        <div className="flex flex-wrap gap-1">
                          {member.eye_conditions.map((c, i) => (
                            <Badge key={i} variant="secondary">{c}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {member.eye_surgeries && member.eye_surgeries.length > 0 && (
                      <div>
              {/* 客戶服務紀錄 */}
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Receipt className="w-4 h-4" />客戶服務紀錄
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    共 {serviceRecords?.length || 0} 筆
                  </span>
                </div>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">載入中…</p>
                ) : serviceRecords?.length ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {serviceRecords.map((p: any) => (
                      <div key={p.id} className="rounded-md border border-border/60 p-3 text-sm space-y-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {new Date(p.exam_date).toLocaleDateString('zh-TW')}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {p.service_type || '驗光'}
                            </Badge>
                          </div>
                          <span className="font-bold text-primary">
                            NT${Number(p.amount || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground text-xs flex-wrap gap-2">
                          <span>驗光師：{p.examiner || '—'}</span>
                          {Number(p.credit_used || 0) > 0 && (
                            <span className="text-destructive">
                              折抵購物金：NT${Number(p.credit_used).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {p.notes && (
                          <p className="text-xs text-muted-foreground pt-1 border-t border-border/40">
                            {p.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">尚無紀錄</p>
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
                          </div>
                          {t.transaction_items?.length > 0 && (
                            <div className="text-xs text-muted-foreground truncate">
                              {t.transaction_items.map((i: any) => i.name).join('、')}
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>付款：{t.payment_method}</span>
                            {Number(t.credit_used || 0) > 0 && (
                              <span className="text-destructive">折抵：NT${Number(t.credit_used).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">尚無紀錄</p>
                  )}
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
