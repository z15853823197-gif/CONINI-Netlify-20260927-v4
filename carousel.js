(() => {
  'use strict';
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function markup(slides) {
    if (!slides?.length) return '';
    const image = (slide, index, clone = false) => `<div class="showcase-slide" ${clone ? 'aria-hidden="true" data-clone' : `role="group" aria-roledescription="幻灯片" aria-label="第 ${index + 1} 张，共 ${slides.length} 张" aria-hidden="${index !== 0}" data-slide="${index}"`}><img src="./assets/${escape(slide.image)}" alt="${clone ? '' : escape(slide.alt)}" width="1200" height="800" draggable="false" ${index === 0 && !clone ? 'fetchpriority="high"' : ''}></div>`;
    return `<section id="homeShowcase" class="showcase" role="region" aria-roledescription="轮播图" aria-label="品牌展示" tabindex="0" data-count="${slides.length}" data-index="0"><div class="showcase-viewport"><div class="showcase-track" aria-live="off">${image(slides.at(-1), slides.length - 1, true)}${slides.map((s,i) => image(s,i)).join('')}${image(slides[0], 0, true)}</div></div>${slides.length > 1 ? `<div class="showcase-pagination" role="group" aria-label="切换展示图片">${slides.map((_,i) => `<button type="button" class="showcase-dot ${i === 0 ? 'active' : ''}" data-slide-to="${i}" aria-label="查看第 ${i + 1} 张展示图片" aria-current="${i === 0 ? 'true' : 'false'}"><span></span></button>`).join('')}</div>` : ''}</section>`;
  }

  function mount(root) {
    if (!root) return () => {};
    const total = Number(root.dataset.count);
    if (total < 2) return () => {};
    const track = root.querySelector('.showcase-track');
    const viewport = root.querySelector('.showcase-viewport');
    const dots = [...root.querySelectorAll('[data-slide-to]')];
    const slides = [...root.querySelectorAll('[data-slide]')];
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const controller = new AbortController();
    const listen = (target, type, handler) => target.addEventListener(type, handler, {signal:controller.signal});
    let index = 0, position = 1, timer = null, hovered = false, focused = false, visible = true, gesture = null;
    const stop = () => { clearTimeout(timer); timer = null; };
    const canPlay = () => root.isConnected && !motion.matches && !hovered && !focused && !gesture && visible && !document.hidden && !document.querySelector('dialog[open]');
    const schedule = () => {
      stop();
      if (canPlay()) timer = setTimeout(() => { show(index + 1); schedule(); }, 5000);
    };
    const move = () => { track.style.transform = `translate3d(${-position * 100}%,0,0)`; };
    const resetLoop = () => {
      if (position !== 0 && position !== total + 1) return;
      track.style.transition = 'none';
      position = index + 1;
      move();
      track.getBoundingClientRect();
      track.style.transition = '';
    };
    const updateControls = () => {
      root.dataset.index = String(index);
      dots.forEach((dot, i) => { dot.classList.toggle('active', i === index); dot.setAttribute('aria-current', String(i === index)); });
      slides.forEach((slide, i) => slide.setAttribute('aria-hidden', String(i !== index)));
      track.setAttribute('aria-live', canPlay() ? 'off' : 'polite');
    };
    function show(next) {
      resetLoop();
      index = (next + total) % total;
      position = next === total ? total + 1 : next === -1 ? 0 : index + 1;
      move();
      updateControls();
      if (motion.matches) resetLoop();
    }
    listen(track, 'transitionend', event => { if (event.propertyName === 'transform') resetLoop(); });
    listen(root, 'click', event => {
      const target = event.target.closest('button');
      if (!target) return;
      if (target.dataset.slideTo !== undefined) show(Number(target.dataset.slideTo));
      schedule();
    });
    listen(root, 'keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      show(index + (event.key === 'ArrowRight' ? 1 : -1));
      schedule();
    });
    listen(root, 'pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; schedule(); } });
    listen(root, 'pointerleave', event => { if (event.pointerType === 'mouse') { hovered = false; schedule(); } });
    listen(root, 'focusin', () => { focused = document.activeElement?.matches(':focus-visible') || false; schedule(); });
    listen(root, 'focusout', event => { focused = !!event.relatedTarget && root.contains(event.relatedTarget); schedule(); });
    listen(viewport, 'pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      gesture = {id:event.pointerId,x:event.clientX,y:event.clientY};
      viewport.setPointerCapture(event.pointerId);
      stop();
    });
    listen(viewport, 'pointermove', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
        track.style.transition = 'none';
        const offset = Math.max(-viewport.clientWidth, Math.min(viewport.clientWidth, dx));
        track.style.transform = `translate3d(calc(${-position * 100}% + ${offset}px),0,0)`;
      }
    });
    const finishGesture = event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
      gesture = null;
      track.style.transition = '';
      if (event.type === 'pointerup' && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) show(index + (dx < 0 ? 1 : -1));
      else { position = index + 1; move(); }
      schedule();
    };
    listen(viewport, 'pointerup', finishGesture);
    listen(viewport, 'pointercancel', finishGesture);
    listen(document, 'visibilitychange', schedule);
    listen(motion, 'change', () => { resetLoop(); updateControls(); schedule(); });
    const dialogs = new MutationObserver(schedule);
    document.querySelectorAll('dialog').forEach(dialog => dialogs.observe(dialog, {attributes:true,attributeFilter:['open']}));
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.25; schedule(); }, {threshold:0.25});
    observer.observe(root);
    updateControls();
    schedule();
    return () => { stop(); controller.abort(); observer.disconnect(); dialogs.disconnect(); };
  }
  window.ConiniShowcase = {markup, mount};
})();
