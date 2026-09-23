const fs = require("fs");
const path = require("path");
const { mdToHtml } = require("./md2html");
const { pageTemplate } = require("./page-template");

const SITE_ROOT = path.resolve(__dirname, "..");
const PUBLIC_APPS = "C:\\Users\\Public\\uygulamalar";

// app tanımları: klasör adı, görünen isim, kaynak dosyalar
const apps = [
  {
    slug: "arisen-life",
    name: "Arisen Life",
    src: path.join(PUBLIC_APPS, "sistem-app", "yasal"),
    files: { gizlilik: "gizlilik-politikasi.md", sartlar: "kullanim-sartlari.md" },
  },
  {
    slug: "levelup-study",
    name: "LevelUp Study / Kahraman",
    src: path.join(PUBLIC_APPS, "ders-app", "yasal"),
    files: { gizlilik: "gizlilik-metni.md", sartlar: "kullanim-sartlari.md" },
  },
  {
    slug: "inek",
    name: "İnek / StudyBot",
    src: path.join(PUBLIC_APPS, "not-app", "yasal"),
    files: { gizlilik: "gizlilik-politikasi.md", sartlar: "kullanim-sartlari.md" },
  },
  {
    slug: "auraboss",
    name: "AuraBOSS",
    src: path.join(PUBLIC_APPS, "yuz-app-kurulu", "yasal"),
    files: { gizlilik: "privacy-policy.md", sartlar: "terms-of-service.md" },
  },
  {
    slug: "inek-cozer",
    name: "İnek Çözer",
    src: path.join(PUBLIC_APPS, "soru-app", "yasal"),
    files: { gizlilik: "gizlilik-politikasi.md", sartlar: "kullanim-sartlari.md" },
  },
  {
    slug: "sutgolflix",
    name: "ŞutGolFlix",
    src: path.join(PUBLIC_APPS, "sutgol-app", "yasal"),
    files: {
      gizlilik: "gizlilik-politikasi.md",
      sartlar: "kullanim-sartlari.md",
      yarisma: "yarisma-kurallari.md",
    },
  },
];

const pageTitles = {
  gizlilik: "Gizlilik Politikası",
  sartlar: "Kullanım Şartları",
  yarisma: "Yarışma Kuralları",
};
const pageFileNames = {
  gizlilik: "gizlilik.html",
  sartlar: "kullanim-sartlari.html",
  yarisma: "yarisma-kurallari.html",
};

const doldurulacakReport = []; // {app, file, lineNo, lineText}
const skipped = [];
const builtPages = []; // {appSlug, appName, kind, fileName, title}

for (const app of apps) {
  if (!fs.existsSync(app.src)) {
    skipped.push(`${app.name} (${app.src} bulunamadı)`);
    continue;
  }
  const outDir = path.join(SITE_ROOT, app.slug);
  fs.mkdirSync(outDir, { recursive: true });

  for (const [kind, fname] of Object.entries(app.files)) {
    const srcPath = path.join(app.src, fname);
    if (!fs.existsSync(srcPath)) {
      skipped.push(`${app.name} - ${fname} (dosya yok)`);
      continue;
    }
    const raw = fs.readFileSync(srcPath, "utf8");

    // [DOLDURULACAK] geçen satırları raporla (kaynak dosyadaki gerçek satır no)
    const srcLines = raw.split(/\r?\n/);
    srcLines.forEach((l, idx) => {
      if (l.includes("[DOLDURULACAK") || l.includes("[DATE]") || l.includes("[COMPANY NAME]") || l.includes("[CONTACT EMAIL]") || l.includes("[JURISDICTION]")) {
        doldurulacakReport.push({
          app: app.name,
          file: fname,
          lineNo: idx + 1,
          lineText: l.trim().slice(0, 120),
        });
      }
    });

    const bodyHtml = mdToHtml(raw);
    const title = `${pageTitles[kind]} — ${app.name}`;
    const html = pageTemplate({ title, bodyHtml });
    const outFile = path.join(outDir, pageFileNames[kind]);
    fs.writeFileSync(outFile, html, "utf8");
    builtPages.push({
      appSlug: app.slug,
      appName: app.name,
      kind,
      fileName: pageFileNames[kind],
      title: pageTitles[kind],
    });
    console.log("YAZILDI:", outFile);
  }
}

