/**
 * Selector de categorias (pantalla de inicio). Recreacion del handoff de
 * diseno "Selector de categorias atletismo" (pista de atletismo, mobile
 * <900px con hoja inferior, desktop >=900px con panel lateral).
 *
 * Al elegir categoria + sexo, navega a planilla.html?categoria=X&sexo=F|M,
 * que abre esa categoria y precarga la disciplina que corresponda
 * (ver defaultDisciplineForGender en app.js).
 */
(function () {
  const ZOOM_MOBILE = 1.45;
  const ZOOM_DESKTOP = ZOOM_MOBILE - 0.1;
  const SHADOW_NORMAL_M = '0 10px 22px rgba(0,0,0,.45)';
  const SHADOW_HIGHLIGHT_M = '0 16px 30px rgba(0,0,0,.5)';

  // id: usado en el estado/URL. key: nombre de categoria en CATEGORIES (coefficients.js).
  // null => pill deshabilitada ("proximamente").
  const CATEGORIES_UI = [
    {
      id: 'u10', key: 'U10', label: 'U10',
      mobile: { left: 296, top: 325, font: 19, pad: '6px 14px', radius: 9, shadow: SHADOW_NORMAL_M },
      desktop: { left: 1195, top: 195, font: 26, pad: '8px 20px', radius: 10, shadow: '0 12px 26px rgba(0,0,0,.45)' },
    },
    {
      id: 'u12', key: 'U12', label: 'U12',
      mobile: { left: 271, top: 371, font: 21, pad: '6px 18px', radius: 10, shadow: SHADOW_NORMAL_M },
      desktop: { left: 1150, top: 274, font: 30, pad: '9px 24px', radius: 11, shadow: '0 12px 26px rgba(0,0,0,.45)' },
    },
    {
      id: 'u14', key: 'U14', label: 'U14',
      mobile: { left: 250, top: 425, font: 24, pad: '7px 20px', radius: 11, shadow: SHADOW_NORMAL_M },
      desktop: { left: 1110, top: 361, font: 34, pad: '10px 26px', radius: 12, shadow: '0 13px 28px rgba(0,0,0,.45)' },
    },
    {
      id: 'u16', key: 'U16', label: 'U16',
      mobile: { left: 231, top: 485, font: 27, pad: '11px 22px', radius: 12, shadow: SHADOW_NORMAL_M },
      desktop: { left: 1075, top: 462, font: 38, pad: '12px 30px', radius: 13, shadow: '0 14px 30px rgba(0,0,0,.45)' },
    },
    {
      id: 'u18', key: 'U18', label: 'U18',
      mobile: { left: 217, top: 556, font: 29, pad: '12px 24px', radius: 13, shadow: SHADOW_NORMAL_M },
      desktop: { left: 1045, top: 574, font: 44, pad: '14px 34px', radius: 14, shadow: '0 16px 32px rgba(0,0,0,.45)' },
    },
    {
      id: 'u20', key: 'U20', label: 'U20',
      mobile: { left: 205, top: 632, font: 31, pad: '12px 26px', radius: 13, shadow: SHADOW_NORMAL_M },
      desktop: { left: 1020, top: 697, font: 50, pad: '16px 38px', radius: 15, shadow: '0 18px 34px rgba(0,0,0,.45)' },
    },
    {
      id: 'mayores', key: 'Mayores', label: 'MAYORES', highlight: true,
      mobile: { left: 195, top: 717, font: 34, pad: '13px 28px', radius: 14, shadow: SHADOW_HIGHLIGHT_M },
      desktop: { left: 1000, top: 823, font: 56, pad: '18px 42px', radius: 16, shadow: '0 20px 40px rgba(0,0,0,.5)' },
    },
  ];

  const activeCount = CATEGORIES_UI.filter((c) => !c.disabled).length;

  const els = {
    mobileView: document.getElementById('mobile-view'),
    desktopView: document.getElementById('desktop-view'),
    trackM: document.getElementById('track-layer-m'),
    headerM: document.getElementById('header-m'),
    pillsM: document.getElementById('pills-m'),
    footerM: document.getElementById('footer-m'),
    footerCountM: document.getElementById('footer-count-m'),
    scrimM: document.getElementById('scrim-m'),
    sheetM: document.getElementById('sheet-m'),
    sheetCatLabelM: document.getElementById('sheet-cat-label-m'),
    btnCambiarM: document.getElementById('btn-cambiar-m'),
    linkFM: document.getElementById('link-f-m'),
    linkMM: document.getElementById('link-m-m'),

    canvasOuterD: document.getElementById('canvas-outer-d'),
    canvasScaleD: document.getElementById('canvas-scale-d'),
    trackD: document.getElementById('track-layer-d'),
    pillsD: document.getElementById('pills-d'),
    panelTitleD: document.getElementById('panel-title-d'),
    panelSelD: document.getElementById('panel-sel-d'),
    selLabelD: document.getElementById('sel-label-d'),
    btnVolverD: document.getElementById('btn-volver-d'),
    linkFD: document.getElementById('link-f-d'),
    linkMD: document.getElementById('link-m-d'),
  };

  els.footerCountM.textContent = `${activeCount} ACTIVAS`;

  let selectedId = null;
  let isMobile = window.innerWidth < 900;

  buildPills();
  applyState();
  updateLayout();

  window.addEventListener('resize', updateLayout);
  els.scrimM.addEventListener('click', clearSelection);
  els.btnCambiarM.addEventListener('click', clearSelection);
  els.btnVolverD.addEventListener('click', clearSelection);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') clearSelection();
  });

  function buildPills() {
    CATEGORIES_UI.forEach((cat) => {
      els.pillsM.appendChild(makePill(cat, 'mobile'));
      els.pillsD.appendChild(makePill(cat, 'desktop'));
    });
  }

  function makePill(cat, layout) {
    const geo = cat[layout];
    const el = document.createElement(cat.disabled ? 'div' : 'a');
    el.className = 'pill' + (cat.highlight ? ' pill--highlight' : '') + (cat.disabled ? ' pill--disabled' : '');
    el.style.left = `${geo.left}px`;
    el.style.top = `${geo.top}px`;
    el.style.fontSize = `${geo.font}px`;
    el.style.padding = geo.pad;
    el.style.borderRadius = `${geo.radius}px`;
    if (geo.shadow) el.style.boxShadow = geo.shadow;

    if (cat.disabled) {
      el.innerHTML = `<span>${cat.label}</span><span class="pill-sub">PROXIMAMENTE</span>`;
      el.setAttribute('aria-disabled', 'true');
      return el;
    }

    el.href = `#${cat.id}`;
    el.setAttribute('aria-label', `Categoria ${cat.label}`);
    el.innerHTML = `<span>${cat.label}</span>`;
    el.addEventListener('click', (e) => {
      e.preventDefault();
      selectedId = cat.id;
      applyState();
    });
    return el;
  }

  function findCat(id) {
    return CATEGORIES_UI.find((c) => c.id === id) || null;
  }

  function clearSelection() {
    selectedId = null;
    applyState();
  }

  function applyState() {
    const cat = selectedId ? findCat(selectedId) : null;

    // --- Mobile ---
    const geoM = cat ? cat.mobile : null;
    els.trackM.style.transform = cat ? `scale(${ZOOM_MOBILE})` : 'scale(1)';
    els.trackM.style.transformOrigin = cat
      ? `${geoM.left}px ${Math.max(geoM.top - 110, 220)}px`
      : '195px 520px';
    els.pillsM.style.opacity = cat ? '0' : '1';
    els.pillsM.style.pointerEvents = cat ? 'none' : 'auto';
    els.headerM.style.opacity = cat ? '0.25' : '1';
    els.footerM.style.opacity = cat ? '0' : '1';

    if (cat) {
      els.scrimM.hidden = false;
      els.sheetM.hidden = false;
      els.sheetCatLabelM.textContent = cat.label;
      els.linkFM.href = `planilla.html?categoria=${cat.key}&sexo=F`;
      els.linkMM.href = `planilla.html?categoria=${cat.key}&sexo=M`;
    } else {
      els.scrimM.hidden = true;
      els.sheetM.hidden = true;
    }

    // --- Desktop ---
    const geoD = cat ? cat.desktop : null;
    els.trackD.style.transform = cat ? `scale(${ZOOM_DESKTOP})` : 'scale(1)';
    els.trackD.style.transformOrigin = cat ? `${geoD.left}px ${geoD.top}px` : '1000px 500px';
    els.pillsD.style.opacity = cat ? '0' : '1';
    els.pillsD.style.pointerEvents = cat ? 'none' : 'auto';

    if (cat) {
      els.panelTitleD.hidden = true;
      els.panelSelD.hidden = false;
      els.selLabelD.textContent = cat.label;
      els.linkFD.href = `planilla.html?categoria=${cat.key}&sexo=F`;
      els.linkMD.href = `planilla.html?categoria=${cat.key}&sexo=M`;
    } else {
      els.panelTitleD.hidden = false;
      els.panelSelD.hidden = true;
    }
  }

  function updateLayout() {
    const width = window.innerWidth;
    isMobile = width < 900;
    els.mobileView.hidden = !isMobile;
    els.desktopView.hidden = isMobile;

    if (!isMobile) {
      // "Contain": escala por el eje mas restrictivo (ancho o alto) para que
      // el lienzo de 1440x900 entre siempre completo en la ventana, sin
      // recortarse ni dejar scroll. Sin techo en 1: en monitores grandes
      // agranda el dibujo en vez de dejarlo chico con margenes muertos.
      // Como el aspect-ratio de la ventana casi nunca es igual al del
      // lienzo (1440:900), sobra espacio en un eje: se centra ahi.
      const height = window.innerHeight;
      const scale = Math.min(width / 1440, height / 900);
      const offsetX = (width - 1440 * scale) / 2;
      const offsetY = (height - 900 * scale) / 2;
      els.canvasScaleD.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    }
  }
})();
