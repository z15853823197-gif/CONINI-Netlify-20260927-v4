(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = n => Number(n).toFixed(2).replace(/\.00$/, '');
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { toast('浏览器未允许保存；本次体验仍可继续'); } };
  const icons = {
    home:'<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
    grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    order:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z"/><path d="M9 8h6M9 12h6"/>',
    user:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    bag:'<path d="M5 7h14l1 14H4Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
    search:'<circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/>',
    arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
    back:'<path d="M20 12H4m6-6-6 6 6 6"/>',
    chevron:'<path d="m9 5 7 7-7 7"/>',
    close:'<path d="m5 5 14 14M19 5 5 19"/>',
    repeat:'<path d="M3 10a9 9 0 0 1 15-6l3 3M21 3v4h-4M21 14a9 9 0 0 1-15 6l-3-3M3 21v-4h4"/>',
    box:'<path d="m3 7 9-4 9 4v11l-9 4-9-4Z"/><path d="m3 7 9 4 9-4M12 11v11M7.5 5l9 4v5"/>',
    pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    check:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    building:'<path d="M3 21h18M5 21V5l7-3 7 3v16M9 8h1m4 0h1M9 12h1m4 0h1M10 21v-5h4v5"/>',
    chat:'<path d="M21 11a9 9 0 0 1-9 9H4l-2 2V11a9.5 9.5 0 0 1 19 0Z"/><path d="M7 11h.1m4.9 0h.1m4.9 0h.1"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.box}</svg>`;
  const all = [...CONINI.products, ...CONINI.materials];
  const product = id => all.find(p => p.id === id);
  const O = ConiniOrdering;
  const W = ConiniWallet;
  const validLine = O.validLine;
  let selectedContainer = read('conini-container-v1',null);
  if (!O.selectionValid(selectedContainer)) selectedContainer = null;
  let pickerDraft = {containerId:null,depth:null}, pendingReorder = null;
  const storedCart = read('conini-cart-v3', []);
  let cartRepriced = false;
  let cart = Array.isArray(storedCart) ? storedCart.filter(validLine).map(l=>{
    if(!l.containerId)return l;
    const current=O.offer(product(l.id),l);
    if(l.weightG!==current.weightG||l.unitPrice!==current.unitPrice||l.spec!==current.spec)cartRepriced=true;
    return {...l,...current};
  }) : [];
  const demoLine = (id,qty=1) => ({id,qty,spec:'1 kg'});
  const initialOrders = [
    {id:'DEMO-26091901',date:'2026-09-19',status:'ship',items:[demoLine('pistachio',2),demoLine('milk',3),demoLine('strawberry',2)],address:{name:'演示门店',phone:'仅供演示',address:'北京 · 演示收货地址'},note:'示例历史订单'},
    {id:'DEMO-26091802',date:'2026-09-18',status:'pay',items:[demoLine('mango',2),demoLine('chocolate')],address:{name:'演示门店',phone:'仅供演示',address:'北京 · 演示收货地址'}},
    {id:'DEMO-26091603',date:'2026-09-16',status:'receive',items:[demoLine('hazelnut',2),demoLine('vanilla',2)],address:{name:'演示门店',phone:'仅供演示',address:'北京 · 演示收货地址'}},
    {id:'DEMO-26091204',date:'2026-09-12',status:'done',items:[demoLine('pistachio'),demoLine('milk',2),demoLine('matcha')],address:{name:'演示门店',phone:'仅供演示',address:'北京 · 演示收货地址'}}
  ];
  const storedOrders = read('conini-orders-v3', initialOrders);
  let orders = Array.isArray(storedOrders) ? storedOrders.filter(o => o && typeof o.id === 'string' && ['pay','ship','receive','done','after'].includes(o.status) && Array.isArray(o.items) && o.items.length && o.items.every(validLine)) : initialOrders;
  let profile = read('conini-profile-v3', {name:'CONINI 合作门店',type:'咖啡与甜品店'});
  if (!profile || typeof profile.name !== 'string') profile={name:'CONINI 合作门店',type:'咖啡与甜品店'};
  let address = read('conini-address-v3', {name:'',phone:'',address:''});
  if (!address || typeof address !== 'object') address={name:'',phone:'',address:''};
  let category='all', query='', filter='all', orderFilter='all', toastTimer;
  let releaseShowcase = () => {};
  let releaseFlavors = () => {};
  const statuses={pay:'待付款',ship:'待发货',receive:'待收货',done:'已完成',after:'售后中'};
  const persistCart = () => save('conini-cart-v3',cart);
  const persistOrders = () => save('conini-orders-v3',orders);
  const amount = lines => O.round(lines.reduce((s,l) => s + O.price(l)*l.qty,0));
  const count = lines => lines.reduce((s,l)=>s+l.qty,0);
  const go = route => { if(location.hash === '#'+route) render(); else location.hash=route; };
  const route = () => location.hash.slice(1) || 'home';
  function toast(msg){$('#toast').textContent=msg;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2600);}
  function empty(title,description,button='去选品',target='select'){return `<div class="empty">${icon('bag')}<h2>${title}</h2><p>${description}</p>${button?`<button class="secondary" data-go="${target}">${button}</button>`:''}</div>`;}
  const back = (title,target='home') => `<div class="back-heading"><button class="icon-btn" data-go="${target}" aria-label="返回">${icon('back')}</button><h1>${title}</h1></div>`;
  const demoNote = '<p class="notice">交互演示 · 所有价格、规格、库存与交易状态均为示例，不构成实际报价。不收款、不发货。</p>';
  function header(){
    $('#header').innerHTML=`<div class="header-left"><a href="#home" class="wordmark" aria-label="CONINI 首页"><img src="./assets/conini-wordmark.svg" alt="CONINI" width="112" height="25"></a><span class="header-label">GELATO<br>合作伙伴订货</span></div><button class="icon-btn" data-go="cart" aria-label="购物袋，共${count(cart)}件">${icon('bag')}${cart.length?`<span class="badge">${count(cart)}</span>`:''}</button>`;
    const current=route().split('/')[0];
    const active=current.startsWith('recharge')?'profile':current;
    $('#bottomNav').innerHTML=[['home','首页','home'],['select','下单','grid'],['welcome','','brand'],['orders','订单','order'],['profile','我的','user']].map(([target,label,ic])=>ic==='brand'
      ? '<button type="button" class="nav-item brand-nav" data-action="welcome" aria-label="打开 CONINI 品牌欢迎页" aria-haspopup="dialog"><img src="./assets/brand-logo.svg" alt="" width="58" height="70"></button>'
      : `<a href="#${target}" class="nav-item ${active===target||(target==='select'&&active==='product')?'active':''}" ${active===target||(target==='select'&&active==='product')?'aria-current="page"':''}>${icon(ic)}<span>${label}</span></a>`).join('');
    const dock=cart.length&&!current.startsWith('recharge')&&!['cart','checkout','success'].includes(active);
    $('#cartDock').innerHTML=dock?`<div class="cart-dock"><div>¥ ${money(amount(cart))}<small>已选 ${count(cart)} 件 · 演示价格</small></div><button data-go="cart">查看购物袋 →</button></div>`:'';
    $('.app-shell').classList.toggle('has-cart',!!dock);
  }
  function quantityControl(l){
    const p=product(l.id), key=O.key(l), qty=cart.find(x=>O.key(x)===key)?.qty||0;
    return `<div class="line-control" data-control-key="${esc(key)}">${qty?`<div class="quantity"><button data-qty="-1" data-key="${esc(key)}" aria-label="减少${p.name}数量">−</button><input aria-label="${p.name}数量" type="number" inputmode="numeric" min="0" max="99" step="1" value="${qty}" data-quantity="${esc(key)}"><button data-qty="1" data-key="${esc(key)}" aria-label="增加${p.name}数量" ${qty===99?'disabled':''}>+</button></div>`:`<button class="plus" data-add="${p.id}" aria-label="添加${p.name}到购物袋"><span>+</span></button>`}</div>`;
  }
  function card(p,index=0){
    const l=O.offer(p,selectedContainer), sample=p.category==='samples';
    return `<article class="product-card order-product" data-product="${p.id}">
      <button class="product-image" data-go="product/${p.id}" aria-label="查看${p.name}"><img src="./assets/catalog/${p.image}.webp" alt="${p.name}" loading="${index<4?'eager':'lazy'}" decoding="async" width="444" height="444"></button>
      <div class="product-copy">
        <div class="product-heading"><button class="product-label" data-go="product/${p.id}"><h3>${p.name}</h3><p class="product-en" lang="en">${p.en}</p></button><div class="price-row"><span class="price-caption">${sample?'每组价':'整盆价'}</span><strong class="price">¥ ${money(l.unitPrice)}</strong></div></div>
        <div class="product-purchase"><div class="product-specs"><p class="product-meta">${sample?`<span class="spec-prefix">固定试吃装 · </span>${p.pack}`:`<span class="spec-prefix">净含量 </span>${l.weightG} g / 盆`}</p><p class="unit-price"><span class="spec-prefix">折合 </span>¥${money(l.unitPrice/l.weightG*500)} / 500 g</p></div><div class="product-actions">${quantityControl(l)}</div></div>
        <p class="ingredient-copy">${sample?'固定包装，不使用所选容器。组合与主料待工厂确认。':`<span>主料参考</span> ${CONINI.ingredientDrafts[p.id]}<small>待工厂确认</small>`}</p>
      </div>
    </article>`;
  }
  function pickerContents(){
    const c=O.model(pickerDraft.containerId);
    return `<div class="container-grid" role="group" aria-label="选择容器型号">${CONINI.containers.map(m=>`<button class="container-choice ${m.id===pickerDraft.containerId?'selected':''}" data-container="${m.id}" aria-pressed="${m.id===pickerDraft.containerId}" aria-label="${m.name}，${m.length}乘${m.width}毫米"><span class="container-photo"><img src="./assets/container-${m.id}.webp" alt="${m.name}" width="800" height="600"></span><span class="container-label"><strong>${m.name}</strong><span>${m.length} × ${m.width} mm</span><small>深 ${m.depths.join(' / ')} mm</small></span><span class="container-check" aria-hidden="true">${m.id===pickerDraft.containerId?'✓':''}</span></button>`).join('')}</div><div class="depth-section"><div class="depth-heading"><h2>选择深度</h2><span>${c?'必选':'请先选择上方盆型'}</span></div><div class="depth-options" role="group" aria-label="选择容器深度">${c?c.depths.map(d=>`<button data-depth="${d}" aria-pressed="${pickerDraft.depth===d}" class="${pickerDraft.depth===d?'active':''}">深 ${d} mm</button>`).join(''):'<p class="subtext">每种盆型提供两档深度。</p>'}</div><p class="container-policy">容器不收费 · 一单可选多种容器</p></div><button class="primary" data-action="confirmContainer" ${O.selectionValid(pickerDraft)?'':'disabled'}>${selectedContainer?'使用此容器':'确认容器，选择口味'} ${icon('arrow')}</button>${selectedContainer?'<p class="selection-note">仅影响接下来添加的口味，购物袋内商品保持不变。</p>':'<p class="selection-note">容器尺寸来自参考图；净含量与价格为演示数据。</p>'}`;
  }
  function containerGate(){return `<section class="page-pad container-gate"><div class="order-steps"><span class="active">01 选择容器</span><span>02 选择口味</span></div><h1 class="page-title">先选一款合适的容器</h1><p class="subtext">确认盆型和深度，再为门店搭配风味。</p>${pendingReorder?'<p class="reorder-hint">先选容器，下一步确认复购商品与规格。</p>':''}<div id="containerPicker">${pickerContents()}</div></section>`;}
  function containerSummary(){const c=O.model(selectedContainer.containerId);return `<div class="current-container"><div><span class="container-caption">当前容器</span><strong>${c.name} <span>深 ${selectedContainer.depth} mm</span></strong><p>${c.length} × ${c.width} × ${selectedContainer.depth} mm · 容器不收费</p></div><button class="text-link" data-action="changeContainer">更换 ${icon('chevron')}</button></div>`;}
  function refreshPicker(focusSelector){const picker=$('#containerPicker');if(picker){picker.innerHTML=pickerContents();if(focusSelector)picker.querySelector(focusSelector)?.focus({preventScroll:true});}}
  function refreshControls(){
    const active=document.activeElement, key=active.closest?.('[data-control-key]')?.dataset.controlKey;
    const direction=active.dataset?.qty, editing=active.hasAttribute?.('data-quantity');
    document.querySelectorAll('[data-control-key]').forEach(el=>{const l=cart.find(x=>O.key(x)===el.dataset.controlKey)||O.offer(product(el.dataset.controlKey.split('|')[0]),selectedContainer);if(l)el.outerHTML=quantityControl(l);});
    if(key){const wrapper=[...document.querySelectorAll('[data-control-key]')].find(el=>el.dataset.controlKey===key);wrapper?.querySelector(editing?'input,button':direction?`button[data-qty="${direction}"]:not(:disabled),button[data-add]`:'button')?.focus({preventScroll:true});}
  }
  function home(){
    const latest=orders.find(o=>o.status==='ship')||orders[0];
    return `<div class="page-pad"><button class="search" style="width:100%" data-go="select">${icon('search')}<span class="subtext">寻找一款好风味</span><span style="margin-left:auto" class="eyebrow">31 FLAVORS</span></button>${ConiniShowcase.markup(CONINI.homeSlides)}${latest?`<button class="order-peek" style="width:100%;text-align:left" data-go="order/${latest.id}"><div><h3><span class="dot"></span>当前订单 · ${statuses[latest.status]}</h3><p>${latest.date} · ${count(latest.items)} 件商品 · 演示订单</p></div>${icon('chevron')}</button>`:''}${ConiniFlavors.markup(CONINI)}<button class="factory-teaser" data-go="factory" style="width:100%;text-align:left"><img src="./assets/brand-collage.webp" alt="CONINI 品牌理念四拼示意：自主研发、国际合作、意式手作与现代化生产。" loading="lazy" width="1200" height="675"><div class="factory-teaser-caption"><div><span class="eyebrow">BEHIND THE GELATO</span><h3>每一份风味，从这里开始</h3></div>${icon('arrow')}</div></button><p class="company-footer">秉承传统，坚持手作。<br>${CONINI.company}</p></div>`;
  }
  function filtered(){return CONINI.products.filter(p=>(category==='all'||(category==='offers'?p.offer:p.category===category))&&(filter==='all'||p.type===filter)&&(!query||`${p.name} ${p.en}`.toLowerCase().includes(query.toLowerCase())));}
  function catalog(){if(!selectedContainer)return containerGate();return `<section class="catalog-intro"><div class="order-steps"><span>01 选择容器</span><span class="active">02 选择口味</span></div><h1 class="page-title">为门店，搭配好风味。</h1>${containerSummary()}<p class="catalog-disclaimer">演示净含量与价格 · 主料参考，待工厂确认</p><label class="search">${icon('search')}<input id="searchInput" type="search" placeholder="搜索口味，如开心果、雪葩" value="${esc(query)}" aria-label="搜索口味"><button data-action="clearSearch" aria-label="清空搜索">×</button></label><div class="segmented" aria-label="冰淇淋类型">${[['all','全部'],['Gelato','Gelato · 冰淇淋'],['Sorbetto','Sorbetto · 雪葩']].map(([id,n])=>`<button data-filter="${id}" aria-pressed="${filter===id}" class="${filter===id?'active':''}">${n}</button>`).join('')}</div></section><div class="catalog-body ordering-catalog"><nav class="category-rail" aria-label="口味大类">${CONINI.categories.map(([id,n])=>`<button data-category="${id}" class="${category===id?'active':''}" aria-pressed="${category===id}">${n}</button>`).join('')}</nav><section class="catalog-content" id="catalogResults" aria-live="polite">${catalogResults()}</section></div>`;}
  function catalogResults(){const list=filtered();return `<div class="catalog-heading"><h2>${query?'搜索结果':CONINI.categories.find(c=>c[0]===category)[1]}</h2><span>${list.length} 款</span></div>${list.length?`<div class="products">${list.map(card).join('')}</div>`:empty('暂未找到这款风味','试试其他关键词，或切换分类。','清除筛选','select-reset')}<p class="photo-note">演示价格 / 规格待确认<br>${category==='offers'?'特惠为分类演示，不代表实际优惠。':category==='samples'?'组合为试吃方案演示，图片仅展示代表口味。':'风味分类供体验，配方与过敏原以实际产品标签为准。'}</p>`;}
  function updateCatalog(){if($('#catalogResults')&&selectedContainer)$('#catalogResults').innerHTML=catalogResults();document.querySelectorAll('[data-category]').forEach(e=>{e.classList.toggle('active',e.dataset.category===category);e.setAttribute('aria-pressed',e.dataset.category===category);});document.querySelectorAll('[data-filter]').forEach(e=>{e.classList.toggle('active',e.dataset.filter===filter);e.setAttribute('aria-pressed',e.dataset.filter===filter);});}
  function detail(id){
    const p=product(id);if(!p)return `<div class="page-pad">${empty('未找到商品','该商品可能已调整。')}</div>`;
    if(!selectedContainer)return containerGate();
    const l=O.offer(p,selectedContainer), fixed=O.fixed(p);
    return `<div class="page-pad order-detail-product">${back('口味详情','select')}${!fixed?containerSummary():''}${p.image?`<img class="detail-hero" src="./assets/${p.image}.webp" alt="${p.name}">`:'<div class="material-detail-cover">历史物料方案</div>'}<div class="detail-title"><h1>${p.name}</h1></div><span class="eyebrow">${p.en}</span><p class="detail-description">${p.description}</p><div class="detail-facts"><div><span>包装规格</span><strong>${l.spec}${fixed?' · 固定包装':' · 演示净含量'}</strong></div>${l.weightG?`<div><span>参考单价</span><strong>¥ ${money(l.unitPrice/l.weightG*500)} / 500 g</strong></div>`:''}<div><span>主料参考</span><strong>${CONINI.ingredientDrafts[p.id]||'组合与主料待确认'}</strong></div></div><p class="ingredient-notice">主料参考，待工厂确认。非完整配料表，不作为过敏原判断依据。</p>${fixed?'<p class="subtext">此商品采用固定包装，不使用当前选择的容器。</p>':''}<div class="detail-purchase"><div><span class="price-caption">${fixed?'每组价':'整盆价'}</span><strong class="price">¥ ${money(l.unitPrice)}</strong><small>演示价格</small></div>${quantityControl(l)}</div>${demoNote}</div>`;
  }
  function cartRow(l,editable=true){const p=product(l.id);return `<article class="cart-item" data-line-key="${esc(O.key(l))}">${p.image?`<img src="./assets/${p.image}.webp" alt="${p.name}">`:'<div class="material-mini">Conini</div>'}<div class="cart-item-body"><div class="cart-item-head"><h3>${p.name}</h3>${editable?`<button class="remove" data-remove="${esc(O.key(l))}" aria-label="移除${p.name}，${O.label(l)}">移除</button>`:''}</div><p class="line-container">${O.label(l)}</p><p class="subtext">${esc(l.spec)}${l.containerId?' · 净含量演示':''}</p><div class="cart-item-foot"><span class="price"><small>¥ </small>${money(O.price(l))}<small> / ${l.containerId?'盆':O.legacy(l)?'盒':p.unit}</small></span>${editable?quantityControl(l):`<span class="subtext">× ${l.qty}</span>`}</div><p class="line-subtotal">商品小计 ¥ ${money(O.price(l)*l.qty)}</p></div></article>`;}
  function summary(lines){return `<div class="summary"><div><span>商品小计</span><span>¥ ${money(amount(lines))}</span></div><div class="container-fee"><span>容器费</span><span>¥ 0 <small>（不收费）</small></span></div><div><span>配送费</span><span>¥ 0 <small>（演示）</small></span></div><div class="total"><span>合计 <small> ${count(lines)} 件</small></span><span class="price">¥ ${money(amount(lines))}</span></div></div>`;}
  function cartPage(){return `<div class="page-pad">${back('购物袋','select')}${cart.length?`${cart.map(l=>cartRow(l)).join('')}${summary(cart)}<button class="primary" data-go="checkout">确认商品，去结算 ${icon('arrow')}</button><button class="text-link" data-go="select">继续选品</button>${demoNote}`:empty('购物袋还是空的','选几款熟悉的风味，开始这一单。')}</div>`;}
  function addressFields(){return `<label class="field">收货人<input name="name" value="${esc(address.name)}" required maxlength="30" autocomplete="name" placeholder="请输入收货人"></label><label class="field">联系电话<input name="phone" type="tel" value="${esc(address.phone)}" required pattern="1[0-9]{10}" maxlength="11" autocomplete="tel" placeholder="11位手机号"></label><label class="field">门店收货地址<textarea name="address" required minlength="5" maxlength="200" autocomplete="street-address" placeholder="省市区、街道及门牌号">${esc(address.address)}</textarea></label>`;}
  function checkout(){if(!cart.length)return `<div class="page-pad">${back('确认订单','cart')}${empty('没有待结算商品','请先添加商品。')}</div>`;return `<div class="page-pad">${back('确认订单','cart')}<form id="checkoutForm"><section class="form-section"><div class="section-top" style="margin-top:0"><h2>配送信息</h2><button type="button" class="text-link" data-action="demoAddress">填入演示地址</button></div><p class="subtext">仅模拟流程，建议使用演示信息。</p>${addressFields()}<label class="field">期望送达日期<input type="date" name="delivery" required min="${new Date(Date.now()+86400000).toISOString().slice(0,10)}"></label><p class="subtext">日期仅用于演示，实际配送范围与时效待确认。</p></section><section class="form-section"><h2>本次订购</h2>${cart.map(l=>cartRow(l,false)).join('')}</section><section class="form-section"><h2>支付方式</h2><div class="radio-row"><label><input type="radio" name="payment" value="微信支付" checked> 微信支付</label><label><input type="radio" name="payment" value="支付宝"> 支付宝</label></div><p class="subtext">不连接支付平台，下一步仅模拟支付成功。</p><label class="field">发票抬头（选填）<input name="invoice" maxlength="80" placeholder="企业名称"></label><label class="field">订单备注（选填）<textarea name="note" maxlength="200" placeholder="如收货时间、门店备注"></textarea></label></section>${summary(cart)}<button type="submit" class="primary">模拟支付 ¥ ${money(amount(cart))}</button>${demoNote}</form></div>`;}
  function orderCard(o){return `<article class="order-card"><div class="order-card-head"><span>${esc(o.date)} · 演示订单</span><span class="status">${statuses[o.status]}</span></div><button data-go="order/${o.id}" style="width:100%;text-align:left"><div class="order-images">${o.items.slice(0,4).map(l=>{const p=product(l.id);return p.image?`<img src="./assets/${p.image}.webp" alt="${p.name}">`:'<div class="material-mini" style="height:57px;width:57px;min-width:57px">Conini</div>';}).join('')}</div><div class="order-card-summary"><span>共 ${count(o.items)} 件商品</span><span>¥ ${money(amount(o.items))}</span></div></button><div class="order-actions"><button class="small-btn" data-go="order/${o.id}">查看详情</button>${o.status==='pay'?`<button class="small-btn wine" data-action="payOrder" data-id="${o.id}">模拟付款</button>`:o.status==='receive'?`<button class="small-btn wine" data-action="receiveOrder" data-id="${o.id}">确认收货</button>`:`<button class="small-btn wine" data-action="reorder" data-id="${o.id}">再次订货</button>`}</div></article>`;}
  function orderList(){const list=orders.filter(o=>orderFilter==='all'||o.status===orderFilter);return `<div class="page-pad" style="padding-bottom:15px"><span class="eyebrow">YOUR ORDERS</span><h1 class="page-title">每一单，都有回应。</h1><p class="subtext">查看采购进度，轻松补充熟悉的风味。</p></div><nav class="order-tabs" aria-label="订单状态">${[['all','全部'],...Object.entries(statuses)].map(([id,n])=>`<button data-order-filter="${id}" class="${orderFilter===id?'active':''}" aria-pressed="${orderFilter===id}">${n}</button>`).join('')}</nav><div class="page-pad" style="padding-top:0">${list.length?list.map(orderCard).join(''):empty('这里还没有订单','新的订购记录会出现在这里。')}<p class="photo-note">本页包含演示历史订单，状态变化仅保存在当前浏览器。</p></div>`;}
  function orderDetail(id){const o=orders.find(x=>x.id===id);if(!o)return `<div class="page-pad">${empty('未找到订单','请返回订单列表。','查看订单','orders')}</div>`;const step={pay:0,ship:1,receive:2,done:3,after:3}[o.status];return `<div class="page-pad">${back('订单详情','orders')}<span class="eyebrow">DEMO ORDER</span><h1 class="page-title">${statuses[o.status]}</h1><p class="subtext">${{pay:'等待模拟付款，商品尚未进入备货。',ship:'付款成功，等待演示备货与发货。',receive:'演示状态：商品已发出，等待签收。',done:'本次演示订单已完成，感谢你的选择。',after:'已记录演示售后申请，未发送给客服。'}[o.status]}</p><div class="timeline">${['下单','付款','发货','完成'].map((n,i)=>`<div class="${i<=step?'done':''}">${n}</div>`).join('')}</div><section class="form-section"><h2>收货信息</h2><p>${esc(o.address?.name||'演示门店')} <span class="subtext">${esc(o.address?.phone||'')}</span></p><p class="subtext">${esc(o.address?.address||'演示收货地址')}</p>${o.delivery?`<p class="subtext">期望送达：${esc(o.delivery)}</p>`:''}</section>${o.items.map(l=>cartRow(l,false)).join('')}${summary(o.items)}<p class="order-number">订单编号：${esc(o.id)}<br>创建日期：${esc(o.date)}${o.note?`<br>备注：${esc(o.note)}`:''}${o.invoice?`<br>发票抬头：${esc(o.invoice)}（演示，未开票）`:''}</p><div class="action-gap">${o.status==='pay'?`<button class="primary" data-action="payOrder" data-id="${o.id}">模拟支付 ¥ ${money(amount(o.items))}</button>`:o.status==='receive'?`<button class="primary" data-action="receiveOrder" data-id="${o.id}">确认收货（演示）</button>`:`<button class="primary" data-action="reorder" data-id="${o.id}">再次订货</button>`}${['ship','receive','done'].includes(o.status)?`<button class="text-link" data-action="afterOrder" data-id="${o.id}">申请售后（演示）</button>`:''}</div>${demoNote}</div>`;}
  function success(id){const o=orders.find(x=>x.id===id);return `<div class="page-pad"><div class="success">${icon('check')}<span class="eyebrow" style="display:block;margin-bottom:10px">ORDER RECEIVED</span><h1>好风味，已安排。</h1><p>模拟支付成功 · 未产生实际扣款<br>订单已保存到当前浏览器。</p></div>${o?summary(o.items):''}<button class="primary" data-go="order/${esc(id)}">查看订单</button><button class="secondary action-gap" data-go="home">返回首页</button>${demoNote}</div>`;}
  function profilePage(){return `<div class="page-pad"><span class="eyebrow">YOUR CONINI</span><div class="profile-card"><span class="profile-brand"><img src="./assets/brand-logo.svg" alt="CONINI" width="41" height="50"></span><div><h1>${esc(profile.name)}</h1><p class="subtext">${esc(profile.type)} · 演示账号</p></div></div>${W.overview()}<div class="profile-stats">${[['pay','待付款'],['ship','待发货'],['receive','待收货']].map(([id,n])=>`<button data-profile-filter="${id}"><b>${orders.filter(o=>o.status===id).length}</b>${n}</button>`).join('')}</div><div class="menu-list">${[['business','企业与门店资料','building'],['address','收货地址','pin'],['invoice','发票信息','order'],['factory','走进 CONINI 工厂','box'],['support','联系与合作','chat'],['welcome','重看品牌欢迎页','home']].map(([id,n,ic])=>`<button class="menu-row" data-action="${id}"><span>${icon(ic)}${n}</span>${icon('chevron')}</button>`).join('')}</div><p class="company-footer"><img class="footer-wordmark" src="./assets/conini-wordmark.svg" alt="CONINI" width="112" height="25"><br>秉承传统，坚持手作。<br>${CONINI.company}<br><small>交互原型 · 不接收真实交易</small></p></div>`;}
  function factory(){return `<div class="page-pad factory-page">${back('走进 CONINI','profile')}<span class="eyebrow">BEHIND EVERY SCOOP</span><h1 class="page-title">看得见的工厂，<br>尝得到的用心。</h1><p class="editorial-copy">秉承传统，坚持手作。<br>从生产空间到出品细节，了解 CONINI 背后的日常。</p><img src="./assets/factory-01.webp" alt="工厂生产空间实拍"><p class="factory-caption">01 / 工厂空间 · 实地拍摄</p><div class="section-top"><h2>让细节说话</h2><span class="eyebrow">OUR WORKPLACE</span></div><div class="factory-grid"><figure><img src="./assets/factory-02.webp" alt="工厂设备实拍" loading="lazy"><figcaption>02 / 生产现场</figcaption></figure><figure><img src="./assets/factory-03.webp" alt="工厂内部实拍" loading="lazy"><figcaption>03 / 空间细节</figcaption></figure></div><img src="./assets/factory-04.webp" alt="工厂现场照片" loading="lazy"><p class="factory-caption">04 / 真实现场记录</p><div class="section-top"><h2>与你，一起分享好风味</h2></div><p class="editorial-copy">冰淇淋门店、咖啡与甜品店、餐厅酒店、区域经销商。<br>为不同经营场景，探索适合的风味与出品方式。</p><button class="primary" data-go="select">探索全部口味 ${icon('arrow')}</button><button class="text-link" data-action="support">咨询合作</button><p class="notice">照片来源于你提供的工厂实拍。合作伙伴名单、资质与产能数据尚未提供，本原型不作虚构展示。</p><p class="company-footer">${CONINI.company}</p></div>`;}
  function render(){
    releaseShowcase();
    releaseFlavors();
    const [page,id]=route().split('/');
    if(page==='welcome'){history.replaceState(null,'','#home');render();openWelcome();return;}
    if(page==='materials'){history.replaceState(null,'','#home');render();return;}
    if(page==='select-reset'){category='all';filter='all';query='';go('select');return;}
    const pages={home,select:catalog,cart:cartPage,checkout,orders:orderList,profile:profilePage,recharge:W.rechargePage,'recharge-records':W.recordsPage,'recharge-success':()=>W.successPage(id),factory,product:()=>detail(id),order:()=>orderDetail(id),success:()=>success(id)};
    $('#main').innerHTML=(pages[page]||home)();header();
    releaseShowcase = ConiniShowcase.mount($('#homeShowcase'));
    releaseFlavors = ConiniFlavors.mount($('#flavorCollection'));
    document.title=`${{home:'首页',select:'下单',cart:'购物袋',checkout:'确认订单',orders:'我的订单',profile:'我的',recharge:'账户充值','recharge-records':'充值记录','recharge-success':'充值结果',factory:'工厂实力',product:'商品详情',order:'订单详情',success:'订购成功'}[page]||'首页'} · CONINI`;
  }
  function mergeLine(line){const existing=cart.find(l=>O.key(l)===O.key(line));if(existing)existing.qty+=line.qty;else cart.push({...line});}
  function add(id,qty=1){
    const p=product(id);if(!p||!Number.isInteger(qty)||qty<1||qty>99)return false;
    if(!selectedContainer){toast('请先选择容器型号与深度');go('select');return false;}
    const line={...O.offer(p,selectedContainer),qty}, existing=cart.find(l=>O.key(l)===O.key(line));
    if((existing?.qty||0)+qty>99){toast('同一口味与规格最多 99 份');return false;}
    mergeLine(line);persistCart();header();refreshControls();toast(`${p.name} 已加入购物袋`);return true;
  }
  function setQuantity(key,qty){
    const l=cart.find(l=>O.key(l)===key);if(!l)return;
    if(!Number.isInteger(qty)||qty<0||qty>99){toast('数量请输入 0–99 的整数，0 表示移除');return;}
    const active=document.activeElement, direction=active.dataset?.qty, editing=active.hasAttribute?.('data-quantity');
    if(qty===0)cart=cart.filter(x=>O.key(x)!==key);else l.qty=qty;
    persistCart();header();
    if(['cart','checkout'].includes(route().split('/')[0])){
      render();const wrapper=[...document.querySelectorAll('[data-control-key]')].find(el=>el.dataset.controlKey===key);
      (wrapper?.querySelector(editing?'input':`button[data-qty="${direction}"]:not(:disabled),input`)||$('#main')).focus({preventScroll:true});
    }else refreshControls();
    if(qty===0)toast('已移除这份口味');
  }
  function reorderPreview(id){
    const o=orders.find(x=>x.id===id);if(!o)return;
    pendingReorder=id;
    if(!selectedContainer){go('select');toast('先选容器，再确认复购规格');return;}
    const hasLegacy=o.items.some(O.legacy);
    modal('确认复购规格',`<p>${hasLegacy?'旧订单含历史盒装规格。这些口味将按当前容器重新计价，份数不变；净含量可能不同。原订单不会修改。':'保留原订单各口味的容器与深度，按当前演示价格重新加入。'}</p><div class="reorder-lines">${o.items.map(l=>{const next=O.offer(product(l.id),l.containerId?l:selectedContainer);return `<div><strong>${product(l.id).name} × ${l.qty}</strong><p class="subtext">${O.legacy(l)?`${esc(l.spec)} → `:''}${O.label(next)} · ${next.spec}</p><p>¥ ${money(next.unitPrice)} / ${next.unit}</p></div>`;}).join('')}</div><button class="primary" data-action="confirmReorder" data-id="${esc(id)}">确认规格，加入购物袋</button><button class="text-link" data-action="closeModal">取消复购</button>`);
  }
  function modal(title,body){$('#modal').innerHTML=`<div class="sheet-head"><h2 id="modalTitle">${title}</h2><button class="icon-btn" data-action="closeModal" aria-label="关闭">${icon('close')}</button></div>${body}`;$('#modal').showModal();}
  function openWelcome(){ConiniWelcome.open();}
  function closeWelcome(){ConiniWelcome.close();}
  const actions={
    closeWelcome,enterWelcome:()=>ConiniWelcome.enter(),closeModal:()=>{pendingReorder=null;$('#modal').close();},welcome:openWelcome,
    clearSearch:()=>{query='';if($('#searchInput'))$('#searchInput').value='';updateCatalog();$('#searchInput')?.focus();},
    changeContainer:()=>{pickerDraft={...selectedContainer};modal('更换容器',`<div id="containerPicker">${pickerContents()}</div><button class="text-link" data-action="closeModal">取消更换</button>`);},
    confirmContainer:()=>{
      if(!O.selectionValid(pickerDraft))return;
      selectedContainer={...pickerDraft};save('conini-container-v1',selectedContainer);
      if($('#modal').open)$('#modal').close();
      render();if(pendingReorder)reorderPreview(pendingReorder);else {$('#main').focus({preventScroll:true});toast('容器已确认，已选商品不变');}
    },
    reorder:el=>reorderPreview(el.dataset.id),
    confirmReorder:el=>{
      const o=orders.find(x=>x.id===el.dataset.id);if(!o||!selectedContainer)return;
      const lines=o.items.map(l=>({...O.offer(product(l.id),l.containerId?l:selectedContainer),qty:l.qty}));
      const totals=new Map(cart.map(l=>[O.key(l),l.qty]));
      for(const l of lines)totals.set(O.key(l),(totals.get(O.key(l))||0)+l.qty);
      if([...totals.values()].some(q=>q>99)){toast('合并后超过 99 份，请先调整购物袋数量');return;}
      lines.forEach(mergeLine);persistCart();pendingReorder=null;$('#modal').close();go('cart');toast('已按确认的规格加入购物袋');
    },
    demoAddress:()=>{const form=$('#checkoutForm')||$('#addressForm');if(!form)return;form.elements.name.value='演示收货人';form.elements.phone.value='13800000000';form.elements.address.value='北京市朝阳区 · CONINI 演示门店（非真实地址）';if(form.elements.delivery)form.elements.delivery.value=new Date(Date.now()+3*86400000).toISOString().slice(0,10);},
    payOrder:el=>{const o=orders.find(x=>x.id===el.dataset.id);if(!o||o.status!=='pay')return;modal('模拟支付',`<p>订单金额 ¥ ${money(amount(o.items))}。这是演示操作，不会实际扣款。</p><button class="primary action-gap" data-action="confirmPay" data-id="${o.id}">确认模拟支付</button>`);},
    confirmPay:el=>{const o=orders.find(x=>x.id===el.dataset.id);if(!o||o.status!=='pay')return;o.status='ship';persistOrders();$('#modal').close();go('success/'+o.id);},
    receiveOrder:el=>modal('确认收货',`<p>确认后，该演示订单将变为“已完成”。</p><button class="primary action-gap" data-action="confirmReceive" data-id="${el.dataset.id}">确认已收货（演示）</button>`),
    confirmReceive:el=>{const o=orders.find(x=>x.id===el.dataset.id);if(!o||o.status!=='receive')return;o.status='done';persistOrders();$('#modal').close();render();toast('演示订单已完成');},
    afterOrder:el=>modal('申请售后',`<form id="afterForm" data-id="${el.dataset.id}"><p>仅保存演示申请，不会通知客服。</p><label class="field">售后原因<select name="reason"><option>商品质量问题</option><option>数量或口味不符</option><option>配送问题</option><option>其他问题</option></select></label><label class="field">补充说明<textarea name="details" maxlength="200" required placeholder="请描述问题"></textarea></label><button class="primary" type="submit">提交演示申请</button></form>`),
    business:()=>modal('企业与门店资料',`<form id="businessForm"><p>信息仅保存在当前浏览器，不进行企业认证。</p><label class="field">门店名称<input name="name" required maxlength="30" value="${esc(profile.name)}"></label><label class="field">门店类型<select name="type">${['冰淇淋门店','咖啡与甜品店','餐厅酒店','区域经销商'].map(n=>`<option ${n===profile.type?'selected':''}>${n}</option>`).join('')}</select></label><button class="primary" type="submit">保存资料</button></form>`),
    address:()=>modal('收货地址',`<form id="addressForm"><p>建议使用演示地址，信息仅保存在当前浏览器。</p><button type="button" class="text-link" data-action="demoAddress">填入演示地址</button>${addressFields()}<button class="primary" type="submit">保存地址</button></form>`),
    invoice:()=>{const inv=read('conini-invoice-v3',{});modal('发票信息',`<form id="invoiceForm"><p>仅保存演示抬头，不会实际开票。</p><label class="field">企业抬头<input name="title" required maxlength="80" value="${esc(inv?.title||'')}" placeholder="企业名称"></label><label class="field">税号<input name="tax" required pattern="[A-Za-z0-9]{15,20}" maxlength="20" value="${esc(inv?.tax||'')}" placeholder="15–20位数字或字母"></label><button class="primary" type="submit">保存发票信息</button></form>`);},
    factory:()=>go('factory'),
    support:()=>modal('联系与合作',`<p>${CONINI.company}</p><p style="margin-top:15px">正式客服电话、企业微信与合作联系方式待补充。本演示暂不提供即时客服或对外提交。</p><button class="secondary action-gap" data-action="closeModal">我知道了</button>`)
  };
  document.addEventListener('click',event=>{
    const el=event.target.closest('button,a');if(!el)return;
    if(el.dataset.go){go(el.dataset.go);return;}
    if(el.dataset.add){add(el.dataset.add);return;}
    if(el.dataset.container){pickerDraft={containerId:el.dataset.container,depth:null};refreshPicker(`[data-container="${el.dataset.container}"]`);return;}
    if(el.dataset.depth){const depth=Number(el.dataset.depth);if(O.model(pickerDraft.containerId)?.depths.includes(depth)){pickerDraft.depth=depth;refreshPicker(`[data-depth="${depth}"]`);}return;}
    if(el.dataset.category){category=el.dataset.category;query='';filter='all';if($('#searchInput'))$('#searchInput').value='';updateCatalog();window.scrollTo({top:0,behavior:'instant'});return;}
    if(el.dataset.filter){filter=el.dataset.filter;updateCatalog();return;}
    if(el.dataset.orderFilter){orderFilter=el.dataset.orderFilter;render();return;}
    if(el.dataset.profileFilter){orderFilter=el.dataset.profileFilter;go('orders');return;}
    if(el.dataset.qty){const l=cart.find(l=>O.key(l)===el.dataset.key);if(l)setQuantity(el.dataset.key,l.qty+Number(el.dataset.qty));return;}
    if(el.dataset.remove){setQuantity(el.dataset.remove,0);return;}
    if(el.dataset.action&&actions[el.dataset.action])actions[el.dataset.action](el);
  });
  document.addEventListener('input',event=>{if(event.target.id==='searchInput'){query=event.target.value.trim();category='all';updateCatalog();}});
  document.addEventListener('change',event=>{const el=event.target;if(el.dataset.quantity){const l=cart.find(l=>O.key(l)===el.dataset.quantity);if(!l)return;const q=Number(el.value);if(el.value.trim()===''||!Number.isInteger(q)||q<0||q>99){el.value=l.qty;toast('数量请输入 0–99 的整数，0 表示移除');return;}setQuantity(el.dataset.quantity,q);}});
  document.addEventListener('submit',event=>{
    const form=event.target;if(!['checkoutForm','businessForm','addressForm','invoiceForm','afterForm'].includes(form.id))return;
    event.preventDefault();if(!form.reportValidity())return;const data=Object.fromEntries(new FormData(form));
    if(form.id==='checkoutForm'){
      if(!cart.length)return;form.querySelector('[type=submit]').disabled=true;
      const now=new Date();address={name:data.name,phone:data.phone,address:data.address};save('conini-address-v3',address);
      const o={id:'DEMO-'+now.getTime(),date:now.toLocaleDateString('sv-SE'),status:'ship',items:cart.map(l=>({...l})),address:{...address},delivery:data.delivery,note:data.note,invoice:data.invoice,payment:data.payment};
      orders.unshift(o);persistOrders();cart=[];persistCart();go('success/'+o.id);return;
    }
    if(form.id==='businessForm'){profile={name:data.name.trim(),type:data.type};save('conini-profile-v3',profile);}
    if(form.id==='addressForm'){address=data;save('conini-address-v3',address);}
    if(form.id==='invoiceForm')save('conini-invoice-v3',data);
    if(form.id==='afterForm'){const o=orders.find(o=>o.id===form.dataset.id);if(o){o.status='after';o.after={reason:data.reason,details:data.details};persistOrders();}}
    $('#modal').close();render();toast(form.id==='afterForm'?'售后申请已保存，仅用于演示':'已保存到当前浏览器');
  });
  $('#modal').addEventListener('cancel',()=>{pendingReorder=null;});
  $('#modal').addEventListener('click',event=>{if(event.target===$('#modal')){const r=$('#modal').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom){pendingReorder=null;$('#modal').close();}}});
  window.addEventListener('hashchange',()=>{if(route()!=='select')pendingReorder=null;if($('#modal').open)$('#modal').close();if($('#welcome').open)closeWelcome();render();window.scrollTo(0,0);if(!$('#welcome').open)$('#main').focus({preventScroll:true});});
  ConiniWelcome.configure({onDismiss:()=>save('conini-welcome-v3',true),onEnter:()=>{go('home');window.scrollTo(0,0);$('#main').focus({preventScroll:true});}});
  W.configure({icon,back,go,render,modal});
  render();
  if(cartRepriced){persistCart();toast('购物袋已更新为 3500g / 盆、280元 / 盆，数量和容器不变');}
  if(!read('conini-welcome-v3',false))openWelcome();
  // Optional WebMCP tools share the exact UI data and validation paths.
  if(navigator.modelContext?.registerTool){
    navigator.modelContext.registerTool({name:'conini_list_products',description:'List demo products for the container explicitly chosen in the UI. Weights, prices and ingredient drafts require factory confirmation.',inputSchema:{type:'object',properties:{query:{type:'string'}},additionalProperties:false},execute:async ({query:q=''})=>({content:[{type:'text',text:JSON.stringify({demo:true,selectedContainer,products:CONINI.products.filter(p=>`${p.name} ${p.en}`.toLowerCase().includes(q.toLowerCase())).map(p=>({id:p.id,name:p.name,offer:selectedContainer?O.offer(p,selectedContainer):null}))})}]})});
    navigator.modelContext.registerTool({name:'conini_add_to_demo_cart',description:'Add to the local demo bag using a container already confirmed in the UI. No real order or charge.',inputSchema:{type:'object',properties:{id:{type:'string'},containerId:{type:'string'},depth:{type:'integer'},quantity:{type:'integer',minimum:1,maximum:99}},required:['id','containerId','depth','quantity'],additionalProperties:false},execute:async ({id,containerId,depth,quantity})=>{if(!CONINI.products.some(p=>p.id===id)||!selectedContainer||containerId!==selectedContainer.containerId||depth!==selectedContainer.depth||!add(id,quantity))return{isError:true,content:[{type:'text',text:'Choose a valid container in the UI first. Product, container, depth and quantity must match.'}]};if(['cart','checkout'].includes(route()))render();return{content:[{type:'text',text:JSON.stringify({demo:true,items:cart,total:amount(cart)})}]};}});
  }
})();
