// 計算年齡：以今天日期與出生日期比較，未到生日則減 1。
// 無效或空值回傳 null。
export function calculateAge(birthday?: string | null): number | null {
  if (!birthday) return null;
  const b = new Date(birthday);
  if (isNaN(b.getTime())) return null;
  const today = new Date();
  // 排除未來日期
  if (b.getTime() > today.getTime()) return null;
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age < 0 ? null : age;
}
