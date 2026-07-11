Done! Congratulations on your new bot. You will find it at t.me/was_admin_bot. You can now add a description, about section and profile picture for your bot, see /help for a list of commands. By the way, when you've finished creating your cool bot, ping our Bot Support if you want a better username for it. Just make sure the bot is fully operational before you do this.

Use this token to access the HTTP API:
8844284016:AAHSXsgukAdaNJh7Db8Nx2IjHhlqJ8Hsk1c
Keep your token secure and store it safely, it can be used by anyone to control your bot.

For a description of the Bot API, see this page: https://core.telegram.org/bots/api

---

## Kurulum Notları

1. `.env` dosyasına `TELEGRAM_BOT_TOKEN` ekle (yukarıdaki token).
2. `@userinfobot` ile kendi Telegram User ID'ni öğren → `TELEGRAM_ALLOWED_USER_ID`
3. Supabase `auth.users` tablosundan admin kullanıcı UUID → `TELEGRAM_OWNER_USER_ID`
4. `SUPABASE_SERVICE_ROLE_KEY` zorunlu (bot DB erişimi için).
5. Vercel deploy sonrası webhook kur:
   ```bash
   curl -X POST "https://app.websitealsat.com/api/telegram/setup?secret=testtur-secret-key"


   app.websitealsat.com
   ```
6. `db.sql` içindeki `telegram_*` tablolarını Supabase'de çalıştır.