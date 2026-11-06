# SUMI 墨 — strona z blogiem na CMS

Fikcyjna restauracja, projekt portfolio. Blog działa na **Eleventy**, wpisy edytuje się w **Sveltia CMS** (`/admin`), a strona wdraża się sama na **Cloudflare Workers** po każdej zmianie w repozytorium GitHub.

Wszystkie strony mają `noindex`. Build przerywa się, jeśli jakakolwiek strona go nie ma.

## Lokalnie

Wymagany Node.js 22 lub nowszy.

```bash
npm install
npm run dev        # http://localhost:8080
npm run build      # gotowa strona w folderze _site
```

## Gdzie co jest

| Ścieżka | Zawartość |
|---|---|
| `src/blog/*.md` | wpisy (pola: `title`, `date`, `description`, `image` i treść) |
| `src/zdjecia/blog/` | zdjęcia bloga, także te dodane przez CMS |
| `src/index.html` | strona główna, zwykły HTML |
| `src/img/` | zdjęcia strony głównej (gotowe WebP) |
| `src/_includes/layouts/` | wygląd bloga |
| `src/assets/blog.css` | style bloga |
| `src/admin/` | Sveltia CMS (`index.html`, `config.yml`) |
| `src/_data/site.js` | adres strony, menu, telefon |
| `src/sitemap.njk` | szablon `sitemap.xml`, adresy dodają się same |
| `eleventy.config.js` | build: WebP, czcionki, minifikacja, kontrola `noindex` |
| `wrangler.jsonc` | konfiguracja Cloudflare Workers |

Zdjęcia dodane przez CMS mogą być w dowolnym rozmiarze (JPG, PNG, WebP). Build robi z nich WebP o szerokości 480, 800, 1200 i maksymalnie 1600 px.

W treści wpisu zdjęcie z wypełnionym polem **Title** dostaje podpis pod spodem.

## Wdrożenie

### 1. GitHub

1. Utwórz na GitHubie **puste** repozytorium `sumi-cms-test` (bez README i `.gitignore`).
2. W `src/admin/config.yml` zamień `TWOJ-LOGIN-GITHUB` na swój login.
3. W tym folderze uruchom (z własnym loginem):

```bash
git add src/admin/config.yml
git commit -m "Ustaw repozytorium CMS"
git remote add origin https://github.com/TWOJ-LOGIN-GITHUB/sumi-cms-test.git
git push -u origin main
```

### 2. Cloudflare

1. W panelu Cloudflare otwórz **Workers & Pages → Create → Workers → Import a repository**.
2. Połącz konto GitHub i wybierz `sumi-cms-test`.
3. Ustaw:
   - **Project name:** `sumi-cms-test` (musi być takie jak `name` w `wrangler.jsonc`)
   - **Build command:** puste (build uruchamia się w kroku deploy, z `wrangler.jsonc`)
   - **Deploy command:** `npx wrangler deploy`
   - **Production branch:** `main`
4. Kliknij **Deploy** i poczekaj na adres `https://sumi-cms-test.TWOJA-SUBDOMENA.workers.dev`.

### 3. Adres strony

W `src/_data/site.js` wpisz prawdziwy adres zamiast `TWOJA-SUBDOMENA`, a potem:

```bash
git add src/_data/site.js
git commit -m "Ustaw adres strony"
git push
```

Od tego adresu zależą `sitemap.xml`, linki kanoniczne i Open Graph.

### 4. Logowanie do CMS

1. Otwórz `https://TWOJ-ADRES/admin/` i wybierz **Zaloguj się za pomocą tokenu dostępu**.
2. Okno logowania ma link do GitHuba z gotowymi uprawnieniami. Jeśli tworzysz token ręcznie, wybierz fine-grained token tylko dla tego repozytorium, z uprawnieniem **Contents: Read and write**.
3. Wklej token do okna logowania.

Przycisk **Zaloguj się przez GitHub** wymaga osobnego serwera OAuth, który nie jest skonfigurowany. Przy jednym lub kilku redaktorach wystarczy token.

Zapisanie wpisu tworzy commit na GitHubie, a Cloudflare sam buduje i publikuje stronę.
