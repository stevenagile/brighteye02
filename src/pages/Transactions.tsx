import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useTransactions } from '@/hooks/useTransactions';
import { usePrescriptions, usePrescriptionsWithTransactions, Prescription } from '@/hooks/usePrescriptions';
import { useMembers } from '@/hooks/useMembers';
import { CreditCard, Banknote, Building2, Package, Receipt, Eye, Plus, Link2, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AddPrescriptionDialog } from '@/components/prescriptions/AddPrescriptionDialog';
import { EditPrescriptionDialog } from '@/components/prescriptions/EditPrescriptionDialog';
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

const paymentConfig = {
  card: { icon: CreditCard, label: '刷卡', className: 'bg-blue-100 text-blue-700' },
  cash: { icon: Banknote, label: '現金', className: 'bg-green-100 text-green-700' },
  transfer: { icon: Building2, label: '轉帳', className: 'bg-purple-100 text-purple-700' },
};

export default function Transactions() {
  const { data: transactions, isLoading: txLoading } = useTransactions();
  const { data: prescriptions, isLoading: rxLoading } = usePrescriptionsWithTransactions();
  const { data: members } = useMembers();
  const [showAddPrescription, setShowAddPrescription] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [editPrescription, setEditPrescription] = useState<Prescription | null>(null);

  const totalIncome = transactions?.reduce((sum, t) => sum + Number(t.total), 0) || 0;
  const totalPrescriptionAmount = prescriptions?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

  const getMemberName = (memberId: string | null) => {
    if (!memberId) return '非會員';
    const member = members?.find(m => m.id === memberId);
    return member?.name || '未知會員';
  };

  const isLoading = txLoading || rxLoading;

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
            <h1 className="text-3xl font-bold text-foreground">員工交易記錄</h1>
            <p className="text-muted-foreground mt-1">管理交易記錄與驗光資料</p>
          </div>
        </div>

        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              交易記錄
            </TabsTrigger>
            <TabsTrigger value="prescriptions" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              驗光記錄
            </TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">總收入</p>
                <p className="text-2xl font-bold text-primary">NT${totalIncome.toLocaleString()}</p>
              </div>
            </div>

            <div className="stat-card">
              {transactions?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>尚無交易記錄</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">交易資訊</TableHead>
                        <TableHead className="font-semibold">商品明細</TableHead>
                        <TableHead className="font-semibold">優惠</TableHead>
                        <TableHead className="font-semibold">支付方式</TableHead>
                        <TableHead className="font-semibold text-right">金額</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions?.map((transaction) => {
                        const payment = paymentConfig[transaction.payment_method];
                        const PaymentIcon = payment.icon;
                        const items = transaction.transaction_items || [];
                        
                        return (
                          <TableRow 
                            key={transaction.id}
                            className="hover:bg-muted/30 transition-colors"
                          >
                            <TableCell>
                              <div>
                                <p className="font-medium text-foreground">
                                  {transaction.members?.name || '非會員'}
                                </p>
                                <p className="text-sm text-muted-foreground">{transaction.transaction_date}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {items.length > 0 ? items.map((item) => (
                                  <div key={item.id} className="flex items-center gap-2 text-sm">
                                    <Package className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-foreground">{item.name}</span>
                                    <span className="text-muted-foreground">×{item.quantity}</span>
                                  </div>
                                )) : (
                                  <span className="text-muted-foreground text-sm">無明細</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-sm">
                                {Number(transaction.discount) > 0 && (
                                  <p className="text-destructive">-NT${Number(transaction.discount).toLocaleString()}</p>
                                )}
                                {Number(transaction.credit_used) > 0 && (
                                  <p className="text-primary">購物金: -NT${Number(transaction.credit_used).toLocaleString()}</p>
                                )}
                                {transaction.coupon_used > 0 && (
                                  <p className="text-accent">優惠券: -{transaction.coupon_used}張</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${payment.className}`}>
                                <PaymentIcon className="w-3 h-3" />
                                {payment.label}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div>
                                <p className="font-semibold text-foreground">
                                  NT${Number(transaction.total).toLocaleString()}
                                </p>
                                {Number(transaction.subtotal) !== Number(transaction.total) && (
                                  <p className="text-xs text-muted-foreground line-through">
                                    NT${Number(transaction.subtotal).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">驗光總額</p>
                <p className="text-2xl font-bold text-primary">NT${totalPrescriptionAmount.toLocaleString()}</p>
              </div>
              <Button onClick={() => setShowAddPrescription(true)} className="gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                新增驗光
              </Button>
            </div>

            <div className="stat-card">
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
                        <TableHead className="font-semibold">會員 / 日期</TableHead>
                        <TableHead className="font-semibold">右眼 (OD)</TableHead>
                        <TableHead className="font-semibold">左眼 (OS)</TableHead>
                        <TableHead className="font-semibold">驗光師</TableHead>
                        <TableHead className="font-semibold text-right">金額</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prescriptions?.map((prescription) => {
                        const linkedTransaction = prescription.transactions?.[0];
                        
                        return (
                          <TableRow 
                            key={prescription.id}
                            className="hover:bg-muted/30 transition-colors cursor-pointer"
                            onClick={() => setSelectedPrescription(prescription)}
                          >
                            <TableCell>
                              <div>
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
                                <p className="text-sm text-muted-foreground">{prescription.exam_date}</p>
                              </div>
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
          </TabsContent>
        </Tabs>

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
                  驗光記錄詳情
                </span>
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
              </DialogTitle>
            </DialogHeader>

            {selectedPrescription && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">會員</p>
                    <p className="font-medium">{getMemberName(selectedPrescription.member_id)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">驗光日期</p>
                    <p className="font-medium">{selectedPrescription.exam_date}</p>
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
            )}
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