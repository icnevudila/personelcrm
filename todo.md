.env.local içine CLAUDE_API_KEY koydum. Bunu kullanarak bir özellik geliştireceğiz. 


CopyFastTab içini güncelleyelim. Ana dizin içinde db.sql dosyası var. Eklemen gereken tabloları buraya ekle. 

Akış şöyle olmalıdır. Kullanıcı üstte artı butonu ile ilgili projeye sayfa eklemelidir. Eklenen sayfalar db ye kaydedilmelidir. Kullanıcı sayfa ve sayfaya bağlı komponent ekleyebilir. Her sayfa ve komponentin adı, açıklaması ve görsel yükleme için upload alanı bulunmalıdır. Görseli olmayan sayfa analiz edilemez. Uyarı mesajı verelim. 

Sayfa ve komponent ekleme, silme, güncelleme olmalıdır.

### Şimdiki sistemde prompt üret butonuna basınca ilgili sayfa veya komponent base64 olarak görseli apiye gönderip apide tek tek claude apisine gönderip prompt üreteliyiz. Tümünü üret butonu da olabilir. İlerleyişi kullanıcı görecektir. Hangi sayfa üretildi, hangisi üretilecek. Hangisinde hata verdi, hangisi bekliyor vs.

Görsel yüklendikten sonra hemen tabloda resim url update edilmelidir.
 Claude apisi ile prompt üretildikten sonra tüm sayfa analiz verisi update edilecektir.

### Prompt üret butonuna tıklayınca açılan percereden "Generating Yout Pages" yazsın ve sayfalar menü butonu gibi aynı stilde listelensin yan yana sığmayan aşağı taşsın (wrap). Prompt üret butonuna bastıktan sonra analiz edilen görsellerin üzerinden bir scanner line taramaya yapsın aşağı-yukarı animasyonla. Analiz edildiğini anlayalım. Api call yapılan ve başarılı olanda check işareti (yani ✓) gösterilsin. Hata verdiğinde ise x gösterilsin. Henüz apiye gönderilmeyi bekleyen sayfalarda ise loading gösterilsin. Her bir sayfa için uygun arka plan renklendirme ile daha açıklayıcı yap.

### Hangi sayfa gönderildi, hangisi bekliyor tümünü tutmamız gerekiyor. db de tutabiliriz. Örneğin status alanında "pending", "generated", "error" gibi değerler olacak. error durumunda ise hata mesajını da tabloda tutmalıyız.

### Bir backend apisi yazalım. Claude apisine görselleri tek tek göndermelidir.  Görseller sayfa sayfa gönderilecek. Her sayfa altında bir analzi butonu olsun .Kullanıcı tek tek tıklayabilir. 


Amacımız sayfa ve komponentleri claude apisi ile analiz ederek tasarım dili, ui tasarım, font, punto, renk paleti vs analiz etmesidir. Padding, radius, margin, bg, color, font vs. tüm ui analiz edilerek tasarım promptu üretilmelidir. Bu prompt cursor ai editöründe bir nextjs projesi için verilecek şekilde bir sonuç üretmelidir. 

Analiz sonrası üretilen prompt db update edilmelidir. Kullanıcı sayfa yenilese bil tüm sayfa, komponent, propmtlar listelenmelidir. Prompt indir butonu, copy butonu olmalıdır. Sayfa ve genel proje prompt indir ve copy butonları olmalıdır. Gerekli güncelemeyi yap. Projenin sayfa ve componentlerini, üretilen promptu tutacak bir tablo yapalım. Kullanıcı sürükle bırak ile sayfa ekleyebilmelidir. Sayfaya bir görsel sürükle bırak yaparsa oto ekleme modalı açılabilir -> Tür: page, component, name, description, save-update -> Eklenen sayfalar altında Ai Analiz butonu ve Proje analiz butonu olmalıdır. Tek tek sayfalar analiz edilebileceği gibi toplu analiz de yapılabilmelidir. Ancak kullanıcı toplu analiz yapsa bile claude tek tek gitmeli ve dönen prompt db update ettikten sonra diğer sayfa veya komponente geçmelidir. Bu özelliği yazalım
