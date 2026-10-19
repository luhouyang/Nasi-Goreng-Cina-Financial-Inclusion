export function blocksToMarkdown(blocks) {
  return blocks.map((b) => {
    switch (b.type) {
      case 'heading': return `## ${b.text}`;
      case 'paragraph': return b.text;
      case 'idea': return `> 💡 ${b.text}`;
      case 'reference': return `- 🔗 **${b.text}**${b.meta?.quote ? `: "${b.meta.quote}"` : ''}${b.meta?.url ? ` (${b.meta.url})` : ''}`;
      case 'action': return `- [${b.meta?.done ? 'x' : ' '}] ${b.text}`;
      case 'forecast': {
        const rows = b.meta?.forecast?.rows || [];
        const head = '| Month | Units | Revenue | Gross | Net |\n|---|---|---|---|---|';
        const body = rows.map((r) => `| ${r.month} | ${r.units} | ${r.revenue} | ${r.gross_profit} | ${r.net_profit} |`).join('\n');
        return `### Financial forecast\n${head}\n${body}`;
      }
      case 'agent_result': return `**🤖 Agent:** ${b.text}${(b.meta?.steps || []).length ? '\n' + b.meta.steps.map((s) => `  - ${s}`).join('\n') : ''}`;
      default: return b.text || '';
    }
  }).join('\n\n');
}

export function download(filename, mime, content) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportWord(title, blocks) {
  const inner = blocks.map((b) => {
    if (b.type === 'heading') return `<h2>${b.text}</h2>`;
    if (b.type === 'paragraph') return `<p>${(b.text || '').replace(/\n/g, '<br/>')}</p>`;
    if (b.type === 'action') return `<p>☐ ${b.text} ${b.meta?.target ? `<br/><small>Target: ${b.meta.target}</small>` : ''}</p>`;
    if (b.type === 'reference') return `<p><b>${b.text}</b>: <i>${b.meta?.quote || ''}</i></p>`;
    if (b.type === 'forecast') {
      const rows = b.meta?.forecast?.rows || [];
      let table = '<table border="1"><tr><th>Month</th><th>Units</th><th>Revenue</th><th>Gross</th><th>Net</th></tr>';
      rows.forEach(r => { table += `<tr><td>M${r.month}</td><td>${r.units}</td><td>${r.revenue}</td><td>${r.gross_profit}</td><td>${r.net_profit}</td></tr>`; });
      table += '</table>';
      return `<h3>Financial Forecast</h3>${table}<p>Break-even: ${b.meta?.forecast?.break_even_units || '—'} units/month</p>`;
    }
    if (b.type === 'swot') {
      const d = b.meta?.data || {};
      return `<h3>SWOT Analysis</h3><table border="1"><tr><td><b>Strengths</b><ul>${(d.strengths||[]).map(x=>`<li>${x}</li>`).join('')}</ul></td><td><b>Weaknesses</b><ul>${(d.weaknesses||[]).map(x=>`<li>${x}</li>`).join('')}</ul></td></tr><tr><td><b>Opportunities</b><ul>${(d.opportunities||[]).map(x=>`<li>${x}</li>`).join('')}</ul></td><td><b>Threats</b><ul>${(d.threats||[]).map(x=>`<li>${x}</li>`).join('')}</ul></td></tr></table>`;
    }
    if (b.type === 'checklist') {
      const steps = b.meta?.steps || [];
      let html = `<h3>Checklist: ${b.text}</h3><ol>`;
      steps.forEach(s => {
        html += `<li><b>${s.text}</b><br/>`;
        if (s.owner) html += `Owner: ${s.owner}<br/>`;
        if (s.timing) html += `Timing: ${s.timing}<br/>`;
        if (s.cost) html += `Est. Cost: ${s.cost}<br/>`;
        if (s.legal) html += `Legal Note: ${s.legal}<br/>`;
        if (s.links && s.links.length) html += `Links: ${s.links.map(l => `<a href="${l}">${l}</a>`).join(', ')}<br/>`;
        html += `</li>`;
      });
      html += '</ol>';
      return html;
    }
    return `<p>${(b.text || '').replace(/\n/g, '<br/>')}</p>`;
  }).join('');
  
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial;} table{border-collapse:collapse;width:100%;} td,th{border:1px solid #ddd;padding:8px;}</style></head><body><h1>${title}</h1>${inner}</body></html>`;
  download(`${title.replace(/[^\w-]+/g, '_').slice(0, 60)}.doc`, 'application/msword', html);
}