// index.html üret
function buildIndex() {
  const grouped = {};
  for (const p of builtPages) {
    if (!grouped[p.appSlug]) grouped[p.appSlug] = { name: p.appName, pages: [] };
    grouped[p.appSlug].pages.push(p);
  }
  const order = ["gizlilik", "sartlar", "yarisma"];
  let items = "";
  for (const slug of Object.keys(grouped)) {
    const g = grouped[slug];
    g.pages.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
    const links = g.pages
      .map((p) => `<a href="${slug}/${p.fileName}">${p.title}</a>`)
      .join(" &middot; ");
    items += `<li><span class="app-name">${g.name}</span><div class="links">${links}</div></li>\n`;
  }

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>BIGGEST HOLDING — Yasal Metinler</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<div class="page">
<h1>BIGGEST HOLDING — Uygulama Yasal Metinleri</h1>
<p>Aşağıdaki uygulamaların gizlilik politikası ve kullanım şartları metinlerine buradan ulaşabilirsiniz.</p>
<ul class="app-list">
${items}
</ul>
</div>
</body>
</html>
`;
  fs.writeFileSync(path.join(SITE_ROOT, "index.html"), html, "utf8");
  console.log("YAZILDI: index.html");
}

buildIndex();

// stil dosyası
const css = `
:root { color-scheme: light; }
* { box-sizing: border-box; }
body {
  margin: 0;
  background: #ffffff;
  color: #1a1a1a;
  font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 17px;
  line-height: 1.6;
}
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 20px 80px;
}
h1 { font-size: 1.6em; margin-top: 0.2em; }
h2 { font-size: 1.3em; margin-top: 1.6em; border-top: 1px solid #eee; padding-top: 1em; }
h3 { font-size: 1.1em; margin-top: 1.3em; }
p { margin: 1em 0; word-wrap: break-word; }
a { color: #0b5fff; text-decoration: none; }
a:hover { text-decoration: underline; }
strong { font-weight: 600; }
blockquote {
  margin: 1em 0;
  padding: 0.6em 1em;
  background: #f6f6f8;
  border-left: 4px solid #ccc;
  border-radius: 4px;
}
blockquote p { margin: 0; }
ul { padding-left: 1.3em; }
li { margin: 0.4em 0; }
hr { border: none; border-top: 1px solid #e0e0e0; margin: 2.5em 0; }
.table-wrap { overflow-x: auto; margin: 1em 0; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; font-size: 0.95em; }
th { background: #f6f6f8; }
.back { margin-bottom: 1.5em; }
.back a { font-size: 0.95em; }
.app-list { list-style: none; padding: 0; }
.app-list li {
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 12px;
}
.app-name { font-weight: 600; display: block; margin-bottom: 6px; font-size: 1.05em; }
.links a { margin-right: 4px; }
@media (max-width: 480px) {
  body { font-size: 16px; }
  .page { padding: 20px 16px 60px; }
}
`;
fs.writeFileSync(path.join(SITE_ROOT, "style.css"), css.trim() + "\n", "utf8");
console.log("YAZILDI: style.css");

console.log("\n=== [DOLDURULACAK] / placeholder geçen yerler ===");
for (const r of doldurulacakReport) {
  console.log(`${r.app} / ${r.file}:${r.lineNo} -> ${r.lineText}`);
}
console.log(`\nToplam ${doldurulacakReport.length} satır.`);

console.log("\n=== Atlanan (bulunamayan) klasör/dosyalar ===");
for (const s of skipped) console.log("- " + s);
if (skipped.length === 0) console.log("(yok)");
