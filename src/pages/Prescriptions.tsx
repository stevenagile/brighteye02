import { MainLayout } from '@/components/layout/MainLayout';
import { usePrescriptions, PrescriptionWithMember } from '@/hooks/usePrescriptions';
import { Eye, User, Plus, Calendar, DollarSign, UserCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { AddPrescriptionDialog } from '@/components/prescriptions/AddPrescriptionDialog';
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

export default function Prescriptions() {
  const { data: prescriptions, isLoading } = usePrescriptions();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionWithMember | null>(null);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="stat-card">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  const formatDiopter = (value: number | null) => {
    if (value == null) return '-';
    return value > 0 ? `+${value}` : `${value}`;
  };

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">驗光記錄</h1>
            <p className="text-muted-foreground mt-1">管理會員驗光處方和歷史記錄</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="gradient-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            新增驗光
          </Button>
        </div>

        {/* Prescriptions */}
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-primary">
              <Eye className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">驗光處方</h3>
              <p className="text-sm text-muted-foreground">
                共 {prescriptions?.length || 0} 筆記錄
              </p>
            </div>
          </div>

          {prescriptions?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>尚無驗光記錄</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">會員</TableHead>
                    <TableHead className="font-semibold">日期</TableHead>
                    <TableHead className="font-semibold">右眼 最佳矯正</TableHead>
                    <TableHead className="font-semibold">左眼 最佳矯正</TableHead>
                    <TableHead className="font-semibold">金額</TableHead>
                    <TableHead className="font-semibold">驗光師</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prescriptions?.map((rx) => (
                    <TableRow 
                      key={rx.id} 
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedPrescription(rx)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{rx.members?.name || '-'}</p>
                            <p className="text-xs text-muted-foreground">{rx.members?.phone || '-'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{rx.exam_date}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">
                            {formatDiopter(rx.right_best_s)} / {rx.right_best_c ?? '-'} × {rx.right_best_a ?? '-'}°
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">
                            {formatDiopter(rx.left_best_s)} / {rx.left_best_c ?? '-'} × {rx.left_best_a ?? '-'}°
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {rx.amount ? (
                          <span className="font-medium text-primary">
                            NT${Number(rx.amount).toLocaleString()}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {rx.examiner || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Add Prescription Dialog */}
        <AddPrescriptionDialog open={showAddDialog} onOpenChange={setShowAddDialog} />

        {/* Prescription Detail Dialog */}
        <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                驗光記錄詳情
              </DialogTitle>
            </DialogHeader>

            {selectedPrescription && (
              <div className="space-y-6">
                {/* 基本資訊 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">會員</p>
                      <p className="font-medium">{selectedPrescription.members?.name || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">日期</p>
                      <p className="font-medium">{selectedPrescription.exam_date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">金額</p>
                      <p className="font-medium text-primary">
                        {selectedPrescription.amount ? `NT$${Number(selectedPrescription.amount).toLocaleString()}` : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">驗光師</p>
                      <p className="font-medium">{selectedPrescription.examiner || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* 眼睛資料 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 右眼 */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-foreground border-b pb-2">右眼 (OD)</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">裸視 SC</span>
                        <span className="font-medium">{selectedPrescription.right_sc || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">最佳視力 CC</span>
                        <span className="font-medium">{selectedPrescription.right_cc || '-'}</span>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-muted-foreground mb-1">最佳矯正度數</p>
                        <p className="font-medium">
                          S: {formatDiopter(selectedPrescription.right_best_s)} / 
                          C: {selectedPrescription.right_best_c ?? '-'} / 
                          A: {selectedPrescription.right_best_a ?? '-'}°
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">電腦驗光</p>
                        <p className="font-medium">
                          S: {formatDiopter(selectedPrescription.right_auto_s)} / 
                          C: {selectedPrescription.right_auto_c ?? '-'} / 
                          A: {selectedPrescription.right_auto_a ?? '-'}°
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">原戴眼鏡</p>
                        <p className="font-medium">
                          S: {formatDiopter(selectedPrescription.right_old_s)} / 
                          C: {selectedPrescription.right_old_c ?? '-'} / 
                          A: {selectedPrescription.right_old_a ?? '-'}°
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          視力: {selectedPrescription.right_old_va || '-'}, 
                          配戴: {selectedPrescription.right_old_year ? `${selectedPrescription.right_old_year}年` : '-'}
                        </p>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-muted-foreground">ADD</span>
                        <span className="font-medium">{selectedPrescription.right_add ?? '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">PD</span>
                        <span className="font-medium">{selectedPrescription.right_pd ? `${selectedPrescription.right_pd}mm` : '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 左眼 */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-foreground border-b pb-2">左眼 (OS)</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">裸視 SC</span>
                        <span className="font-medium">{selectedPrescription.left_sc || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">最佳視力 CC</span>
                        <span className="font-medium">{selectedPrescription.left_cc || '-'}</span>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-muted-foreground mb-1">最佳矯正度數</p>
                        <p className="font-medium">
                          S: {formatDiopter(selectedPrescription.left_best_s)} / 
                          C: {selectedPrescription.left_best_c ?? '-'} / 
                          A: {selectedPrescription.left_best_a ?? '-'}°
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">電腦驗光</p>
                        <p className="font-medium">
                          S: {formatDiopter(selectedPrescription.left_auto_s)} / 
                          C: {selectedPrescription.left_auto_c ?? '-'} / 
                          A: {selectedPrescription.left_auto_a ?? '-'}°
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">原戴眼鏡</p>
                        <p className="font-medium">
                          S: {formatDiopter(selectedPrescription.left_old_s)} / 
                          C: {selectedPrescription.left_old_c ?? '-'} / 
                          A: {selectedPrescription.left_old_a ?? '-'}°
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          視力: {selectedPrescription.left_old_va || '-'}, 
                          配戴: {selectedPrescription.left_old_year ? `${selectedPrescription.left_old_year}年` : '-'}
                        </p>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-muted-foreground">ADD</span>
                        <span className="font-medium">{selectedPrescription.left_add ?? '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">PD</span>
                        <span className="font-medium">{selectedPrescription.left_pd ? `${selectedPrescription.left_pd}mm` : '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 備註 */}
                {selectedPrescription.notes && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">備註</p>
                    <p className="text-foreground">{selectedPrescription.notes}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
