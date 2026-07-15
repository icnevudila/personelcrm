# Sosyal hesap bağlantı kurulumu

Bu adımlar yalnızca senin yapacağın platform hesabı/izin işlemleridir. Uygulama secret’larını tarayıcıya göndermez; `.env.local` ve üretim ortamına eklenir.

## Ortak ayarlar

1. Güçlü bir `CREDENTIAL_ENCRYPTION_KEY` üret: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
2. `APP_URL` değerini gerçek HTTPS uygulama adresine ayarla.
3. Supabase migrations dosyalarını sırasıyla uygula.
4. Vercel’de aynı environment değerlerini ekle; Preview ve Production ortamlarını karıştırma.

## X

1. X Developer Console’da bir Project ve App oluştur; OAuth 2.0 Authorization Code with PKCE’yi aç.
2. Callback URL olarak tam biçimde `https://alan-adin/api/oauth/x/callback` ekle.
3. Uygulamanın write izinli bir planı olduğundan emin ol.
4. `X_CLIENT_ID` ve varsa `X_CLIENT_SECRET` değerlerini gir.
5. Uygulamada Social OS → **X hesabını bağla** seçeneğine tıkla ve X onayını ver.

Uygulama `tweet.read`, `tweet.write`, `users.read` ve `offline.access` izinlerini ister. Bağlantı tamamlandığında sadece hesap adı görünür; access/refresh token hiçbir API yanıtına dönmez.

## Instagram

1. Meta for Developers’da bir app oluştur; Instagram Graph API ve gerekli Content Publishing izinlerini ekle.
2. Instagram hesabını Business veya Creator yap ve uygun Facebook Page’e bağla.
3. Callback URL olarak `https://alan-adin/api/oauth/instagram/callback` ekle.
4. `META_APP_ID`, `META_APP_SECRET` ve gerekiyorsa `META_GRAPH_VERSION` değerlerini gir.
5. Social OS → **Instagram hesabını bağla** seçeneğinden Meta onayını ver.

İlk sürüm tek görsel post için `content.body.imageUrl` alanında dışarıdan HTTPS ile erişilebilen bir görsel bekler. Reel/carousel ve media-processing polling sonraki yayın akışında eklenmelidir; sistem bunları bağlıymış gibi göstermez.

## Telegram onayı

`TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALLOWED_USER_ID` ve `TELEGRAM_WEBHOOK_SECRET` tanımla; ardından `npm run telegram:setup` çalıştır. Social OS’ta **Onaya gönder** seçildiğinde bot; Onayla, Reddet ve Bugün atla düğmeleri olan 24 saatlik bir kart yollar.
