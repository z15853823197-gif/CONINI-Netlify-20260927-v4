/* Local-only recharge prototype. Never a payment processor or a real balance. */
(() => {
  'use strict';
  const PREFIX = 'conini-recharge-demo-v1:';
  const presets = [10000, 20000, 50000, 100000];
  const MAX_CENTS = 100000000; // Demo input guard (¥1,000,000), not a production recharge policy.
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = cents => (cents / 100).toLocaleString('zh-CN', {minimumFractionDigits:2, maximumFractionDigits:2});
  let ui, draft = '', pending = null;

  function quote(cents) {
    const bonusCents = cents >= 10000000 ? 2500000 : cents >= 5000000 ? 600000 : cents >= 2000000 ? 100000 : 0;
    return {cents, bonusCents, totalCents:cents + bonusCents};
  }
  function breakdown(receipt) {
    return `<dl class="wallet-breakdown"><div><dt>充值金额</dt><dd data-wallet-principal>¥ ${money(receipt.cents)}</dd></div><div><dt>赠送金额</dt><dd class="wallet-bonus" data-wallet-bonus>¥ ${money(receipt.bonusCents)}</dd></div><div class="wallet-credit"><dt>合计到账</dt><dd data-wallet-total>¥ ${money(receipt.totalCents)}</dd></div></dl>`;
  }

  // Store each receipt independently: two tabs cannot overwrite each other's ledger.
  function ledger() {
    const records = [];
    let invalid = false;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith(PREFIX)) continue;
        try {
          const r = JSON.parse(localStorage.getItem(key));
          if (!r || ![1,2].includes(r.version) || !/^[a-f0-9-]{36}$/.test(r.id) || key !== PREFIX + r.id ||
              !Number.isSafeInteger(r.cents) || r.cents < 100 || r.cents > (r.version === 1 ? 5000000 : MAX_CENTS) ||
              r.method !== 'demo' || r.status !== 'success' || typeof r.createdAt !== 'string' || !Number.isFinite(Date.parse(r.createdAt))) {
            invalid = true; continue;
          }
          if (r.version === 2 && (!Number.isSafeInteger(r.bonusCents) || r.bonusCents < 0 || r.bonusCents > 2500000 ||
              !Number.isSafeInteger(r.totalCents) || r.totalCents !== r.cents + r.bonusCents)) {
            invalid = true; continue;
          }
          // Receipts are historical snapshots. Legacy entries never gain a retroactive bonus.
          records.push(r.version === 1 ? {...r, bonusCents:0, totalCents:r.cents} : r);
        } catch { invalid = true; }
      }
    } catch { return {records:[], cents:0, error:true}; }
    records.sort((a,b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
    const cents = records.reduce((total,r) => total + r.totalCents, 0);
    return {records, cents, error:invalid || !Number.isSafeInteger(cents)};
  }
  function parseAmount(value) {
    const raw = value.trim();
    if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(raw)) return null;
    const [whole, fraction = ''] = raw.split('.');
    const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
    return cents >= 100 && cents <= MAX_CENTS ? cents : null;
  }
  function balance(state = ledger()) { return state.error ? '暂不可用' : `¥ ${money(state.cents)}`; }
  const notice = '<p class="wallet-notice">仅供交互演示，不会实际扣款。余额与记录仅保存在当前浏览器，暂不参与订单扣款；清除浏览器数据后将丢失。</p>';
  const storageWarning = state => state.error ? '<p class="wallet-error" role="alert">充值记录暂时无法读取，请检查浏览器存储设置后刷新。原记录未被修改，本次充值已停用。</p>' : '';

  function overview() {
    const state = ledger();
    return `<section class="wallet-overview" aria-labelledby="walletOverviewTitle"><div class="wallet-overview-top"><h2 id="walletOverviewTitle">账户余额 <span>演示</span></h2><button class="text-link" data-go="recharge-records">充值记录 ${ui.icon('chevron')}</button></div><div class="wallet-overview-main"><strong data-wallet-balance>${balance(state)}</strong><button class="primary wallet-compact" data-go="recharge">去充值</button></div>${storageWarning(state)}</section>`;
  }
  function rechargePage() {
    const state = ledger(), cents = parseAmount(draft);
    pending = null;
    return `<div class="page-pad wallet-page">${ui.back('账户充值','profile')}<div class="wallet-balance-row"><span>当前余额 <small>演示</small></span><strong data-wallet-balance>${balance(state)}</strong></div>${storageWarning(state)}
      <form id="rechargeForm" novalidate>
        <fieldset class="wallet-options"><legend>选择充值金额</legend><div class="wallet-presets">${presets.map(value=>{const offer=quote(value*100);return `<button type="button" class="wallet-preset" data-wallet-amount="${value}" aria-pressed="${cents===value*100}"><strong>${value/10000}<span> 万元</span></strong><span class="wallet-preset-bonus">${offer.bonusCents?`赠送 ¥${(offer.bonusCents/100).toLocaleString('zh-CN')}`:'无赠送'}</span><small>到账 ¥${(offer.totalCents/100).toLocaleString('zh-CN')}</small></button>`;}).join('')}</div></fieldset>
        <label class="field wallet-amount-field" for="rechargeAmount">自定义充值金额（元）<input id="rechargeAmount" name="amount" type="text" inputmode="decimal" autocomplete="off" maxlength="10" placeholder="也可输入其他金额" value="${esc(draft)}" aria-describedby="rechargeHint rechargeRule rechargeError" required></label>
        <p id="rechargeHint" class="wallet-hint">演示单笔支持 ¥1–1,000,000，最多两位小数。</p><p id="rechargeRule" class="wallet-hint wallet-rule">单笔满2万元送1000元，满5万元送6000元，满10万元送25000元。自定义金额同享，取最高一档、不叠加。</p><p id="rechargeError" class="wallet-error" aria-live="polite" hidden></p>
        <section id="rechargeQuote" class="wallet-quote" aria-label="本次充值明细" aria-live="polite" aria-atomic="true" ${cents===null?'hidden':''}>${cents===null?'':breakdown(quote(cents))}</section>
        <div class="wallet-payment"><span>支付方式</span><strong>模拟支付 · 不会扣款</strong></div><button class="primary" id="rechargeContinue" type="submit" ${cents===null||state.error?'disabled':''}>${cents===null?'选择金额，继续充值':`继续充值 ¥ ${money(cents)}`}</button>
      </form><button class="text-link wallet-history-link" data-go="recharge-records">查看充值记录 ${ui.icon('arrow')}</button>${notice}</div>`;
  }
  function recordsPage() {
    const state = ledger();
    return `<div class="page-pad wallet-page">${ui.back('充值记录','profile')}<div class="wallet-balance-row"><span>当前余额 <small>演示</small></span><strong data-wallet-balance>${balance(state)}</strong></div>${storageWarning(state)}${state.records.length?`<p class="wallet-hint">共 ${state.records.length} 笔 · 仅当前浏览器</p><ul class="wallet-records">${state.records.map(r=>`<li><div class="wallet-record-top"><strong>余额充值</strong><b>+ ¥ ${money(r.totalCents)}</b></div><p class="wallet-record-breakdown">充值 ¥ ${money(r.cents)}<span>赠送 ¥ ${money(r.bonusCents)}</span></p><div class="wallet-record-meta"><time datetime="${esc(r.createdAt)}">${esc(new Date(r.createdAt).toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}))}</time><span>模拟到账</span></div><p class="wallet-receipt-id">记录号 ${esc(r.id)}</p></li>`).join('')}</ul><button class="secondary action-gap" data-go="recharge">继续充值</button>`:!state.error?`<div class="wallet-empty">${ui.icon('order')}<h2>还没有充值记录</h2><p>完成一次模拟充值后，可以在这里查看充值、赠送与到账金额。</p><button class="secondary" data-go="recharge">去充值</button></div>`:''}${notice}</div>`;
  }
  function successPage(id) {
    const state = ledger(), receipt = state.records.find(r=>r.id===id);
    if (!receipt || state.error) return `<div class="page-pad wallet-page">${ui.back('充值结果','profile')}<div class="wallet-empty"><h2>暂未找到充值记录</h2><p>记录仅保存在完成充值的浏览器中。</p><button class="secondary" data-go="recharge-records">查看充值记录</button></div>${notice}</div>`;
    return `<div class="page-pad wallet-page">${ui.back('充值结果','profile')}<div class="wallet-success">${ui.icon('check')}<h2>模拟充值成功</h2><span class="wallet-success-label">合计到账</span><strong>¥ ${money(receipt.totalCents)}</strong><p>充值及赠送已计入演示余额，未产生实际扣款。</p></div>${breakdown(receipt)}<div class="wallet-balance-row"><span>当前余额 <small>演示</small></span><strong data-wallet-balance>${balance(state)}</strong></div><button class="primary" data-go="profile">返回我的</button><button class="secondary action-gap" data-go="recharge-records">查看充值记录</button>${notice}</div>`;
  }
  function updateForm(showError = false) {
    const input = $('#rechargeAmount');
    if (!input) return;
    draft = input.value;
    const cents = parseAmount(draft), state = ledger(), error = $('#rechargeError');
    document.querySelectorAll('[data-wallet-amount]').forEach(button=>button.setAttribute('aria-pressed',String(cents===Number(button.dataset.walletAmount)*100)));
    $('#rechargeContinue').disabled = cents === null || state.error;
    $('#rechargeContinue').textContent = cents === null ? '选择金额，继续充值' : `继续充值 ¥ ${money(cents)}`;
    $('#rechargeQuote').hidden = cents === null;
    $('#rechargeQuote').innerHTML = cents === null ? '' : breakdown(quote(cents));
    if (showError || !error.hidden) {
      error.hidden = cents !== null;
      error.textContent = cents === null ? '请输入 ¥1–1,000,000 的金额，最多保留两位小数。' : '';
      input.setAttribute('aria-invalid',String(cents===null));
    }
  }
  function confirmRecharge(button) {
    if (!pending || pending.id !== button.dataset.walletConfirm || !$('#modal')?.open) return;
    button.disabled = true;
    const receipt = pending;
    try {
      if (ledger().error) throw new Error('storage');
      const key = PREFIX + receipt.id;
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(receipt));
      const saved = JSON.parse(localStorage.getItem(key));
      if (!saved || JSON.stringify(saved) !== JSON.stringify(receipt)) throw new Error('storage');
    } catch {
      button.disabled = false;
      const error = $('#rechargeConfirmError');
      error.textContent = '未能保存充值记录，余额未增加。请检查浏览器存储权限或可用空间后重试。';
      error.hidden = false;
      return;
    }
    pending = null; draft = '';
    $('#modal').close();
    ui.go('recharge-success/' + receipt.id);
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-wallet-amount') && $('#rechargeAmount')) {
      $('#rechargeAmount').value = button.dataset.walletAmount;
      updateForm();
    }
    if (button.hasAttribute('data-wallet-confirm')) confirmRecharge(button);
  });
  document.addEventListener('input', e=>{if(e.target.id==='rechargeAmount')updateForm();});
  document.addEventListener('focusout', e=>{if(e.target.id==='rechargeAmount')updateForm(true);});
  document.addEventListener('submit', event => {
    if (event.target.id !== 'rechargeForm') return;
    event.preventDefault();
    updateForm(true);
    const cents = parseAmount(draft), state = ledger();
    if (cents === null || state.error) {$('#rechargeAmount').focus();return;}
    pending = {version:2,id:crypto.randomUUID(),...quote(cents),createdAt:new Date().toISOString(),status:'success',method:'demo'};
    ui.modal('确认模拟充值',`${breakdown(pending)}<p>赠送按本次充值金额取最高一档，不叠加。仅增加本浏览器的演示余额，不会实际扣款，也不会抵扣订单金额。</p><p id="rechargeConfirmError" class="wallet-error" role="alert" hidden></p><button class="primary action-gap" data-wallet-confirm="${pending.id}">确认模拟充值 ¥ ${money(cents)}</button><button class="secondary action-gap" data-action="closeModal">返回修改</button>`);
  });
  window.addEventListener('hashchange',()=>{pending=null;});
  window.addEventListener('storage', event => {
    if (event.key !== null && !event.key.startsWith(PREFIX)) return;
    const state = ledger();
    document.querySelectorAll('[data-wallet-balance]').forEach(el=>el.textContent=balance(state));
    updateForm();
    if (location.hash === '#recharge-records') ui.render();
  });
  window.ConiniWallet = {configure:options=>{ui=options;},overview,rechargePage,recordsPage,successPage};
})();
