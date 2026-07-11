/**
 * Verilen e-posta adresinin admin olup olmadığını döndürür.
 * Admin listesi ADMIN_EMAILS env değişkeninden okunur (virgülle ayrılır).
 * Sunucu tarafında çağrılmalıdır.
 */
export function isAdmin(email) {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

/**
 * Supabase server client'ından oturum açmış kullanıcıyı alır ve admin kontrolü yapar.
 * @returns {{ user, admin: boolean }}
 */
export async function getCurrentUser(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user, admin: isAdmin(user?.email) };
}
