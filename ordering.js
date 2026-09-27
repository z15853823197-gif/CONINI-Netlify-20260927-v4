/* Shared demo-order model. Existing v3 box records stay readable and unchanged. */
(() => {
  'use strict';
  const products = [...CONINI.products, ...CONINI.materials];
  const product = id => products.find(p => p.id === id);
  const model = id => CONINI.containers.find(c => c.id === id);
  const fixed = p => ['samples','materials'].includes(p.category);
  const selectionValid = s => !!(s && model(s.containerId)?.depths.includes(s.depth));
  const legacySpecs = p => fixed(p) ? [p.pack] : ['1 kg','2.5 kg'];
  const legacyPrice = (p,spec) => {const base=p.legacyKgPrice??p.price;return spec === '2.5 kg' ? Math.round(base * 2.4) : base;};
  const round = n => Math.round(n * 100) / 100;
  function offer(p,selection) {
    if (fixed(p)) return {id:p.id,spec:p.pack,unitPrice:p.price,weightG:p.category==='samples'?600:null,unit:p.unit};
    if (!selectionValid(selection)) return null;
    const c = model(selection.containerId), weightG = CONINI.standardPack.weightG;
    return {id:p.id,containerId:c.id,depth:selection.depth,spec:`${weightG} g / 盆`,weightG,unitPrice:p.price,unit:'盆'};
  }
  function validLine(l) {
    const p = l && product(l.id);
    if (!p || !Number.isInteger(l.qty) || l.qty < 1 || l.qty > 99) return false;
    if (l.containerId != null || l.depth != null) {
      return !fixed(p) && selectionValid(l) && Number.isInteger(l.weightG) && l.weightG > 0 &&
        typeof l.spec === 'string' && l.spec === `${l.weightG} g / 盆` &&
        Number.isFinite(l.unitPrice) && l.unitPrice >= 0;
    }
    return legacySpecs(p).includes(l.spec);
  }
  const key = l => l.containerId ? `${l.id}|${l.containerId}|${l.depth}` : `${l.id}|fixed|${l.spec}`;
  const price = l => l.containerId ? l.unitPrice : legacyPrice(product(l.id),l.spec);
  const legacy = l => !l.containerId && !fixed(product(l.id));
  const label = l => l.containerId ? `${model(l.containerId).name} · 深 ${l.depth} mm` : fixed(product(l.id)) ? '固定包装' : '历史盒装规格';
  window.ConiniOrdering = {product,model,fixed,selectionValid,legacySpecs,legacyPrice,offer,validLine,key,price,legacy,label,round};
})();
