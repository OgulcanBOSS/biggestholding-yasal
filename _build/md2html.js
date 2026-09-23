// Basit, bağımlılıksız Markdown -> HTML dönüştürücü.
// Başlıklar (#, ##, ###), kalın (**...**), listeler (- ...), tablolar (| | |),
// blockquote (> ...), yatay çizgi (---), paragraflar ve linkleri destekler.

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(text) {
  let t = escapeHtml(text);
  // bold
  t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // links [text](url)
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  // inline code `x`
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
  return t;
}

function mdToHtml(md) {
  const lines = md.split(/\r?\n/);
  let html = [];
  let i = 0;
  let inList = false;
  let inTable = false;
  let tableRows = [];

  function closeList() {
    if (inList) { html.push("</ul>"); inList = false; }
  }
  function flushTable() {
    if (!inTable) return;
    if (tableRows.length >= 1) {
      html.push('<div class="table-wrap"><table>');
      const header = tableRows[0];
      html.push("<thead><tr>" + header.map(c => `<th>${inline(c.trim())}</th>`).join("") + "</tr></thead>");
      html.push("<tbody>");
      for (let r = 2; r < tableRows.length; r++) {
        const row = tableRows[r];
        if (!row) continue;
        html.push("<tr>" + row.map(c => `<td>${inline(c.trim())}</td>`).join("") + "</tr>");
      }
      html.push("</tbody></table></div>");
    }
    tableRows = [];
    inTable = false;
  }

  while (i < lines.length) {
    let line = lines[i];

    // table row
    if (/^\s*\|.*\|\s*$/.test(line)) {
      closeList();
      const cells = line.trim().replace(/^\||\|$/g, "").split("|");
      tableRows.push(cells);
      inTable = true;
      i++;
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (/^\s*$/.test(line)) {
      closeList();
      i++;
      continue;
    }

    // horizontal rule
    if (/^\s*---+\s*$/.test(line)) {
      closeList();
      html.push("<hr>");
      i++;
      continue;
    }

    // headers
    let m = line.match(/^(#{1,6})\s+(.*)$/);
    if (m) {
      closeList();
      const level = m[1].length;
      html.push(`<h${level}>${inline(m[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    // blockquote
    if (/^\s*>\s?/.test(line)) {
      closeList();
      const content = line.replace(/^\s*>\s?/, "");
      html.push(`<blockquote><p>${inline(content)}</p></blockquote>`);
      i++;
      continue;
    }

    // list item
    m = line.match(/^\s*-\s+(.*)$/);
    if (m) {
      if (!inList) { html.push("<ul>"); inList = true; }
      html.push(`<li>${inline(m[1])}</li>`);
      i++;
      continue;
    }

    // default paragraph (collect until blank line)
    closeList();
    let para = [line];
    let j = i + 1;
    while (j < lines.length && !/^\s*$/.test(lines[j]) && !/^\s*>\s?/.test(lines[j]) &&
           !/^(#{1,6})\s+/.test(lines[j]) && !/^\s*-\s+/.test(lines[j]) &&
           !/^\s*---+\s*$/.test(lines[j]) && !/^\s*\|.*\|\s*$/.test(lines[j])) {
      para.push(lines[j]);
      j++;
    }
    const joined = para.join("\u0001");
    html.push(`<p>${inline(joined).replace(/\u0001/g, "<br>")}</p>`);
    i = j;
  }
  closeList();
  flushTable();
  return html.join("\n");
}

module.exports = { mdToHtml, escapeHtml };
