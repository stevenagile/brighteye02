import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

interface DecimalInputProps {
  value: string;
  onCommit: (next: string) => void;
  decimals?: number; // 小數位數，0 = 整數
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * 受控數字輸入：
 * - 輸入過程使用本地 draft，使用者可自由輸入（包含 `.`、`-` 等中間狀態）
 * - 離開欄位 (blur) 後才格式化並寫入 formData（精確值）
 * - 顯示永遠保留 decimals 位小數（含尾數 0），未聚焦時顯示格式化後的值
 */
export function DecimalInput({
  value,
  onCommit,
  decimals = 2,
  placeholder,
  className,
  disabled,
}: DecimalInputProps) {
  const format = (v: string) => {
    if (v === '' || v == null) return '';
    const n = Number(v);
    if (isNaN(n)) return v;
    return decimals > 0 ? n.toFixed(decimals) : String(Math.trunc(n));
  };

  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState<string>(format(value));

  // 外部 value 變動且未聚焦時，同步顯示
  useEffect(() => {
    if (!focused) setDraft(format(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, focused, decimals]);

  return (
    <Input
      type="text"
      inputMode={decimals > 0 ? 'decimal' : 'numeric'}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      value={draft}
      onFocus={() => setFocused(true)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setFocused(false);
        const v = draft.trim();
        if (v === '') {
          if (value !== '') onCommit('');
          setDraft('');
          return;
        }
        const n = Number(v);
        if (isNaN(n)) {
          // 還原為上一個合法值
          setDraft(format(value));
          return;
        }
        const next = decimals > 0 ? n.toFixed(decimals) : String(Math.trunc(n));
        setDraft(next);
        if (next !== value) onCommit(next);
      }}
    />
  );
}
