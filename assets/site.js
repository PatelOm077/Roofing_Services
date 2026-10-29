(function () {
  'use strict';

  var PHONE_DISPLAY = '(817) 555-0142';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function r50(n) { return Math.round(n / 50) * 50; }
  function find(list, id) { for (var i = 0; i < list.length; i++) { if (list[i].id === id) return list[i]; } return null; }
  function encode(d) {
    return Object.keys(d).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(d[k]); }).join('&');
  }
  // Saves the submission in Netlify Forms (shows up under Forms in the Netlify dashboard)
  function sendForm(name, data) {
    data['form-name'] = name;
    try {
      return fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: encode(data) }).catch(function () {});
    } catch (e) { return null; }
  }
  function optsHTML(list, selId) {
    return '<div class="opts">' + list.map(function (o, i) {
      return '<button type="button" class="opt' + (o.id === selId ? ' sel' : '') + '" data-i="' + i + '">' +
        '<span class="ol">' + esc(o.label) + '</span>' + (o.sub ? '<span class="os">' + esc(o.sub) + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  }
  function bindOpts(root, list, fn) {
    root.querySelectorAll('.opt').forEach(function (b) {
      b.addEventListener('click', function () { fn(list[+b.getAttribute('data-i')]); });
    });
  }
  function head(q, sub) {
    return '<div><h3 class="wq">' + esc(q) + '</h3>' + (sub ? '<p class="wsub">' + esc(sub) + '</p>' : '') + '</div>';
  }
  function field(id, label, type, ac, ph, val, mode) {
    return '<label class="wfield" for="' + id + '">' + esc(label) +
      '<input id="' + id + '" type="' + type + '" autocomplete="' + ac + '"' + (mode ? ' inputmode="' + mode + '"' : '') +
      ' placeholder="' + esc(ph) + '" value="' + esc(val) + '"></label>';
  }
  var TICK = '<div class="wtick" aria-hidden="true"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg></div>';

  /* ---------- Home: step-by-step estimate ---------- */
  function initEstimate() {
    var body = document.getElementById('est-body');
    if (!body) return;
    var list = document.querySelectorAll('#est-list li');
    var stepNum = document.getElementById('est-stepnum');
    var bar = document.getElementById('est-bar');

    var SERVICES = [
      { id: 'repair', label: 'Roof repair or leak', sub: 'Drips, stains, missing shingles', lo: 450, hi: 1200, scale: 0.3 },
      { id: 'storm', label: 'Storm or hail damage', sub: 'We meet your insurance adjuster', lo: 2500, hi: 6500, scale: 1 },
      { id: 'replace', label: 'Full roof replacement', sub: 'Tear-off and new roof, usually 1 day', lo: 9500, hi: 14500, scale: 1 },
      { id: 'ac', label: 'AC not cooling', sub: 'Same-day repair, all brands', lo: 180, hi: 650, scale: 0.15 },
      { id: 'heat', label: 'Heating or furnace', sub: 'Furnace and heat pump repair', lo: 160, hi: 600, scale: 0.15 },
      { id: 'system', label: 'New AC or furnace', sub: 'Sized to your home, financing available', lo: 6800, hi: 11500, scale: 0.8 }
    ];
    var SIZES = [
      { id: 's', label: 'Under 1,500 sq ft', sub: 'Smaller ranch or starter home', m: 0.75 },
      { id: 'm', label: '1,500 – 2,500 sq ft', sub: 'Typical single-story', m: 1 },
      { id: 'l', label: '2,500 – 3,500 sq ft', sub: 'Large or two-story', m: 1.3 },
      { id: 'xl', label: '3,500+ sq ft', sub: 'Big custom home', m: 1.6 }
    ];
    var URGENCY = [
      { id: 'now', label: 'Emergency — today', sub: 'Active leak, no AC or no heat' },
      { id: 'week', label: 'This week', sub: 'Something needs fixing soon' },
      { id: 'month', label: 'Within a month', sub: 'Planning ahead' },
      { id: 'price', label: 'Just comparing prices', sub: 'No pressure, honestly' }
    ];
    var s = { step: 0, service: null, size: null, urgency: null, zip: '', name: '', phone: '', err: '' };

    function calc() {
      var svc = find(SERVICES, s.service) || SERVICES[2];
      var size = find(SIZES, s.size) || SIZES[1];
      var urg = find(URGENCY, s.urgency) || URGENCY[1];
      var mult = 1 + (size.m - 1) * svc.scale;
      return { svc: svc, size: size, urg: urg, lo: r50(svc.lo * mult), hi: r50(svc.hi * mult) };
    }
    function go(n) { s.step = n; s.err = ''; render(); }

    function render() {
      list.forEach(function (li, i) {
        li.className = s.step > i ? 'done' : (s.step === i ? 'cur' : '');
        li.querySelector('.mk').textContent = s.step > i ? '✓' : '';
      });
      if (stepNum) stepNum.textContent = 'Step ' + Math.min(s.step + 1, 7) + ' of 7';
      if (bar) bar.style.width = Math.round(Math.min(s.step, 7) / 7 * 100) + '%';
      var c = calc();
      var h = '';
      if (s.step === 0) h = '<div class="wstep">' + head('What do you need help with?', 'Pick the closest one. You can tell us the details on the phone.') + optsHTML(SERVICES, s.service) + '</div>';
      else if (s.step === 1) h = '<div class="wstep">' + head('How big is the home?', "A rough guess is fine. It's on your appraisal or Zillow.") + optsHTML(SIZES, s.size) + '</div>';
      else if (s.step === 2) h = '<div class="wstep">' + head('How soon do you need us?', "Active leak or no AC? We'll move you to the front of the line.") + optsHTML(URGENCY, s.urgency) + '</div>';
      else if (s.step === 3) {
        var note = s.urgency === 'now'
          ? 'Emergency crew can be out today. After-hours callout is +$150, waived if you go ahead with the job.'
          : (s.service === 'storm' ? 'Storm damage is often covered by homeowners insurance. We meet your adjuster on the roof, free.' : 'Final price is confirmed in writing after a free on-site inspection.');
        h = '<div class="wstep"><span style="font-weight:700;font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:#4A515B">Your ballpark</span>' +
          '<div class="wprice">' + money(c.lo) + ' – ' + money(c.hi) + '</div>' +
          '<p style="margin:0;color:#3A414A;font-size:18px">' + esc(c.svc.label + ' · ' + c.size.label + ' · ' + c.urg.label) + '</p>' +
          '<div class="wnote"><b aria-hidden="true">!</b><span>' + esc(note) + '</span></div>' +
          '<button type="button" class="wbtn acc" data-act="next">Lock in a free inspection →</button></div>';
      }
      else if (s.step === 4) h = '<form class="wstep" data-act="zip"><h3 class="wq">What’s the ZIP code?</h3>' + field('est-zip', 'ZIP code', 'text', 'postal-code', '76137', s.zip, 'numeric') + '<button type="submit" class="wbtn">Continue →</button></form>';
      else if (s.step === 5) h = '<form class="wstep" data-act="name"><h3 class="wq">Who should we ask for?</h3>' + field('est-name', 'Your name', 'text', 'name', 'First name is fine', s.name) + (s.err ? '<p class="werr" role="alert">' + esc(s.err) + '</p>' : '') + '<button type="submit" class="wbtn">Continue →</button></form>';
      else if (s.step === 6) h = '<form class="wstep" data-act="phone"><h3 class="wq">Best mobile number?</h3><p class="wsub" style="margin:0">We text your inspection time and the crew lead’s name. No spam, ever.</p>' + field('est-phone', 'Mobile', 'tel', 'tel', '(817) 000-0000', s.phone) + (s.err ? '<p class="werr" role="alert">' + esc(s.err) + '</p>' : '') + '<button type="submit" class="wbtn acc">Book my free inspection</button></form>';
      else {
        var first = s.name.trim().split(' ')[0];
        h = '<div class="wdone">' + TICK + '<h3>' + esc(first ? "You're booked in, " + first + '.' : "You're booked in.") + '</h3>' +
          '<p>We’ll call ' + esc(s.phone || 'you') + ' within the hour to set your free inspection' + (s.zip ? ' in ' + esc(s.zip) : '') + '. Your ballpark: ' + money(c.lo) + ' – ' + money(c.hi) + '.</p>' +
          '<span class="wsign">— Erik &amp; the crew</span></div>';
      }
      if (s.step > 0 && s.step < 7) h += '<button type="button" class="wlink" data-act="back">← Back</button>';
      if (s.step === 7) h += '<button type="button" class="wlink" data-act="restart">↺ Start a new estimate</button>';
      body.innerHTML = h;

      if (s.step === 0) bindOpts(body, SERVICES, function (o) { s.service = o.id; go(1); });
      if (s.step === 1) bindOpts(body, SIZES, function (o) { s.size = o.id; go(2); });
      if (s.step === 2) bindOpts(body, URGENCY, function (o) { s.urgency = o.id; go(3); });
      var nx = body.querySelector('[data-act="next"]'); if (nx) nx.addEventListener('click', function () { go(4); });
      var bk = body.querySelector('[data-act="back"]'); if (bk) bk.addEventListener('click', function () { go(Math.max(s.step - 1, 0)); });
      var rs = body.querySelector('[data-act="restart"]'); if (rs) rs.addEventListener('click', function () { s.service = s.size = s.urgency = null; go(0); });
      var f = body.querySelector('form');
      if (f) {
        var inp = f.querySelector('input');
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          var act = f.getAttribute('data-act');
          if (act === 'zip') { s.zip = inp.value.trim(); go(5); }
          else if (act === 'name') {
            s.name = inp.value;
            if (!s.name.trim()) { s.err = 'Just a first name so we know who to ask for.'; render(); return; }
            go(6);
          } else if (act === 'phone') {
            s.phone = inp.value;
            if (s.phone.replace(/\D/g, '').length < 7) { s.err = 'Add a number we can call you back on.'; render(); return; }
            sendForm('estimate', {
              service: c.svc.label, home_size: c.size.label, urgency: c.urg.label,
              estimate: money(c.lo) + ' – ' + money(c.hi), zip: s.zip, name: s.name.trim(), phone: s.phone.trim()
            });
            go(7);
          }
        });
        if (s.step > 3 && window.matchMedia('(min-width: 701px)').matches) { try { inp.focus({ preventScroll: true }); } catch (e) {} }
      }
    }
    render();
  }

  /* ---------- Contact: step-by-step callback ---------- */
  function initCallback() {
    var body = document.getElementById('cb-body');
    if (!body) return;
    var stepNum = document.getElementById('cb-stepnum');
    var bar = document.getElementById('cb-bar');
    var head2 = document.getElementById('cb-head');
    var TOPICS = [
      { id: 'roof', label: 'Roofing', sub: 'Leaks, repairs, new roofs' },
      { id: 'storm', label: 'Storm damage', sub: 'Hail, wind, fallen trees' },
      { id: 'hvac', label: 'AC or heating', sub: 'Repairs and new systems' },
      { id: 'other', label: 'Something else', sub: 'Gutters, billing, past jobs' }
    ];
    var DETAILS = {
      roof: { q: 'What’s going on with the roof?', list: ['Leak or water stain', 'Missing or damaged shingles', 'Thinking about a new roof', 'Just want it inspected'] },
      storm: { q: 'What kind of damage?', list: ['Hail damage', 'Wind damage', 'Tree or branch on the roof', 'Not sure, need it checked'] },
      hvac: { q: 'What’s the AC or heater doing?', list: ['AC not cooling', 'Heat not working', 'Strange noise or smell', 'Want a new system'] },
      other: { q: 'What do you need?', list: ['Gutters', 'Question about a past job', 'Billing question', 'Something else'] }
    };
    var TIMES = [
      { id: 'now', label: 'Right now', sub: 'Emergency, call me ASAP', when: 'in the next few minutes' },
      { id: 'morning', label: 'Morning', sub: '8am – noon', when: 'this morning' },
      { id: 'afternoon', label: 'Afternoon', sub: 'Noon – 5pm', when: 'this afternoon' },
      { id: 'evening', label: 'Evening', sub: 'After 5pm', when: 'after 5pm' }
    ];
    var s = { step: 0, topic: null, detail: null, time: null, name: '', phone: '', err: '' };
    function go(n) { s.step = n; s.err = ''; render(); }

    function render() {
      if (head2) head2.style.display = s.step < 5 ? '' : 'none';
      if (stepNum) stepNum.textContent = 'Request a callback · step ' + Math.min(s.step + 1, 5) + ' of 5';
      if (bar) bar.style.width = Math.round(Math.min(s.step, 5) / 5 * 100) + '%';
      var det = DETAILS[s.topic || 'roof'];
      var dlist = det.list.map(function (l) { return { id: l, label: l }; });
      var time = find(TIMES, s.time);
      var topic = find(TOPICS, s.topic);
      var h = '';
      if (s.step === 0) h = '<div class="wstep">' + head('What can we help with?', "Tap one. We'll ask the rest on the phone.") + optsHTML(TOPICS, s.topic) + '</div>';
      else if (s.step === 1) h = '<div class="wstep">' + head(det.q, 'Closest match is fine.') + optsHTML(dlist, s.detail) + '</div>';
      else if (s.step === 2) h = '<div class="wstep">' + head('When should we call?', 'Texas time. Water coming in? Pick “Right now”.') + optsHTML(TIMES, s.time) + '</div>';
      else if (s.step === 3) h = '<form class="wstep" data-act="name"><h3 class="wq">Who should we ask for?</h3>' + field('cb-name', 'Your name', 'text', 'name', 'First name is fine', s.name) + (s.err ? '<p class="werr" role="alert">' + esc(s.err) + '</p>' : '') + '<button type="submit" class="wbtn">Continue →</button></form>';
      else if (s.step === 4) h = '<form class="wstep" data-act="phone"><h3 class="wq">Best number to reach you?</h3><p class="wsub" style="margin:0">We’ll text you first so you know it’s us. No spam, ever.</p>' + field('cb-phone', 'Mobile', 'tel', 'tel', '(817) 000-0000', s.phone) + (s.err ? '<p class="werr" role="alert">' + esc(s.err) + '</p>' : '') + '<button type="submit" class="wbtn acc">Call me back →</button></form>';
      else {
        var first = s.name.trim().split(' ')[0];
        h = '<div class="wdone">' + TICK + '<h3>' + esc(first ? 'Got it, ' + first + '.' : 'Got it.') + '</h3>' +
          '<p>Erik will call ' + esc(s.phone || 'you') + ' ' + esc(time ? time.when : 'soon') + '. If water is coming in or the house is too hot, don’t wait: call ' + PHONE_DISPLAY + '.</p>' +
          '<div class="wtags"><span>' + esc(topic ? topic.label : '') + '</span><span>' + esc(s.detail || '') + '</span><span>' + esc(time ? time.label : '') + '</span></div>' +
          '<span class="wsign">— Erik</span></div>';
      }
      if (s.step > 0 && s.step < 5) h += '<button type="button" class="wlink" data-act="back">← Back</button>';
      if (s.step === 5) h += '<button type="button" class="wlink" data-act="restart">↺ Start over</button>';
      body.innerHTML = h;

      if (s.step === 0) bindOpts(body, TOPICS, function (o) { s.topic = o.id; s.detail = null; go(1); });
      if (s.step === 1) bindOpts(body, dlist, function (o) { s.detail = o.id; go(2); });
      if (s.step === 2) bindOpts(body, TIMES, function (o) { s.time = o.id; go(3); });
      var bk = body.querySelector('[data-act="back"]'); if (bk) bk.addEventListener('click', function () { go(Math.max(s.step - 1, 0)); });
      var rs = body.querySelector('[data-act="restart"]'); if (rs) rs.addEventListener('click', function () { s.topic = s.detail = s.time = null; go(0); });
      var f = body.querySelector('form');
      if (f) {
        var inp = f.querySelector('input');
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          if (f.getAttribute('data-act') === 'name') {
            s.name = inp.value;
            if (!s.name.trim()) { s.err = 'Just a first name so we know who to ask for.'; render(); return; }
            go(4);
          } else {
            s.phone = inp.value;
            if (s.phone.replace(/\D/g, '').length < 7) { s.err = 'Add a number we can call you back on.'; render(); return; }
            sendForm('callback', {
              topic: topic ? topic.label : '', detail: s.detail || '', best_time: time ? time.label : '',
              name: s.name.trim(), phone: s.phone.trim()
            });
            go(5);
          }
        });
        if (window.matchMedia('(min-width: 701px)').matches) { try { inp.focus({ preventScroll: true }); } catch (e) {} }
      }
    }
    render();
  }

  /* ---------- Before / after slider ---------- */
  function initSlider() {
    var range = document.getElementById('ba-range');
    if (!range) return;
    var before = document.getElementById('ba-before');
    var line = document.getElementById('ba-line');
    var wrap = range.parentElement;
    var touched = false;
    function set(v) { before.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)'; line.style.left = v + '%'; }
    range.addEventListener('input', function () {
      if (!touched) { touched = true; wrap.classList.remove('ba-anim'); }
      set(+range.value);
    });
    set(50);
    var played = false;
    function demo() {
      if (played) return; played = true;
      wrap.classList.add('ba-anim');
      [[300, 66], [1100, 34], [1900, 50]].forEach(function (p) {
        setTimeout(function () { if (!touched) { range.value = p[1]; set(p[1]); } }, p[0]);
      });
      setTimeout(function () { if (!touched) wrap.classList.remove('ba-anim'); }, 2600);
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { demo(); io.disconnect(); } }); }, { threshold: 0.5 });
      io.observe(wrap);
    } else { demo(); }
  }

  /* ---------- FAQ accordion ---------- */
  function initFaq() {
    document.querySelectorAll('.faqi').forEach(function (item) {
      var btn = item.querySelector('.faq');
      var ans = item.querySelector('.fa');
      btn.addEventListener('click', function () {
        var open = !item.classList.contains('open');
        document.querySelectorAll('.faqi.open').forEach(function (o) {
          o.classList.remove('open'); o.querySelector('.fa').hidden = true; o.querySelector('.faq').setAttribute('aria-expanded', 'false');
        });
        if (open) { item.classList.add('open'); ans.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
      });
    });
  }

  /* ---------- Office hours: highlight today ---------- */
  function initHours() {
    var dow = new Date().getDay();
    document.querySelectorAll('.hrs li[data-days]').forEach(function (li) {
      if (li.getAttribute('data-days').split(',').indexOf(String(dow)) !== -1) {
        li.classList.add('today');
        var tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = 'Today';
        li.firstElementChild.appendChild(tag);
      }
    });
  }

  /* ---------- Make sure muted background videos actually play on phones ---------- */
  function initVideos() {
    document.querySelectorAll('video[autoplay]').forEach(function (v) {
      v.muted = true;
      var p = v.play && v.play();
      if (p && p.catch) p.catch(function () {});
    });
  }

  function start() { initEstimate(); initCallback(); initSlider(); initFaq(); initHours(); initVideos(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
