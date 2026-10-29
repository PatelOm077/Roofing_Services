(function () {
  'use strict';
  var PHONE = '(817) 555-0142';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function r50(n) { return Math.round(n / 50) * 50; }
  function find(list, id) { for (var i = 0; i < list.length; i++) { if (list[i].id === id) return list[i]; } return null; }
  function sendForm(name, data) {
    data['form-name'] = name;
    var body = Object.keys(data).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]); }).join('&');
    try { fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body }).catch(function () {}); } catch (e) {}
  }

  /* ---------- mobile menu ---------- */
  function initMenu() {
    var btn = $('#menu-btn'), nav = $('#mnav');
    if (!btn || !nav) return;
    function set(open) {
      nav.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    btn.addEventListener('click', function () { set(!nav.classList.contains('open')); });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  }

  /* ---------- scroll reveal + count-ups ---------- */
  function initReveal() {
    var els = $$('.rv');
    var counts = $$('[data-count]');
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('in'); });
      return;
    }
    // only hide sections once this script is actually running, so a stale or failed script can never leave the page blank
    document.documentElement.classList.add('rv-on');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        co.unobserve(en.target);
        var el = en.target, to = +el.getAttribute('data-count'), t0 = null;
        function tick(t) {
          if (!t0) t0 = t;
          var p = Math.min((t - t0) / 1200, 1);
          el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        }
        el.textContent = '0';
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    counts.forEach(function (e) { co.observe(e); });
  }

  /* ---------- quote page: estimate + call back in one flow ---------- */
  function initQuote() {
    var body = $('#q-body');
    if (!body) return;
    var listEl = $('#q-list'), stepNum = $('#q-stepnum'), bar = $('#q-bar'), card = $('#q-card'), prog = $('#q-prog');
    // always open the quote at the top, with the first question in view
    try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
    function toTop() { window.scrollTo(0, 0); }
    toTop(); setTimeout(toTop, 60); window.addEventListener('load', toTop);
    var SERVICES = [
      { id: 'repair', label: 'Roof repair or leak', lo: 250, hi: 650, scale: 0.3 },
      { id: 'storm', label: 'Storm or hail damage', lo: 1500, hi: 4000, scale: 1 },
      { id: 'replace', label: 'New roof', lo: 6500, hi: 9500, scale: 1 },
      { id: 'hvac', label: 'AC or heating', lo: 120, hi: 450, scale: 0.15 },
      { id: 'other', label: 'Something else' }
    ];
    var SIZES = [
      { id: 's', label: 'Small', sub: 'Under 1,500 sq ft', m: 0.8 },
      { id: 'm', label: 'Medium', sub: '1,500 – 2,500 sq ft', m: 1 },
      { id: 'l', label: 'Large', sub: '2,500+ sq ft', m: 1.3 }
    ];
    var URGENCY = [
      { id: 'now', label: 'Emergency, today' },
      { id: 'week', label: 'This week' },
      { id: 'price', label: 'Just checking prices' }
    ];
    var TIMES = [
      { id: 'now', label: 'Right now', when: 'in the next few minutes' },
      { id: 'today', label: 'Later today', when: 'later today' },
      { id: 'tomorrow', label: 'Tomorrow', when: 'tomorrow' }
    ];
    var LABELS = { service: 'What you need', size: 'Home size', urgency: 'How soon', price: 'Your estimate', time: 'Call time', name: 'Your name', phone: 'Your mobile' };
    var s = { i: 0, service: null, size: null, urgency: null, time: null, name: '', phone: '', err: '', done: false };

    var pre = (location.search.match(/[?&]s=([a-z]+)/) || [])[1];
    if (pre === 'ac' || pre === 'heat' || pre === 'system') pre = 'hvac';
    if (pre && find(SERVICES, pre)) { s.service = pre; s.i = 1; }

    function order() { return s.service === 'other' ? ['service', 'urgency', 'time', 'name', 'phone'] : ['service', 'size', 'urgency', 'price', 'time', 'name', 'phone']; }
    function calc() {
      var svc = find(SERVICES, s.service);
      if (!svc || svc.id === 'other') return null;
      var size = find(SIZES, s.size) || SIZES[1];
      var mult = 1 + (size.m - 1) * svc.scale;
      return { lo: r50(svc.lo * mult), hi: r50(svc.hi * mult), svc: svc, size: size };
    }
    function opts(list, sel) {
      return '<div class="opts">' + list.map(function (o, i) {
        return '<button type="button" class="opt' + (o.id === sel ? ' sel' : '') + '" data-i="' + i + '"><span class="ol">' + esc(o.label) + '</span>' +
          (o.sub ? '<span class="os">' + esc(o.sub) + '</span>' : '') + '</button>';
      }).join('') + '</div>';
    }
    function q(t, sub) { return '<div><h2 class="wq">' + esc(t) + '</h2>' + (sub ? '<p class="wsub">' + esc(sub) + '</p>' : '') + '</div>'; }
    function field(id, label, type, ac, ph, val) {
      return '<label class="wfield" for="' + id + '">' + esc(label) + '<input id="' + id + '" type="' + type + '" autocomplete="' + ac + '" placeholder="' + esc(ph) + '" value="' + esc(val) + '"></label>';
    }
    function go(i) { s.i = i; s.err = ''; render(true); }
    function next() { if (s.i + 1 >= order().length) { s.done = true; render(true); } else go(s.i + 1); }

    function render(move) {
      var ord = order(), n = ord.length, key = ord[s.i];
      if (listEl) {
        listEl.innerHTML = ord.map(function (k, i) {
          var st = s.done || s.i > i ? 'done' : (s.i === i ? 'cur' : '');
          return '<li class="' + st + '"><span class="mk" aria-hidden="true">' + (st === 'done' ? '✓' : '') + '</span><span>' + LABELS[k] + '</span></li>';
        }).join('');
      }
      if (prog) prog.style.display = s.done ? 'none' : '';
      if (stepNum) stepNum.textContent = 'Step ' + (s.i + 1) + ' of ' + n;
      if (bar) bar.style.width = Math.round(s.i / n * 100) + '%';
      var c = calc(), h = '';
      var svc = find(SERVICES, s.service), urg = find(URGENCY, s.urgency), time = find(TIMES, s.time);

      if (s.done) {
        var first = s.name.trim().split(' ')[0];
        h = '<div class="wdone"><div class="wtick" aria-hidden="true"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg></div>' +
          '<h2>' + esc(first ? "You're booked in, " + first + '.' : "You're booked in.") + '</h2>' +
          '<p>Erik will call ' + esc(s.phone) + ' ' + esc(time ? time.when : 'soon') + '.' + (c ? ' Ballpark: ' + money(c.lo) + ' – ' + money(c.hi) + '.' : '') + '</p>' +
          '<div class="wtags">' + [svc && svc.label, c && c.size.label, urg && urg.label, time && 'Call: ' + time.label].filter(Boolean).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' +
          '<span class="sig">— Erik</span>' +
          '<a class="btn btn-line" href="index.html" style="align-self:flex-start">Back to home</a></div>' +
          '<button type="button" class="wlink" data-act="restart">↺ Start a new quote</button>';
      } else if (key === 'service') {
        h = '<div class="wstep">' + q('What do you need?') + opts(SERVICES, s.service) + '</div>';
      } else if (key === 'size') {
        h = '<div class="wstep">' + q('How big is the home?') + opts(SIZES, s.size) + '</div>';
      } else if (key === 'urgency') {
        h = '<div class="wstep">' + q('How soon?') + opts(URGENCY, s.urgency) + '</div>';
      } else if (key === 'price') {
        var note = s.urgency === 'now'
          ? 'Emergency crew can be out today.'
          : (s.service === 'storm' ? 'Often covered by insurance. We meet your adjuster free.' : 'Final price confirmed after a free inspection.');
        h = '<div class="wstep"><span class="eyebrow" style="color:var(--muted)">Your ballpark</span><div class="wprice">' + money(c.lo) + ' – ' + money(c.hi) + '</div>' +
          '<p class="wsub" style="margin:0">' + esc(c.svc.label + ' · ' + c.size.label.toLowerCase() + ' home') + '</p>' +
          '<div class="wnote"><b aria-hidden="true">!</b><span>' + esc(note) + '</span></div>' +
          '<button type="button" class="btn btn-acc" data-act="next">Book a free inspection →</button></div>';
      } else if (key === 'time') {
        h = '<div class="wstep">' + q('When should we call?') + opts(TIMES, s.time) + '</div>';
      } else if (key === 'name') {
        h = '<form class="wstep" data-act="name" novalidate>' + q('Your name') + field('q-name', 'Your name', 'text', 'name', 'First name is fine', s.name) +
          (s.err ? '<p class="werr" role="alert">' + esc(s.err) + '</p>' : '') + '<button type="submit" class="btn btn-ink">Continue →</button></form>';
      } else if (key === 'phone') {
        h = '<form class="wstep" data-act="phone" novalidate>' + q('Your mobile number') +
          field('q-phone', 'Mobile', 'tel', 'tel', '(817) 000-0000', s.phone) +
          (s.err ? '<p class="werr" role="alert">' + esc(s.err) + '</p>' : '') + '<button type="submit" class="btn btn-acc">Send my request →</button></form>';
      }
      if (!s.done && s.i > 0) h += '<button type="button" class="wlink" data-act="back">← Back</button>';
      body.innerHTML = h;

      var lists = { service: SERVICES, size: SIZES, urgency: URGENCY, time: TIMES };
      if (!s.done && lists[key]) {
        $$('.opt', body).forEach(function (b) {
          b.addEventListener('click', function () {
            var o = lists[key][+b.getAttribute('data-i')];
            if (key === 'service' && s.service !== o.id) { s.size = null; }
            s[key] = o.id;
            next();
          });
        });
      }
      var nx = $('[data-act="next"]', body); if (nx) nx.addEventListener('click', next);
      var bk = $('[data-act="back"]', body); if (bk) bk.addEventListener('click', function () { go(Math.max(s.i - 1, 0)); });
      var rs = $('[data-act="restart"]', body); if (rs) rs.addEventListener('click', function () { s = { i: 0, service: null, size: null, urgency: null, time: null, name: '', phone: '', err: '', done: false }; render(true); });
      var f = $('form', body);
      if (f) {
        var inp = $('input', f);
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          if (f.getAttribute('data-act') === 'name') {
            s.name = inp.value;
            if (!s.name.trim()) { s.err = 'Just a first name so we know who to ask for.'; render(false); return; }
            next();
          } else {
            s.phone = inp.value;
            if (s.phone.replace(/\D/g, '').length < 7) { s.err = 'Add a number we can call you back on.'; render(false); return; }
            var cc = calc();
            sendForm('quote', {
              service: svc ? svc.label : '', home_size: cc ? cc.size.label : '', urgency: urg ? urg.label : '',
              estimate: cc ? money(cc.lo) + ' – ' + money(cc.hi) : '', call_time: time ? time.label : '',
              name: s.name.trim(), phone: s.phone.trim()
            });
            next();
          }
        });
        if (move && window.matchMedia('(min-width: 700px)').matches) { try { inp.focus({ preventScroll: true }); } catch (e) {} }
      }
      if (move && card) {
        var top = card.getBoundingClientRect().top;
        if (top < 70) window.scrollTo({ top: window.pageYOffset + top - 84, behavior: reduce ? 'auto' : 'smooth' });
      }
    }
    render(false);
  }

  /* ---------- before / after slider ---------- */
  function initSlider() {
    var range = $('#ba-range');
    if (!range) return;
    var before = $('#ba-before'), line = $('#ba-line'), wrap = $('#ba'), touched = false;
    function set(v) { before.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)'; line.style.left = v + '%'; }
    range.addEventListener('input', function () {
      if (!touched) { touched = true; wrap.classList.remove('ba-anim'); }
      set(+range.value);
    });
    if (reduce || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.disconnect();
        wrap.classList.add('ba-anim');
        [[300, 68], [1100, 32], [1900, 50]].forEach(function (p) {
          setTimeout(function () { if (!touched) { range.value = p[1]; set(p[1]); } }, p[0]);
        });
        setTimeout(function () { wrap.classList.remove('ba-anim'); }, 2600);
      });
    }, { threshold: 0.6 });
    io.observe(wrap);
  }

  /* ---------- FAQ ---------- */
  function initFaq() {
    $$('.faqi').forEach(function (item) {
      var btn = $('.faq', item), ans = $('.fa', item);
      btn.addEventListener('click', function () {
        var open = !item.classList.contains('open');
        $$('.faqi.open').forEach(function (o) { o.classList.remove('open'); $('.fa', o).hidden = true; $('.faq', o).setAttribute('aria-expanded', 'false'); });
        if (open) { item.classList.add('open'); ans.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
      });
    });
  }

  /* ---------- office hours: highlight today ---------- */
  function initHours() {
    var dow = String(new Date().getDay());
    $$('.hrs li[data-days]').forEach(function (li) {
      if (li.getAttribute('data-days').split(',').indexOf(dow) !== -1) {
        li.classList.add('today');
        var tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = 'Today';
        li.firstElementChild.appendChild(tag);
      }
    });
  }

  /* ---------- make muted videos play on phones ---------- */
  function initVideos() {
    // hero: vertical video on phones, wide video on bigger screens
    var hv = $('#hero-vid');
    if (hv && !hv.getAttribute('src')) {
      var phone = window.matchMedia('(max-width: 699px)').matches;
      if (phone && hv.getAttribute('data-poster-m')) hv.setAttribute('poster', hv.getAttribute('data-poster-m'));
      hv.src = hv.getAttribute(phone ? 'data-src-m' : 'data-src-d');
    }
    $$('video[autoplay]').forEach(function (v) {
      v.muted = true;
      var p = v.play && v.play();
      if (p && p.catch) p.catch(function () {});
    });
  }

  function start() { initMenu(); initReveal(); initQuote(); initSlider(); initFaq(); initHours(); initVideos(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
