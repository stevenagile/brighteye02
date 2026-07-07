import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Store, Users, Bell, Save, Loader2, Pencil, X, HelpCircle } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_FAQ } from '@/lib/faqDefault';
import {
  useStoreInfo,
  useMemberLevels,
  useNotificationSettings,
  useFaq,
  useUpdateStoreInfo,
  useUpdateMemberLevels,
  useUpdateNotifications,
  useUpdateFaq,
  StoreInfo,
  MemberLevels,
  NotificationSettings,
} from '@/hooks/useSettings';

export default function Settings() {
  // Store Info State
  const { data: storeInfo, isLoading: loadingStore } = useStoreInfo();
  const updateStoreInfo = useUpdateStoreInfo();
  const [storeForm, setStoreForm] = useState<StoreInfo>({
    name: '',
    phone: '',
    address: '',
  });

  // Member Levels State
  const { data: memberLevels, isLoading: loadingLevels } = useMemberLevels();
  const updateMemberLevels = useUpdateMemberLevels();
  const [levelsForm, setLevelsForm] = useState<MemberLevels>({
    regular: { discount: 1, points_multiplier: 1, vip_amount: 0, shopping_credit: 0 },
    gold: { discount: 0.9, points_multiplier: 2, vip_amount: 30000, shopping_credit: 3000 },
    silver: { discount: 0.95, points_multiplier: 1.5, vip_amount: 10000, shopping_credit: 1000 },
    black: { discount: 0.85, points_multiplier: 3, vip_amount: 50000, shopping_credit: 5000 },
  });

  // Notification State
  const { data: notifications, isLoading: loadingNotifications } = useNotificationSettings();
  const updateNotifications = useUpdateNotifications();
  const [notificationsForm, setNotificationsForm] = useState<NotificationSettings>({
    low_stock: true,
    birthday_reminder: true,
    daily_report: false,
  });

  // FAQ State
  const { data: faq, isLoading: loadingFaq } = useFaq();
  const updateFaq = useUpdateFaq();
  const [faqText, setFaqText] = useState('');

  // Sync form state with fetched data
  useEffect(() => {
    if (storeInfo) {
      setStoreForm(storeInfo);
    }
  }, [storeInfo]);

  useEffect(() => {
    if (memberLevels) {
      setLevelsForm(memberLevels);
    }
  }, [memberLevels]);

  useEffect(() => {
    if (notifications) {
      setNotificationsForm(notifications);
    }
  }, [notifications]);

  useEffect(() => {
    if (!loadingFaq) {
      setFaqText(faq?.text ?? DEFAULT_FAQ);
    }
  }, [faq, loadingFaq]);

  const handleSaveStore = () => {
    updateStoreInfo.mutate(storeForm);
  };

  const [savingLevel, setSavingLevel] = useState<keyof MemberLevels | 'all' | null>(null);
  const [editingLevel, setEditingLevel] = useState<keyof MemberLevels | null>(null);

  const handleSaveLevels = () => {
    setSavingLevel('all');
    updateMemberLevels.mutate(levelsForm, {
      onSettled: () => setSavingLevel(null),
    });
  };

  const handleSaveSingleLevel = (key: keyof MemberLevels) => {
    setSavingLevel(key);
    updateMemberLevels.mutate(levelsForm, {
      onSettled: () => {
        setSavingLevel(null);
        setEditingLevel(null);
      },
    });
  };

  const handleCancelEdit = (key: keyof MemberLevels) => {
    if (memberLevels) {
      setLevelsForm({ ...levelsForm, [key]: memberLevels[key] });
    }
    setEditingLevel(null);
  };



  const handleSaveNotifications = () => {
    updateNotifications.mutate(notificationsForm);
  };

  const handleSaveFaq = () => {
    updateFaq.mutate({ text: faqText });
  };

  const discountToDisplay = (discount: number) => {
    return `${Math.round(discount * 100) / 10}折`;
  };

  const displayToDiscount = (display: string): number => {
    const num = parseFloat(display.replace('折', ''));
    return num / 10;
  };

  // 金額格式化：顯示千分位
  const formatAmount = (value: number): string => {
    return value.toLocaleString('zh-TW');
  };

  // 金額解析：移除千分位符號
  const parseAmount = (value: string): number => {
    return parseInt(value.replace(/,/g, '')) || 0;
  };

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">系統設定</h1>
          <p className="text-muted-foreground mt-1">管理店鋪資訊和系統配置</p>
        </div>

        <div className="grid gap-6">
          {/* Store Info */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-primary">
                  <Store className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">店鋪資訊</h3>
                  <p className="text-sm text-muted-foreground">基本店鋪資料設定</p>
                </div>
              </div>
              <Button
                onClick={handleSaveStore}
                disabled={updateStoreInfo.isPending || loadingStore}
                size="sm"
              >
                {updateStoreInfo.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                儲存
              </Button>
            </div>

            {loadingStore ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="storeName">店鋪名稱</Label>
                  <Input
                    id="storeName"
                    value={storeForm.name}
                    onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">聯絡電話</Label>
                  <Input
                    id="phone"
                    value={storeForm.phone}
                    onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">店鋪地址</Label>
                  <Input
                    id="address"
                    value={storeForm.address}
                    onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Member Settings */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-gold">
                  <Users className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">會員等級設定</h3>
                  <p className="text-sm text-muted-foreground">配置各等級會員的權益</p>
                </div>
              </div>
            </div>

            {loadingLevels ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (() => {
              const renderLevelCard = (
                key: keyof MemberLevels,
                badgeClass: string,
                label: string,
                discountPlaceholder: string
              ) => {
                const cfg = levelsForm[key];
                const isSaving = savingLevel === key;
                const isEditing = editingLevel === key;
                const otherEditing = editingLevel !== null && !isEditing;
                const readOnly = !isEditing;
                return (
                  <div key={key} className="p-4 border border-border rounded-xl flex flex-col">
                    <div className="flex items-center justify-between mb-4 gap-2">
                      <div className={badgeClass}>{label}</div>
                      {isEditing ? (
                        <div className="flex gap-1">
                          <Button
                            onClick={() => handleCancelEdit(key)}
                            disabled={isSaving}
                            size="sm"
                            variant="ghost"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            onClick={() => handleSaveSingleLevel(key)}
                            disabled={isSaving}
                            size="sm"
                          >
                            {isSaving ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setEditingLevel(key)}
                          disabled={otherEditing || updateMemberLevels.isPending}
                          size="sm"
                          variant="outline"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">VIP 金額</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          readOnly={readOnly}
                          value={formatAmount(cfg.vip_amount)}
                          onChange={(e) =>
                            setLevelsForm({
                              ...levelsForm,
                              [key]: { ...cfg, vip_amount: parseAmount(e.target.value) },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">購物金</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          readOnly={readOnly}
                          value={formatAmount(cfg.shopping_credit ?? 0)}
                          onChange={(e) =>
                            setLevelsForm({
                              ...levelsForm,
                              [key]: { ...cfg, shopping_credit: parseAmount(e.target.value) },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">消費折扣</Label>
                        <Input
                          readOnly={readOnly}
                          value={discountToDisplay(cfg.discount)}
                          onChange={(e) =>
                            setLevelsForm({
                              ...levelsForm,
                              [key]: {
                                ...cfg,
                                discount: displayToDiscount(e.target.value) || cfg.discount,
                              },
                            })
                          }
                          placeholder={discountPlaceholder}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">積分倍率</Label>
                        <Input
                          type="number"
                          step="0.5"
                          min="1"
                          readOnly={readOnly}
                          value={cfg.points_multiplier}
                          onChange={(e) =>
                            setLevelsForm({
                              ...levelsForm,
                              [key]: {
                                ...cfg,
                                points_multiplier: parseFloat(e.target.value) || 1,
                              },
                            })
                          }
                        />
                      </div>
                    </div>

                  </div>
                );
              };

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {renderLevelCard('regular', 'member-badge-regular', '一般客戶', '無折扣')}
                  {renderLevelCard('gold', 'member-badge-gold', '金卡會員', '9折')}
                  {renderLevelCard('silver', 'member-badge-silver', '銀卡會員', '95折')}
                  {renderLevelCard('black', 'member-badge-black', '黑卡會員', '85折')}
                </div>
              );
            })()}

          </div>


          {/* Notifications */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">通知設定</h3>
                  <p className="text-sm text-muted-foreground">配置系統通知和提醒</p>
                </div>
              </div>
              <Button
                onClick={handleSaveNotifications}
                disabled={updateNotifications.isPending || loadingNotifications}
                size="sm"
              >
                {updateNotifications.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                儲存
              </Button>
            </div>

            {loadingNotifications ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* 低庫存提醒：待商品庫存模組上線後再開放 */}
                <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                  <div>
                    <p className="font-medium text-foreground">會員生日提醒</p>
                    <p className="text-sm text-muted-foreground">在會員生日前一週發送提醒</p>
                  </div>
                  <Switch
                    checked={notificationsForm.birthday_reminder}
                    onCheckedChange={(checked) =>
                      setNotificationsForm({ ...notificationsForm, birthday_reminder: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                  <div>
                    <p className="font-medium text-foreground">每日銷售報告</p>
                    <p className="text-sm text-muted-foreground">每日發送銷售匯總郵件</p>
                  </div>
                  <Switch
                    checked={notificationsForm.daily_report}
                    onCheckedChange={(checked) =>
                      setNotificationsForm({ ...notificationsForm, daily_report: checked })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* FAQ 知識庫 */}
          <div className="stat-card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary">
                  <HelpCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">FAQ 知識庫</h3>
                  <p className="text-sm text-muted-foreground">LINE AI 客服回答一般問題的依據,可自由編輯</p>
                </div>
              </div>
              <Button
                onClick={handleSaveFaq}
                disabled={updateFaq.isPending || loadingFaq}
                size="sm"
              >
                {updateFaq.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                儲存
              </Button>
            </div>

            {loadingFaq ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                <Textarea
                  rows={16}
                  value={faqText}
                  onChange={(e) => setFaqText(e.target.value)}
                  className="font-mono text-sm"
                  placeholder="輸入 FAQ 內容,建議以 Q: / A: 的格式撰寫"
                />
                <p className="text-xs text-muted-foreground">
                  儲存後,LINE 客服回答一般問題時會依此內容作答。建議每題以「Q:問題」「A:回答」分行撰寫。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
