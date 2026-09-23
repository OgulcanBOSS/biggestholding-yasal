function pageTemplate({ title, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="stylesheet" href="../style.css">
</head>
<body>
<div class="page">
<p class="back"><a href="../index.html">&larr; Tüm uygulamalar</a></p>
${bodyHtml}
</div>
</body>
</html>
`;
}

module.exports = { pageTemplate };
