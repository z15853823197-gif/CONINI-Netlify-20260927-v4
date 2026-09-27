/* Welcome motion and navigation adapter for the user's approved variant 2. */
(() => {
  'use strict';
  let dialog, stage, entry, options, leaving=false, exitTimer=null, previousFocus=null;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function reset() {
    clearTimeout(exitTimer);exitTimer=null;leaving=false;
    stage.classList.remove('is-playing','is-exiting');
    entry.disabled=false;
  }
  function play() {
    if(!dialog.open||leaving)return;
    stage.classList.remove('is-playing','is-exiting');
    void stage.offsetWidth;
    stage.classList.add('is-playing');
  }
  function open() {
    if(dialog.open)return;
    previousFocus=document.activeElement;
    reset();dialog.showModal();dialog.focus({preventScroll:true});dialog.scrollTop=0;play();
  }
  function close() {
    if(!dialog.open)return;
    reset();options.onDismiss();dialog.close();
    if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
  }
  function finish() {
    if(!leaving||!dialog.open)return;
    close();options.onEnter();
  }
  function enter() {
    if(leaving||!dialog.open)return;
    leaving=true;entry.disabled=true;
    stage.classList.remove('is-playing');stage.classList.add('is-exiting');
    if(reduced.matches)finish();else exitTimer=setTimeout(finish,920);
  }
  function configure(config) {
    options=config;dialog=document.getElementById('welcome');stage=dialog.querySelector('.wm-stage');
    entry=dialog.querySelector('.wm-brand-entry');
    entry.addEventListener('click',enter);
    dialog.querySelector('.wm-close').addEventListener('click',close);
    dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
    // A stale native close event must not stop an immediately reopened animation.
    dialog.addEventListener('close',()=>{if(!dialog.open)reset();});
    reduced.addEventListener('change',()=>{if(leaving&&reduced.matches)finish();});
  }
  window.ConiniWelcome={configure,open,close,enter};
})();
