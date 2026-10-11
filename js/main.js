/* Лендинг «Драконы»: плеер, цели метрики (заглушка до вставки счётчика),
   скролл-отметки. Без внешних зависимостей. */
(function () {
  'use strict';

  /* --- Цели Метрики: после вставки счётчика раскомментировать
         window.yaCounterXXXXXX.reachGoal(goal);
     Пока — складываем в dataLayer, чтобы ничего не потерять. --- */
  window.dataLayer = window.dataLayer || [];
  function sendGoal(goal) {
    window.dataLayer.push({ event: 'landing_goal', goal: goal, ts: Date.now() });
    // window.yaCounterXXXXXX.reachGoal(goal);
  }

  /* Кнопки с data-goal */
  document.querySelectorAll('[data-goal]').forEach(function (el) {
    el.addEventListener('click', function () { sendGoal(el.getAttribute('data-goal')); });
  });

  /* UTM-заглушка: реальные ссылки получат UTM из рекламных кабинетов;
     здесь — только проверка, что параметр долетел до страницы. */
  var utm = new URLSearchParams(location.search).get('utm_campaign');
  if (utm) { window.dataLayer.push({ event: 'utm_seen', campaign: utm }); }

  /* Скролл-отметки 50/75 */
  var marks = { 50: false, 75: false };
  function onScroll() {
    var h = document.documentElement;
    var p = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    [50, 75].forEach(function (m) {
      if (!marks[m] && p >= m) { marks[m] = true; sendGoal('scroll_' + m); }
    });
  }
  document.addEventListener('scroll', onScroll, { passive: true });

  /* VK Видео: до осознанного клика загружается только локальный poster.
     После клика фасад заменяется штатным VK iframe с autoplay.
     Если VK или браузер не разрешит старт, под плеером остаётся прямая ссылка. */
  var videoFacade = document.getElementById('video-facade');
  var videoPlay = document.getElementById('video-play');
  var videoStatus = document.getElementById('video-status');
  if (videoFacade && videoPlay) {
    videoPlay.addEventListener('click', function () {
      if (videoFacade.getAttribute('data-loaded') === '1') return;

      var iframe = document.createElement('iframe');
      iframe.src = videoFacade.getAttribute('data-video');
      iframe.title = 'Фрагмент песни «Баллада о Кровнице»';
      iframe.loading = 'eager';
      iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');

      if (videoStatus) videoStatus.textContent = 'Загружаем плеер VK…';
      iframe.addEventListener('load', function () {
        if (videoStatus) {
          videoStatus.textContent = 'Если VK показал проверку, нажмите «Продолжить». Если ролик не начался — нажмите ▶ в центре плеера.';
        }
      });
      iframe.addEventListener('error', function () {
        if (videoStatus) {
          videoStatus.textContent = 'Плеер не загрузился. Откройте ролик по ссылке ниже.';
        }
      });

      videoFacade.setAttribute('data-loaded', '1');
      videoFacade.replaceChildren(iframe);
      sendGoal('video_start');
    });
  }

  /* Читалка фрагмента: шрифт, темы, запоминание, цели */
  var reader = document.getElementById('reader');
  var rBody = document.getElementById('reader-body');
  if (reader && rBody) {
    var st = { rfs: 18, theme: 'sepia' };
    try {
      var saved = JSON.parse(localStorage.getItem('dragons_reader') || 'null');
      if (saved && saved.rfs && saved.theme) st = saved;
    } catch (e) {}
    function rApply() {
      reader.setAttribute('data-theme', st.theme);
      rBody.style.setProperty('--rfs', st.rfs + 'px');
      try { localStorage.setItem('dragons_reader', JSON.stringify(st)); } catch (e) {}
    }
    rApply();
    document.getElementById('open-reader').addEventListener('click', function () {
      reader.hidden = false;
      document.body.style.overflow = 'hidden';
      sendGoal('reader_open');
    });
    function rClose() { reader.hidden = true; document.body.style.overflow = ''; }
    document.getElementById('r-close').addEventListener('click', rClose);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !reader.hidden) rClose();
    });
    document.getElementById('r-font-up').addEventListener('click', function () {
      st.rfs = Math.min(26, st.rfs + 2); rApply(); sendGoal('reader_font');
    });
    document.getElementById('r-font-down').addEventListener('click', function () {
      st.rfs = Math.max(14, st.rfs - 2); rApply(); sendGoal('reader_font');
    });
    ['sepia', 'white', 'dark'].forEach(function (t) {
      document.getElementById('r-theme-' + t).addEventListener('click', function () {
        st.theme = t; rApply(); sendGoal('reader_theme');
      });
    });
    var cliff = document.getElementById('cliff');
    if (cliff && 'IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { sendGoal('reader_cliff'); cio.disconnect(); }
        });
      }, { root: rBody, threshold: 0.5 });
      cio.observe(cliff);
    }
  }

  /* Лайтбокс карты: крупная версия грузится только по клику */
  var mapImg = document.getElementById('map-img');
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lightbox-img');
  if (mapImg && lb && lbImg) {
    function closeLb() { lb.hidden = true; document.body.style.overflow = ''; }
    mapImg.addEventListener('click', function () {
      lb.hidden = false;
      document.body.style.overflow = 'hidden';
      if (lbImg.getAttribute('src').indexOf('map_big') === -1) {
        lbImg.src = 'assets/map_big.jpg?v=1';
      }
      sendGoal('map_zoom');
    });
    lb.addEventListener('click', closeLb);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !lb.hidden) closeLb();
    });
  }
})();
