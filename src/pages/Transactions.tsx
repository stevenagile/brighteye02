import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePrescriptionsWithTransactions, Prescription, useDeletePrescription } from '@/hooks/usePrescriptions';
import { useMembers, Member } from '@/hooks/useMembers';
import { Eye, Plus, Link2, Edit, Wallet, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AddPrescriptionDialog } from '@/components/prescriptions/AddPrescriptionDialog';
import { EditPrescriptionDialog } from '@/components/prescriptions/EditPrescriptionDialog';
import { MemberBadge } from '@/components/members/MemberBadge';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Transactions() {
  const { data: prescriptions, isLoading } = usePrescriptionsWithTransactions();
  const { data: members } = useMembers();
  const [showAddPrescription, setShowAddPrescription] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [editPrescription, setEditPrescription] = useState<Prescription | null>(null);
  const deletePrescription = useDeletePrescription();

  const handleDelete = (id: string) => {
    deletePrescription.mutate(id, {
      onSuccess: () => {
        setSelectedPrescription(null);
      },
    });
  };

  const totalPrescriptionAmount = prescriptions?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

  const getMember = (memberId: string | null): Member | null => {
    if (!memberId) return null;
    return members?.find(m => m.id === memberId) || null;
  };

  const getMemberName = (memberId: string | null) => {
    const member = getMember(memberId);
    return member?.name || '非會員';
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </div>
            <div className="text-right">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-32 mt-1" />
            </div>
          </div>
          <div className="stat-card">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">會員服務紀錄</h1>
            <p className="text-muted-foreground mt-1">管理驗光與服務資料</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">服務總額</p>
              <p className="text-2xl font-bold text-primary">NT${totalPrescriptionAmount.toLocaleString()}</p>
            </div>
            <Button onClick={() => setShowAddPrescription(true)} className="gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              新增服務
            </Button>
          </div>
        </div>

        {/* Prescriptions Table */}
        <div className="stat-card">
          {prescriptions?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>尚無服務紀錄</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">會員 / 等級</TableHead>
                    <TableHead className="font-semibold">服務項目</TableHead>
                    <TableHead className="font-semibold">右眼 (OD)</TableHead>
                    <TableHead className="font-semibold">左眼 (OS)</TableHead>
                    <TableHead className="font-semibold">驗光師</TableHead>
                    <TableHead className="font-semibold text-right">購物金折抵</TableHead>
                    <TableHead className="font-semibold text-right">金額</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescriptions?.map((prescription) => {
                    const linkedTransaction = prescription.transactions?.[0];
                    const member = getMember(prescription.member_id);
                    
                    return (
                      <TableRow 
                        key={prescription.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedPrescription(prescription)}
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">
                                {getMemberName(prescription.member_id)}
                              </p>
                              {linkedTransaction && (
                                <Badge variant="outline" className="text-xs">
                                  <Link2 className="w-3 h-3 mr-1" />
                                  已連結
                                </Badge>
                              )}
                            </div>
                            {member && (
                              <MemberBadge level={member.level} size="sm" />
                            )}
                            <p className="text-sm text-muted-foreground">{prescription.exam_date}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {(prescription as any).service_type || '驗光'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {prescription.right_best_s != null && (
                              <span>S: {prescription.right_best_s > 0 ? '+' : ''}{prescription.right_best_s}</span>
                            )}
                            {prescription.right_best_c != null && (
                              <span className="ml-2">C: {prescription.right_best_c}</span>
                            )}
                            {prescription.right_best_a != null && (
                              <span className="ml-2">A: {prescription.right_best_a}°</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {prescription.left_best_s != null && (
                              <span>S: {prescription.left_best_s > 0 ? '+' : ''}{prescription.left_best_s}</span>
                            )}
                            {prescription.left_best_c != null && (
                              <span className="ml-2">C: {prescription.left_best_c}</span>
                            )}
                            {prescription.left_best_a != null && (
                              <span className="ml-2">A: {prescription.left_best_a}°</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {prescription.examiner || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {Number((prescription as any).credit_used || 0) > 0 ? (
                            <div className="flex items-center justify-end gap-1 text-primary">
                              <Wallet className="w-3 h-3" />
                              <span>-${Number((prescription as any).credit_used).toLocaleString()}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="font-semibold text-foreground">
                            NT${Number(prescription.amount || 0).toLocaleString()}
                          </p>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Add Prescription Dialog */}
        <AddPrescriptionDialog
          open={showAddPrescription}
          onOpenChange={setShowAddPrescription}
        />

        {/* Prescription Detail Dialog */}
        <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  服務紀錄詳情
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditPrescription(selectedPrescription);
                      setSelectedPrescription(null);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    編輯
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-1" />
                        刪除
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>確認刪除</AlertDialogTitle>
                        <AlertDialogDescription>
                          確定要刪除此服務紀錄嗎？此操作無法復原。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => selectedPrescription && handleDelete(selectedPrescription.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          確認刪除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </DialogTitle>
            </DialogHeader>

            {selectedPrescription && (() => {
              const selectedMember = getMember(selectedPrescription.member_id);
              return (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">會員</p>
                    <p className="font-medium">{getMemberName(selectedPrescription.member_id)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">會員等級</p>
                    {selectedMember ? (
                      <MemberBadge level={selectedMember.level} size="sm" />
                    ) : (
                      <p className="text-muted-foreground">-</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">驗光日期</p>
                    <p className="font-medium">{selectedPrescription.exam_date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">服務項目</p>
                    <Badge variant="secondary">{(selectedPrescription as any).service_type || '驗光'}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">驗光師</p>
                    <p className="font-medium">{selectedPrescription.examiner || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">金額</p>
                    <p className="font-bold text-primary">NT${Number(selectedPrescription.amount || 0).toLocaleString()}</p>
                  </div>
                </div>

                {/* 購物金折抵 */}
                {Number((selectedPrescription as any).credit_used || 0) > 0 && (
                  <div className="p-4 bg-accent/50 rounded-lg border border-accent">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-4 h-4 text-primary" />
                      <span className="font-medium">購物金折抵明細</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">本次折抵</p>
                        <p className="font-semibold text-primary">-NT${Number((selectedPrescription as any).credit_used || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">折抵後剩餘</p>
                        <p className="font-semibold">NT${Number((selectedPrescription as any).credit_remaining || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Right Eye (OD) */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">右眼 (OD)</h4>
                  <div className="grid grid-cols-4 gap-3 p-4 bg-muted/30 rounded-lg text-sm">
                    <div>
                      <p className="text-muted-foreground">SC</p>
                      <p className="font-medium">{selectedPrescription.right_sc || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CC</p>
                      <p className="font-medium">{selectedPrescription.right_cc || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">PD</p>
                      <p className="font-medium">{selectedPrescription.right_pd || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">ADD</p>
                      <p className="font-medium">{selectedPrescription.right_add || '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground mb-1">Best Rx</p>
                      <p>S: {selectedPrescription.right_best_s ?? '-'}</p>
                      <p>C: {selectedPrescription.right_best_c ?? '-'}</p>
                      <p>A: {selectedPrescription.right_best_a ?? '-'}°</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground mb-1">Auto Rx</p>
                      <p>S: {selectedPrescription.right_auto_s ?? '-'}</p>
                      <p>C: {selectedPrescription.right_auto_c ?? '-'}</p>
                      <p>A: {selectedPrescription.right_auto_a ?? '-'}°</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground mb-1">Old Rx</p>
                      <p>S: {selectedPrescription.right_old_s ?? '-'}</p>
                      <p>C: {selectedPrescription.right_old_c ?? '-'}</p>
                      <p>A: {selectedPrescription.right_old_a ?? '-'}°</p>
                    </div>
                  </div>
                </div>

                {/* Left Eye (OS) */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">左眼 (OS)</h4>
                  <div className="grid grid-cols-4 gap-3 p-4 bg-muted/30 rounded-lg text-sm">
                    <div>
                      <p className="text-muted-foreground">SC</p>
                      <p className="font-medium">{selectedPrescription.left_sc || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CC</p>
                      <p className="font-medium">{selectedPrescription.left_cc || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">PD</p>
                      <p className="font-medium">{selectedPrescription.left_pd || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">ADD</p>
                      <p className="font-medium">{selectedPrescription.left_add || '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground mb-1">Best Rx</p>
                      <p>S: {selectedPrescription.left_best_s ?? '-'}</p>
                      <p>C: {selectedPrescription.left_best_c ?? '-'}</p>
                      <p>A: {selectedPrescription.left_best_a ?? '-'}°</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground mb-1">Auto Rx</p>
                      <p>S: {selectedPrescription.left_auto_s ?? '-'}</p>
                      <p>C: {selectedPrescription.left_auto_c ?? '-'}</p>
                      <p>A: {selectedPrescription.left_auto_a ?? '-'}°</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground mb-1">Old Rx</p>
                      <p>S: {selectedPrescription.left_old_s ?? '-'}</p>
                      <p>C: {selectedPrescription.left_old_c ?? '-'}</p>
                      <p>A: {selectedPrescription.left_old_a ?? '-'}°</p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedPrescription.notes && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">備註</p>
                    <p className="text-foreground">{selectedPrescription.notes}</p>
                  </div>
                )}
              </div>
            );})()}
          </DialogContent>
        </Dialog>

        {/* Edit Prescription Dialog */}
        <EditPrescriptionDialog
          prescription={editPrescription}
          open={!!editPrescription}
          onOpenChange={(open) => !open && setEditPrescription(null)}
        />
      </div>
    </MainLayout>
  );
}
