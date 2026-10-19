export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function resultToBlocks(r) {
  const b = [];
  if (r.message) b.push({ id: uid(), type: 'paragraph', text: r.message });
  (r.cards || []).forEach((c) => {
    b.push({ id: uid(), type: 'heading', text: c.title || 'Section' });
    if (c.summary) b.push({ id: uid(), type: 'paragraph', text: c.summary });
    (c.items || []).forEach((it) => {
      if (typeof it === 'string') b.push({ id: uid(), type: 'action', text: it, meta: { done: false } });
      else b.push({ id: uid(), type: 'action', text: it.title || 'Action', meta: { done: false, target: it.target || '', detail: it.detail || '' } });
    });
  });
  if (r.forecast) b.push({ id: uid(), type: 'forecast', text: 'Financial projection', meta: { forecast: r.forecast } });
  if (r.swot) b.push({ id: uid(), type: 'swot', text: 'SWOT Analysis', meta: { data: r.swot } });
  if (r.porter) b.push({ id: uid(), type: 'porter', text: "Porter's Five Forces", meta: { data: r.porter } });
  if (r.bmc) b.push({ id: uid(), type: 'bmc', text: 'Business Model Canvas', meta: { data: r.bmc } });
  if (r.market) b.push({ id: uid(), type: 'market', text: 'Market Intelligence', meta: { data: r.market } });
  if (r.pitch) {
    b.push({ id: uid(), type: 'heading', text: 'Elevator pitch' });
    b.push({ id: uid(), type: 'paragraph', text: r.pitch });
  }
  (r.citations || []).forEach((c, i) => b.push({ id: uid(), type: 'reference', text: c.title || 'Source', meta: { quote: c.quote || '', citeIndex: i + 1 } }));
  (r.sources || []).forEach((s) => b.push({ id: uid(), type: 'reference', text: s.title || s.url || 'Web source', meta: { url: s.url || '', quote: 'Found by web search agent' } }));
  return b;
}