import { z } from 'zod';

// Shared primitives
const optStr = (max = 500) =>
  z.string().trim().max(max).optional().nullable().or(z.literal('').transform(() => null));
const optDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable().or(z.literal('').transform(() => null));
const optNumberMin0 = z.number().finite().min(0).optional().nullable();
const optInt = z.number().int().optional().nullable();

// Members
export const memberLevelEnum = z.enum(['regular', 'silver', 'gold', 'black']);

export const memberInputSchema = z.object({
  name: z.string().trim().min(1, '姓名為必填').max(100, '姓名過長'),
  phone: z.string().trim().min(3, '電話格式不正確').max(40)
    .regex(/^[0-9+\-()\s]+$/, '電話僅允許數字與 + - ( ) 空格'),
  email: z.string().trim().email('Email 格式錯誤').max(255).optional().nullable()
    .or(z.literal('').transform(() => null)),
  level: memberLevelEnum.optional(),
  shopping_credit: z.number().finite().min(0).max(1e9).optional(),
  coupon_count: z.number().int().min(0).max(1_000_000).optional(),
  vip_amount: z.number().finite().min(0).max(1e9).optional(),
  vip_start_date: optDate,
  notes: optStr(2000),
  gender: z.enum(['男', '女']).optional().nullable().or(z.literal('').transform(() => null)),
  birthday: optDate,
  city: optStr(50),
  district: optStr(50),
  postal_code: optStr(10),
  address: optStr(255),
  occupation: optStr(100),
  home_phone: z.string().trim().max(40).regex(/^[0-9+\-()\s]*$/, '電話格式不正確').optional().nullable()
    .or(z.literal('').transform(() => null)),
  line_id: optStr(100),
  referral_source: optStr(255),
  health_conditions: z.array(z.string().max(50)).max(50).optional(),
  eye_conditions: z.array(z.string().max(50)).max(50).optional(),
  eye_surgeries: z.array(z.string().max(50)).max(50).optional(),
}).passthrough();

// Prescriptions
export const prescriptionInputSchema = z.object({
  member_id: z.string().uuid('member_id 不正確'),
  exam_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式錯誤'),
  service_type: optStr(50),
  examiner: optStr(100),
  notes: optStr(2000),
  amount: z.number().finite().min(0).max(1e9).optional().nullable(),
  credit_used: z.number().finite().min(0).max(1e9).optional().nullable(),
  credit_remaining: z.number().finite().min(0).max(1e9).optional().nullable(),
  // Optical numeric fields — allow optional/null without strict bounds
  right_sc: optStr(20), right_cc: optStr(20),
  left_sc: optStr(20), left_cc: optStr(20),
  right_best_s: optNumberMin0.or(z.number().finite()).optional().nullable(),
  right_best_c: z.number().finite().optional().nullable(),
  right_best_a: optInt,
  right_auto_s: z.number().finite().optional().nullable(),
  right_auto_c: z.number().finite().optional().nullable(),
  right_auto_a: optInt,
  right_old_s: z.number().finite().optional().nullable(),
  right_old_c: z.number().finite().optional().nullable(),
  right_old_a: optInt,
  right_old_va: optStr(20),
  right_old_year: optInt,
  right_add: z.number().finite().optional().nullable(),
  right_pd: z.number().finite().optional().nullable(),
  left_best_s: z.number().finite().optional().nullable(),
  left_best_c: z.number().finite().optional().nullable(),
  left_best_a: optInt,
  left_auto_s: z.number().finite().optional().nullable(),
  left_auto_c: z.number().finite().optional().nullable(),
  left_auto_a: optInt,
  left_old_s: z.number().finite().optional().nullable(),
  left_old_c: z.number().finite().optional().nullable(),
  left_old_a: optInt,
  left_old_va: optStr(20),
  left_old_year: optInt,
  left_add: z.number().finite().optional().nullable(),
  left_pd: z.number().finite().optional().nullable(),
}).passthrough();

export const prescriptionUpdateSchema = prescriptionInputSchema.partial();

// Transactions
export const transactionItemSchema = z.object({
  name: z.string().trim().min(1, '品項名稱必填').max(200),
  item_type: z.enum(['frame', 'lens', 'exam', 'accessory', 'other']),
  quantity: z.number().int().min(1, '數量至少為 1').max(10_000),
  price: z.number().finite().min(0, '金額不可為負').max(1e9),
});

export const transactionInputSchema = z.object({
  member_id: z.string().uuid().optional().nullable(),
  prescription_id: z.string().uuid().optional().nullable(),
  subtotal: z.number().finite().min(0).max(1e9),
  discount: z.number().finite().min(0).max(1e9).optional(),
  credit_used: z.number().finite().min(0).max(1e9).optional(),
  coupon_used: z.number().int().min(0).max(1_000_000).optional(),
  total: z.number().finite().min(0).max(1e9),
  payment_method: z.enum(['cash', 'card', 'transfer']).optional(),
  notes: optStr(2000),
  transaction_date: optDate,
  items: z.array(transactionItemSchema).min(1, '至少需要一個品項').max(200),
});

export const memberUpdateSchema = memberInputSchema.partial();

export function formatZodError(err: z.ZodError): string {
  const issues = err.errors.slice(0, 3).map((e) => e.message).join('；');
  return issues || '輸入資料格式不正確';
}

export function zodErrorsToMap(err: z.ZodError): Record<string, string> {
  const m: Record<string, string> = {};
  for (const issue of err.errors) {
    const key = issue.path.join('.') || '_';
    if (!m[key]) m[key] = issue.message;
  }
  return m;
}
