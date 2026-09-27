(() => {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const positions = new Map();
  let selected = 'sorbet';

  function markup(data) {
    const series = (data.homeFlavorSeries || []).map(entry => ({
      ...entry,
      name: data.categories.find(([id]) => id === entry.category)?.[1],
      flavors: data.products.filter(product => product.category === entry.category)
    })).filter(entry => entry.name && entry.flavors.length);
    return `<section id="flavorCollection" class="flavor-collection" aria-labelledby="flavorTitle">
      <div class="section-top"><h2 id="flavorTitle">风味系列</h2><button class="text-link" data-go="select">全部口味 <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></button></div>
      <div class="flavor-series-list">${series.map(entry => {
        const id = escape(entry.category), open = selected === entry.category;
        return `<article class="flavor-series ${open ? 'is-open' : ''}" data-series="${id}">
          <h3><button type="button" id="flavor-trigger-${id}" class="flavor-banner" aria-expanded="${open}" aria-controls="flavor-panel-${id}">
            <img src="./assets/${escape(entry.image)}" alt="" width="1200" height="480" loading="lazy" draggable="false">
            <span class="flavor-banner-copy"><span class="flavor-banner-name">${escape(entry.name)}</span><span class="flavor-banner-meta">${entry.flavors.length} 款口味<svg class="flavor-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></span></span>
          </button></h3>
          <div id="flavor-panel-${id}" class="flavor-panel" role="region" aria-labelledby="flavor-trigger-${id}" aria-hidden="${!open}" ${open ? '' : 'inert'}>
            <div class="flavor-panel-inner"><div class="flavor-slider" data-overflow-left="false" data-overflow-right="false">
              <div class="flavor-track" tabindex="0" role="group" aria-label="${escape(entry.name)}口味画廊，可左右滑动或使用左右方向键">
                ${entry.flavors.map(product => `<figure class="flavor-item"><img src="./assets/${escape(product.image)}.webp" alt="${escape(product.name)}冰淇淋" width="300" height="300" loading="lazy" draggable="false"><figcaption><span class="flavor-name">${escape(product.name)}</span><span class="flavor-english" lang="en">${escape(product.en)}</span></figcaption></figure>`).join('')}
              </div>
            </div></div>
          </div>
        </article>`;
      }).join('')}</div>
    </section>`;
  }

  function mount(root) {
    if (!root) return () => {};
    const controller = new AbortController();
    const listen = (target, event, handler, options = {}) => target.addEventListener(event, handler, {...options, signal:controller.signal});
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const series = [...root.querySelectorAll('.flavor-series')];
    const tracks = [...root.querySelectorAll('.flavor-track')];
    let frame = 0, pendingReveal = null;

    const updateEdges = track => {
      if (!track.clientWidth) return;
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      const offset = Math.max(0, Math.min(max, track.scrollLeft));
      track.parentElement.dataset.overflowLeft = String(offset > 2);
      track.parentElement.dataset.overflowRight = String(max - offset > 2);
      positions.set(track.closest('[data-series]').dataset.series, offset);
    };
    const refresh = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => tracks.forEach(updateEdges));
    };
    const keepHeaderVisible = () => {
      if (!pendingReveal?.isConnected) return;
      const button = pendingReveal;
      pendingReveal = null;
      if (button.getAttribute('aria-expanded') !== 'true') return;
      const top = button.getBoundingClientRect().top;
      if (top < 16) window.scrollBy({top:top - 16, behavior:motion.matches ? 'instant' : 'smooth'});
    };

    listen(root, 'click', event => {
      const button = event.target.closest('.flavor-banner');
      if (!button) return;
      const current = button.closest('[data-series]');
      selected = button.getAttribute('aria-expanded') === 'true' ? null : current.dataset.series;
      pendingReveal = selected ? button : null;
      series.forEach(group => {
        const open = group.dataset.series === selected;
        const panel = group.querySelector('.flavor-panel');
        group.querySelector('.flavor-banner').setAttribute('aria-expanded', String(open));
        panel.setAttribute('aria-hidden', String(!open));
        panel.inert = !open;
        group.classList.toggle('is-open', open);
      });
      refresh();
      if (motion.matches) keepHeaderVisible();
    });
    listen(root, 'transitionend', event => {
      if (event.target.matches('.flavor-panel') && event.propertyName === 'grid-template-rows') {
        refresh();
        keepHeaderVisible();
      }
    });
    const resize = new ResizeObserver(refresh);
    tracks.forEach(track => {
      const category = track.closest('[data-series]').dataset.series;
      track.scrollLeft = positions.get(category) || 0;
      resize.observe(track);
      listen(track, 'scroll', () => updateEdges(track), {passive:true});
      listen(track, 'keydown', event => {
        const step = (track.querySelector('.flavor-item')?.getBoundingClientRect().width || 140) + 14;
        const target = {ArrowLeft:track.scrollLeft - step, ArrowRight:track.scrollLeft + step, Home:0, End:track.scrollWidth}[event.key];
        if (target === undefined) return;
        event.preventDefault();
        track.scrollTo({left:target, behavior:motion.matches ? 'instant' : 'smooth'});
      });

      // Native touch scrolling keeps vertical page scrolling and pinch zoom intact.
      // Pointer dragging is added only for mouse/pen users of the local desktop demo.
      let drag = null;
      listen(track, 'pointerdown', event => {
        if (event.pointerType === 'touch' || !event.isPrimary || event.button !== 0) return;
        drag = {id:event.pointerId, x:event.clientX, offset:track.scrollLeft};
        track.setPointerCapture(event.pointerId);
        track.classList.add('is-dragging');
      });
      listen(track, 'pointermove', event => {
        if (!drag || drag.id !== event.pointerId) return;
        track.scrollLeft = drag.offset + drag.x - event.clientX;
      });
      const stopDrag = event => {
        if (!drag || drag.id !== event.pointerId) return;
        drag = null;
        track.classList.remove('is-dragging');
        if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
        updateEdges(track);
      };
      ['pointerup','pointercancel','lostpointercapture'].forEach(event => listen(track, event, stopDrag));
    });
    refresh();
    return () => {
      tracks.forEach(updateEdges);
      controller.abort();
      resize.disconnect();
      cancelAnimationFrame(frame);
    };
  }
  window.ConiniFlavors = {markup, mount};
})();
