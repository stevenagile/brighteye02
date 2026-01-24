import { useState } from 'react';
import { useMembers, Member } from '@/hooks/useMembers';
import { MemberBadge } from './MemberBadge';
import { Input } from '@/components/ui/input';
import { Search, Wallet, Ticket, Phone, Mail, Users, Calendar, MapPin, Briefcase, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function MemberTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const { data: members, isLoading } = useMembers();

  const filteredMembers = (members || []).filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone.includes(searchTerm)
  );

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

  const calculateAge = (birthday: string | null) => {
    if (!birthday) return null;
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <>
      <div className="stat-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">會員列表</h3>
            <p className="text-sm text-muted-foreground">
              共 {members?.length || 0} 位會員
            </p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜尋姓名或電話..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{searchTerm ? '找不到符合的會員' : '尚無會員資料'}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">會員資訊</TableHead>
                  <TableHead className="font-semibold">等級</TableHead>
                  <TableHead className="font-semibold">購物金</TableHead>
                  <TableHead className="font-semibold">購物券</TableHead>
                  <TableHead className="font-semibold">加入日期</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow 
                    key={member.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedMember(member)}
                  >
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{member.name}</p>
                          {member.gender && (
                            <span className="text-xs text-muted-foreground">
                              ({member.gender})
                            </span>
                          )}
                          {member.birthday && (
                            <span className="text-xs text-muted-foreground">
                              {calculateAge(member.birthday)}歲
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {member.phone}
                          </span>
                          {member.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {member.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <MemberBadge level={member.level} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Wallet className="w-4 h-4 text-primary" />
                        <span className="font-medium">NT${Number(member.shopping_credit).toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Ticket className="w-4 h-4 text-accent" />
                        <span className="font-medium">{member.coupon_count} 張</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.created_at).toLocaleDateString('zh-TW')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Member Detail Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              會員資料
            </DialogTitle>
          </DialogHeader>

          {selectedMember && (
            <div className="space-y-6">
              {/* 基本資訊 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{selectedMember.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <MemberBadge level={selectedMember.level} />
                      {selectedMember.gender && (
                        <span className="text-sm text-muted-foreground">{selectedMember.gender}</span>
                      )}
                      {selectedMember.birthday && (
                        <span className="text-sm text-muted-foreground">
                          {calculateAge(selectedMember.birthday)}歲
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-primary">
                      <Wallet className="w-4 h-4" />
                      <span className="font-bold">NT${Number(selectedMember.shopping_credit).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-accent mt-1">
                      <Ticket className="w-4 h-4" />
                      <span className="font-medium">{selectedMember.coupon_count} 張購物券</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 聯絡資訊 */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-foreground">聯絡資訊</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>手機: {selectedMember.phone}</span>
                  </div>
                  {selectedMember.home_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>住家: {selectedMember.home_phone}</span>
                    </div>
                  )}
                  {selectedMember.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedMember.email}</span>
                    </div>
                  )}
                  {selectedMember.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedMember.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 個人資訊 */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-foreground">個人資訊</h4>
                <div className="grid gap-2 text-sm">
                  {selectedMember.birthday && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>生日: {selectedMember.birthday}</span>
                    </div>
                  )}
                  {selectedMember.occupation && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <span>職業: {selectedMember.occupation}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 健康狀況 */}
              {(selectedMember.health_conditions?.length > 0 || 
                selectedMember.eye_conditions?.length > 0 || 
                selectedMember.eye_surgeries?.length > 0) && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    健康狀況
                  </h4>
                  <div className="space-y-3">
                    {selectedMember.health_conditions?.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">身體狀況</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedMember.health_conditions.map((condition, i) => (
                            <Badge key={i} variant="secondary">{condition}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedMember.eye_conditions?.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">眼睛狀況</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedMember.eye_conditions.map((condition, i) => (
                            <Badge key={i} variant="secondary">{condition}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedMember.eye_surgeries?.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">眼科手術史</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedMember.eye_surgeries.map((surgery, i) => (
                            <Badge key={i} variant="outline">{surgery}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 備註 */}
              {selectedMember.notes && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">備註</p>
                  <p className="text-foreground">{selectedMember.notes}</p>
                </div>
              )}

              {/* 加入時間 */}
              <div className="text-xs text-muted-foreground text-center">
                加入時間: {new Date(selectedMember.created_at).toLocaleString('zh-TW')}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
