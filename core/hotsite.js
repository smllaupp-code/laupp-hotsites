/* Laupp Hotsites v1 — componentes dos hotsites de empreendimento. Lê a configuração de <script id="h-cfg" type="application/json">.
   Tudo termina no WhatsApp do corretor; nenhum dado do visitante é enviado para servidor daqui. */
(function () {
  'use strict';
  var C = {};
  try { C = JSON.parse(document.getElementById('h-cfg').textContent); } catch (e) { return; }
  var NPM = 'https://cdn.jsdelivr.net/npm/';
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function wa(t) { return 'https://wa.me/' + C.whatsapp + '?text=' + encodeURIComponent(t); }
  function brl(v) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function ev(nome, dados) { try { if (window.fbq) fbq('trackCustom', nome, dados || {}); if (window.gtag) gtag('event', nome, dados || {}); } catch (e) {} }
  function carrega(u, css) {
    return new Promise(function (ok) {
      var e = document.createElement(css ? 'link' : 'script');
      if (css) { e.rel = 'stylesheet'; e.href = NPM + u; document.head.appendChild(e); return ok(1); }
      e.src = NPM + u; e.onload = function () { ok(1); }; e.onerror = function () { ok(0); }; document.head.appendChild(e);
    });
  }
  function escolhas(caixa, opcoes, cb) {
    opcoes.forEach(function (o, i) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = o; if (!i) b.className = 'on';
      b.onclick = function () { $$('button', caixa).forEach(function (x) { x.className = ''; }); b.className = 'on'; cb(o); };
      caixa.appendChild(b);
    });
    cb(opcoes[0]);
  }

  /* animação ao rolar */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('h-vis'); io.unobserve(e.target); } });
  }, { threshold: 0.15 }) : null;
  $$('.h-rev').forEach(function (el) { io ? io.observe(el) : el.classList.add('h-vis'); });

  /* rastreio de cliques no WhatsApp (só dispara se Pixel/GA estiverem ligados no site) */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="wa.me"]');
    if (a) ev('WhatsAppClick', { origem: a.getAttribute('data-origem') || 'hotsite', ref: C.ref });
  }, true);

  /* barra fixa no celular + afastar aviso de cookies nativo (receita medida no lab G) */
  if (C.barra) {
    var bar = document.createElement('div'); bar.className = 'h-barra';
    bar.innerHTML = '<a class="w" data-origem="barra" href="' + wa(C.msg) + '">WhatsApp</a><a class="v" href="#h-agenda">Agendar visita</a>';
    document.body.appendChild(bar); document.body.classList.add('h-com-barra');
    var ajusta = function () {
      if (innerWidth >= 900) return;
      $$('body *').forEach(function (el) {
        if (el === bar || bar.contains(el)) return;
        if (getComputedStyle(el).position === 'fixed' && /cookies/i.test(el.innerText || '') && el.getBoundingClientRect().height < 260) el.style.bottom = '72px';
      });
    };
    addEventListener('load', function () { ajusta(); setTimeout(ajusta, 1500); });
  }

  /* galeria: deslizar + ampliar */
  if ($('.h-gal')) {
    carrega('swiper@11.1.14/swiper-bundle.min.css', 1); carrega('glightbox@3.3.0/dist/css/glightbox.min.css', 1);
    carrega('swiper@11.1.14/swiper-bundle.min.js').then(function (ok) {
      if (ok) new Swiper('.h-gal', { slidesPerView: 1.12, spaceBetween: 10, centeredSlides: true, loop: true, breakpoints: { 768: { slidesPerView: 2.1 } } });
    });
    carrega('glightbox@3.3.0/dist/js/glightbox.min.js').then(function (ok) { if (ok) GLightbox({ selector: '.h-gal a' }); });
  }

  /* simulador de financiamento (SAC e Price) */
  var sim = $('#h-sim');
  if (sim) {
    var campo = function (n) { return $('[name="' + n + '"]', sim); }, txt = '';
    var calcula = function () {
      var v = +campo('valor').value, e = +campo('entrada').value, n = +campo('anos').value * 12;
      var i = Math.pow(1 + (+campo('taxa').value) / 100, 1 / 12) - 1, f = v - e, sac = campo('sistema').value === 'SAC', p1, pn;
      if (f <= 0 || n <= 0 || i <= 0) { $('#h-sim-r').textContent = '-'; return; }
      if (sac) { var a = f / n; p1 = a + f * i; pn = a + a * i; } else { p1 = pn = f * i / (1 - Math.pow(1 + i, -n)); }
      $('#h-sim-r').textContent = brl(p1);
      $('#h-sim-d').textContent = (sac ? 'Última parcela ' + brl(pn) + '. ' : 'Parcelas fixas. ') + 'Valor financiado ' + brl(f) + ' em ' + n + ' meses.';
      txt = 'Olá Samuel! Simulei o ' + C.nome + ' (ref. ' + C.ref + '): valor ' + brl(v) + ', entrada ' + brl(e) + ', ' + campo('anos').value + ' anos, ' + campo('sistema').value + ', 1ª parcela aprox. ' + brl(p1) + '. Pode me ajudar com o financiamento?';
    };
    $$('input,select', sim).forEach(function (x) { x.addEventListener('input', calcula); });
    calcula();
    $('#h-sim-w').onclick = function (e) { e.preventDefault(); ev('Simulacao', { ref: C.ref }); location.href = wa(txt); };
  }

  /* agendar visita: dia + período, mensagem pronta */
  var ag = $('#h-agenda');
  if (ag) {
    var dias = [], hoje = new Date(), dia, per;
    for (var k = 1; k <= 6; k++) { var d = new Date(hoje); d.setDate(d.getDate() + k); dias.push(d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })); }
    escolhas($('[data-dias]', ag), dias, function (o) { dia = o; });
    escolhas($('[data-periodos]', ag), ['Manhã', 'Tarde', 'Fim de tarde'], function (o) { per = o; });
    $('#h-ag-w').onclick = function (e) {
      e.preventDefault();
      var nome = ($('[name="nome"]', ag).value || '').trim();
      ev('AgendarVisita', { ref: C.ref, dia: dia });
      location.href = wa((nome ? nome + ' aqui. ' : 'Olá Samuel! ') + 'Quero visitar o ' + C.nome + ' (ref. ' + C.ref + ') no dia ' + dia + ', período: ' + per + '.');
    };
  }

  /* ficha do imóvel em PDF, gerada no aparelho */
  var bp = $('#h-pdf');
  if (bp && C.pdf) {
    bp.onclick = function () {
      bp.disabled = true; bp.textContent = 'Gerando...';
      carrega('jspdf@2.5.2/dist/jspdf.umd.min.js').then(function () {
        var doc = new jspdf.jsPDF({ unit: 'mm', format: 'a4' });
        doc.setFillColor(14, 26, 43); doc.rect(0, 0, 210, 32, 'F');
        doc.setTextColor(201, 162, 74); doc.setFontSize(9); doc.text('SAMUEL LAUPP IMÓVEIS', 14, 12);
        doc.setFontSize(20); doc.text(C.pdf.titulo, 14, 24);
        var img = new Image(); img.crossOrigin = 'anonymous';
        var fim = function (comFoto) {
          var y = comFoto ? 160 : 46; doc.setTextColor(28, 36, 51); doc.setFontSize(12);
          C.pdf.linhas.forEach(function (l, j) { doc.text(l, 14, y + j * 8); });
          doc.setTextColor(31, 168, 85); doc.setFontSize(12); doc.textWithLink('Falar no WhatsApp: (13) 98182-3465', 14, y + C.pdf.linhas.length * 8 + 8, { url: wa(C.msg) });
          doc.textWithLink('Ver o anúncio completo', 14, y + C.pdf.linhas.length * 8 + 16, { url: C.link_imovel });
          doc.save(C.pdf.arquivo); ev('BaixouFicha', { ref: C.ref }); bp.disabled = false; bp.textContent = 'Baixar ficha em PDF';
        };
        img.onload = function () {
          var c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; c.getContext('2d').drawImage(img, 0, 0);
          doc.addImage(c.toDataURL('image/jpeg', 0.82), 'JPEG', 14, 38, 182, 114); fim(true);
        };
        img.onerror = function () { fim(false); };
        img.src = C.pdf.foto;
      });
    };
  }
})();
