/**
 * Capa de UI: solo lee/escribe el estado y llama a scoring.js.
 * Toda la logica de puntaje vive en scoring.js / coefficients.js.
 *
 * Modelo de la planilla (calcado del papel que usa el club):
 * una hoja = una categoria + una disciplina (Prueba) fija, con su sexo.
 * Por eso "Disciplina" dejo de ser un dato por atleta: ahora es un selector
 * a nivel de hoja (PRUEBA) que determina que columnas se muestran para
 * TODOS los atletas de esa hoja. Cambiar de categoria o de prueba carga
 * otra lista de atletas (cada combinacion categoria+prueba guarda la suya).
 */
(function () {
  const CATEGORY_ORDER = ['U10', 'U12', 'U14', 'U16', 'U18', 'U20', 'Mayores'];
  const orderedCategoryKeys = CATEGORY_ORDER.filter((key) => CATEGORIES[key]);

  // Si se llega desde el selector de inicio con ?categoria=U16&sexo=F, se abre
  // esa categoria y se preselecciona la disciplina que corresponda a ese sexo.
  const urlParams = new URLSearchParams(window.location.search);
  const sexoParam = urlParams.get('sexo');
  const categoriaParam = urlParams.get('categoria');
  const categoriaFromUrl = categoriaParam
    ? orderedCategoryKeys.find((key) => key.toLowerCase() === categoriaParam.toLowerCase())
    : null;

  let categoryKey = categoriaFromUrl || orderedCategoryKeys[0];
  let disciplineKey = null;
  // Sexo activo de la hoja. A diferencia de categoryKey/disciplineKey esto
  // NO viene solo de una disciplina (en U10/U12/Decatlon hay una sola
  // disciplina para los dos sexos), asi que se guarda aparte y el usuario lo
  // puede cambiar en cualquier momento con el selector "SEXO" de la cabecera.
  let sexo = sexoParam ? (sexoParam.toUpperCase() === 'F' ? 'F' : 'M') : 'M';

  const state = { athletes: [] };

  function category() {
    return CATEGORIES[categoryKey];
  }

  function disciplineNames() {
    return Object.keys(category().disciplines);
  }

  function discipline() {
    return category().disciplines[disciplineKey];
  }

  function eventCodes() {
    return discipline().eventCodes;
  }

  // Busca, dentro de la categoria, la disciplina marcada con ese genero
  // exacto (p. ej. 'Hexatlon Femenino' para F); si no hay una exclusiva
  // para ese genero, cae en la que sirve para cualquiera (gender: null).
  function defaultDisciplineForGender(gender) {
    const entries = Object.entries(category().disciplines);
    const exact = entries.find(([, d]) => d.gender === gender);
    if (exact) return exact[0];
    const universal = entries.find(([, d]) => d.gender == null);
    return universal ? universal[0] : entries[0][0];
  }

  function pickInitialDiscipline() {
    const pre = defaultDisciplineForGender(sexo);
    if (pre) return pre;
    return disciplineNames()[0];
  }

  // Si la disciplina actual es exclusiva de un genero (p. ej. "Hexatlon
  // Femenino"), ese genero manda: sincroniza la variable sexo con el. Si la
  // disciplina sirve para cualquiera (p. ej. Combinada Promocional,
  // Decatlon), no la toca: ahi el sexo lo decide unicamente el selector.
  function syncSexoWithDiscipline() {
    const g = discipline().gender;
    if (g) sexo = g;
  }

  function sexoLabel() {
    return sexo === 'F' ? 'FEMENINO' : 'MASCULINO';
  }

  // IMPORTANTE: el sexo forma parte de la clave de guardado. Sin esto, una
  // disciplina que sirve para los dos sexos (Combinada Promocional en
  // U10/U12, Decatlon en U18/U20/Mayores) guardaria una sola lista
  // compartida entre Masculino y Femenino, mezclando atletas de un sexo con
  // el otro al cambiar el selector (bug reportado: "al cambiar de sexo
  // siguen los atletas del otro sexo").
  function athletesStorageKey() {
    return `atletismo_app_atletas_v2_${categoryKey}__${disciplineKey}__${sexo}`;
  }

  // Clave vieja (antes de separar por sexo), solo para migrar datos ya
  // guardados la primera vez que se abre cada categoria/disciplina.
  function legacyAthletesStorageKey() {
    return `atletismo_app_atletas_v2_${categoryKey}__${disciplineKey}`;
  }

  const TORNEO_KEY = 'atletismo_app_torneo';
  const ORG_KEY = 'atletismo_app_org';

  function loadShared(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : raw;
    } catch (e) {
      return fallback;
    }
  }
  function saveShared(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* si falla el guardado seguimos funcionando solo en memoria */
    }
  }

  function loadAthletes() {
    try {
      const raw = localStorage.getItem(athletesStorageKey());
      if (raw) return JSON.parse(raw);
    } catch (e) {
      /* localStorage no disponible, seguimos con datos de ejemplo */
    }

    // Migracion unica: si existe una lista vieja (guardada antes de separar
    // por sexo) para esta categoria/disciplina, se adopta entera para el
    // sexo que se esta mirando ahora mismo y se borra la clave vieja, para
    // que el otro sexo arranque limpio (no hay forma de saber, a esta
    // altura, cual atleta de esa lista mezclada era de cada sexo).
    try {
      const legacyKey = legacyAthletesStorageKey();
      const legacyRaw = localStorage.getItem(legacyKey);
      if (legacyRaw) {
        localStorage.removeItem(legacyKey);
        const migrated = JSON.parse(legacyRaw);
        localStorage.setItem(athletesStorageKey(), legacyRaw);
        return migrated;
      }
    } catch (e) {
      /* si la migracion falla seguimos con datos de ejemplo */
    }

    return seedAthletes();
  }

  function seedAthletes() {
    if (categoryKey !== 'U16' || disciplineKey !== 'Octatlon Masculino') return [];
    return [
      {
        id: 'seed-1',
        name: 'Ejemplo Juan',
        club: 'Club A',
        marks: { M_80: '10.04', M_Largo: ['5.80', '', ''] },
        manual: {},
        rank: null,
      },
    ];
  }

  function saveAthletes() {
    try {
      localStorage.setItem(athletesStorageKey(), JSON.stringify(state.athletes));
    } catch (e) {
      /* si falla el guardado seguimos funcionando solo en memoria */
    }
  }

  function newId() {
    return window.crypto && crypto.randomUUID ? crypto.randomUUID() : `a-${Date.now()}-${Math.random()}`;
  }

  function formatMark(value) {
    return Number(value).toFixed(2);
  }

  // ---- DOM ----
  const torneoInput = document.querySelector('#torneo-input');
  const orgInput = document.querySelector('#org-input');
  const categorySelect = document.querySelector('#category');
  const disciplineSelect = document.querySelector('#discipline');
  const sexoSelect = document.querySelector('#sexo-select');
  const form = document.querySelector('#add-athlete-form');
  const sortBtn = document.querySelector('#sort-btn');
  const exportBtn = document.querySelector('#export-btn');
  const resultsContainer = document.querySelector('#results-container');
  const theadEl = document.querySelector('#athletes-table thead');
  const tableBody = document.querySelector('#athletes-table tbody');
  const cardsWrap = document.querySelector('#cards-wrap');

  torneoInput.value = loadShared(TORNEO_KEY, '');
  torneoInput.addEventListener('input', () => saveShared(TORNEO_KEY, torneoInput.value));

  orgInput.value = loadShared(ORG_KEY, orgInput.value);
  orgInput.addEventListener('input', () => saveShared(ORG_KEY, orgInput.value));

  orderedCategoryKeys.forEach((key) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = CATEGORIES[key].label;
    categorySelect.appendChild(opt);
  });
  categorySelect.value = categoryKey;

  categorySelect.addEventListener('change', () => {
    categoryKey = categorySelect.value;
    disciplineKey = pickInitialDiscipline();
    syncSexoWithDiscipline();
    loadSheet();
  });
  disciplineSelect.addEventListener('change', () => {
    disciplineKey = disciplineSelect.value;
    syncSexoWithDiscipline();
    loadSheet();
  });
  sexoSelect.addEventListener('change', () => {
    sexo = sexoSelect.value;
    // Si la disciplina actual es de un sexo especifico (p. ej. "Octatlon
    // Masculino") y se elige el otro sexo, se salta a la disciplina que le
    // corresponde (p. ej. "Hexatlon Femenino"). Si la disciplina actual
    // sirve para cualquiera (Combinada Promocional, Decatlon), se queda
    // igual: cambiar el sexo ahi solo separa la lista de atletas.
    if (discipline().gender && discipline().gender !== sexo) {
      disciplineKey = defaultDisciplineForGender(sexo);
    }
    loadSheet();
  });
  form.addEventListener('submit', onAddAthlete);
  sortBtn.addEventListener('click', onSortClick);
  exportBtn.addEventListener('click', onExportClick);
  resultsContainer.addEventListener('change', onCellChange);
  resultsContainer.addEventListener('click', onRemoveClick);

  disciplineKey = pickInitialDiscipline();
  syncSexoWithDiscipline();
  loadSheet();

  function loadSheet() {
    buildDisciplineOptions();
    sexoSelect.value = sexo;
    state.athletes = loadAthletes();
    buildHeader();
    render();
  }

  function buildDisciplineOptions() {
    disciplineSelect.innerHTML = '';
    disciplineNames().forEach((name) => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      disciplineSelect.appendChild(opt);
    });
    disciplineSelect.value = disciplineKey;
  }

  function onAddAthlete(e) {
    e.preventDefault();
    const name = form.name.value.trim();
    const club = form.club.value.trim();
    if (!name) return;

    state.athletes.push({ id: newId(), name, club, marks: {}, manual: {}, rank: null });
    form.reset();
    saveAthletes();
    render();
  }

  function onCellChange(e) {
    const manualCheckbox = e.target.closest('input[data-manual-code]');
    if (manualCheckbox) {
      const athlete = findAthleteFromEl(manualCheckbox);
      if (!athlete) return;
      athlete.manual = athlete.manual || {};
      athlete.manual[manualCheckbox.dataset.manualCode] = manualCheckbox.checked;
      clearRanks();
      saveAthletes();
      render();
      return;
    }

    const attemptInput = e.target.closest('input[data-attempt]');
    if (attemptInput) {
      const athlete = findAthleteFromEl(attemptInput);
      if (!athlete) return;
      const code = attemptInput.dataset.eventCode;
      const idx = Number(attemptInput.dataset.attempt);
      const current = Array.isArray(athlete.marks[code]) ? athlete.marks[code].slice() : ['', '', ''];
      current[idx] = attemptInput.value;
      athlete.marks[code] = current;
      clearRanks();
      saveAthletes();
      render();
      return;
    }

    const input = e.target.closest('input[data-event-code]');
    if (!input) return;
    const athlete = findAthleteFromEl(input);
    if (!athlete) return;
    athlete.marks[input.dataset.eventCode] = input.value;
    clearRanks();
    saveAthletes();
    render();
  }

  function onRemoveClick(e) {
    const btn = e.target.closest('button[data-action="remove"]');
    if (!btn) return;
    const athlete = findAthleteFromEl(btn);
    if (!athlete) return;
    state.athletes = state.athletes.filter((a) => a.id !== athlete.id);
    clearRanks();
    saveAthletes();
    render();
  }

  function findAthleteFromEl(el) {
    const holder = el.closest('[data-id]');
    if (!holder) return null;
    return state.athletes.find((a) => a.id === holder.dataset.id) || null;
  }

  function onSortClick() {
    state.athletes = rankAthletes(state.athletes, EVENTS);
    saveAthletes();
    render();
  }

  // ---- Exportar a Excel ----
  // Arma un .xlsx prolijo (bordes, colores, encabezado tipo planilla de
  // papel) con los datos actuales, para repartir a los demas profesores.
  // No toca el orden en pantalla: exporta siempre ordenado por puntaje,
  // aunque en la pantalla todavia no se haya apretado "Ordenar".
  const COLOR = {
    title: 'FF1F4E78',
    headerFill: 'FFEEF0E8',
    pjeFill: 'FFFFE9A8',
    mmFill: 'FFFFF6DF',
    totalFill: 'FFC9E6C9',
    border: 'FF999999',
  };

  function thinBorder() {
    const side = { style: 'thin', color: { argb: COLOR.border } };
    return { top: side, left: side, bottom: side, right: side };
  }

  function styleCell(cell, opts) {
    opts = opts || {};
    cell.border = thinBorder();
    cell.alignment = { vertical: 'middle', horizontal: opts.align || 'center', wrapText: !!opts.wrap };
    cell.font = { bold: !!opts.bold, size: opts.size || 10 };
    if (opts.fill) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opts.fill } };
    }
  }

  function buildEventColumns(codes) {
    // Una entrada por columna de datos (sin contar Nombre/Institucion/Total/Puesto).
    const cols = [];
    codes.forEach((code) => {
      const event = EVENTS[code];
      if (event.threeAttempts) {
        cols.push({ code, event, kind: 'attempt', attemptIndex: 0, groupSpan: 3 });
        cols.push({ code, event, kind: 'attempt', attemptIndex: 1 });
        cols.push({ code, event, kind: 'attempt', attemptIndex: 2 });
        cols.push({ code, event, kind: 'mm' });
        cols.push({ code, event, kind: 'pje' });
      } else {
        cols.push({ code, event, kind: 'mark', groupSpan: 1 });
        cols.push({ code, event, kind: 'pje' });
      }
    });
    return cols;
  }

  async function onExportClick() {
    if (typeof ExcelJS === 'undefined') {
      alert('No se pudo cargar la libreria para generar el Excel. Revisa tu conexion a internet e intenta de nuevo.');
      return;
    }

    const codes = eventCodes();
    const eventCols = buildEventColumns(codes);
    const firstEventCol = 3; // A=Nombre, B=Institucion
    const lastEventCol = firstEventCol + eventCols.length - 1;
    const totalCol = lastEventCol + 1;
    const puestoCol = totalCol + 1;
    const lastCol = puestoCol;

    const ranked = rankAthletes(state.athletes, EVENTS);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Planilla', { views: [{ state: 'frozen', ySplit: 5 }] });

    // Fila 1: titulo.
    ws.mergeCells(1, 1, 1, lastCol);
    const titleCell = ws.getCell(1, 1);
    titleCell.value = {
      richText: [
        { text: 'PLANILLA DE COMPETICION ', font: { bold: true, size: 13, color: { argb: COLOR.title } } },
        { text: orgInput.value || '', font: { bold: true, size: 13, color: { argb: 'FF000000' } } },
      ],
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Fila 2: Torneo.
    ws.mergeCells(2, 1, 2, 2);
    styleCell(ws.getCell(2, 1), { bold: true, align: 'left' });
    ws.getCell(2, 1).value = 'TORNEO:';
    ws.mergeCells(2, 3, 2, lastCol);
    styleCell(ws.getCell(2, 3), { align: 'left' });
    ws.getCell(2, 3).value = torneoInput.value || '';

    // Fila 3: Prueba / Cat / Sexo.
    const thirdA = firstEventCol;
    const thirdB = firstEventCol + Math.ceil(eventCols.length / 3);
    const thirdC = firstEventCol + Math.ceil((2 * eventCols.length) / 3);
    ws.mergeCells(3, 1, 3, thirdA - 1);
    styleCell(ws.getCell(3, 1), { bold: true, align: 'left' });
    ws.getCell(3, 1).value = `PRUEBA: ${disciplineKey}`;
    ws.mergeCells(3, thirdA, 3, thirdB - 1);
    styleCell(ws.getCell(3, thirdA), { bold: true, align: 'left' });
    ws.getCell(3, thirdA).value = `CAT: ${category().label}`;
    ws.mergeCells(3, thirdB, 3, lastCol);
    styleCell(ws.getCell(3, thirdB), { bold: true, align: 'left' });
    ws.getCell(3, thirdB).value = `SEXO: ${sexoLabel()}`;

    // Filas 4-5: encabezado de columnas.
    ws.mergeCells(4, 1, 5, 1);
    styleCell(ws.getCell(4, 1), { bold: true, fill: COLOR.headerFill });
    ws.getCell(4, 1).value = 'NOMBRE Y APELLIDO';
    ws.mergeCells(4, 2, 5, 2);
    styleCell(ws.getCell(4, 2), { bold: true, fill: COLOR.headerFill });
    ws.getCell(4, 2).value = 'INSTITUCION';
    ws.mergeCells(4, firstEventCol, 4, lastEventCol);
    styleCell(ws.getCell(4, firstEventCol), { bold: true, fill: COLOR.headerFill });
    ws.getCell(4, firstEventCol).value = 'PRUEBAS';
    ws.mergeCells(4, totalCol, 5, totalCol);
    styleCell(ws.getCell(4, totalCol), { bold: true, fill: COLOR.totalFill });
    ws.getCell(4, totalCol).value = 'TOTAL';
    ws.mergeCells(4, puestoCol, 5, puestoCol);
    styleCell(ws.getCell(4, puestoCol), { bold: true, fill: COLOR.headerFill });
    ws.getCell(4, puestoCol).value = 'PUESTO';

    let col = firstEventCol;
    codes.forEach((code) => {
      const event = EVENTS[code];
      const label = event.short || event.name;
      if (event.threeAttempts) {
        ws.mergeCells(5, col, 5, col + 2);
        styleCell(ws.getCell(5, col), { bold: true, fill: COLOR.headerFill });
        ws.getCell(5, col).value = label;
        styleCell(ws.getCell(5, col + 3), { bold: true, fill: COLOR.mmFill });
        ws.getCell(5, col + 3).value = 'MM';
        styleCell(ws.getCell(5, col + 4), { bold: true, fill: COLOR.pjeFill });
        ws.getCell(5, col + 4).value = 'PJE';
        col += 5;
      } else {
        styleCell(ws.getCell(5, col), { bold: true, fill: COLOR.headerFill });
        ws.getCell(5, col).value = label;
        styleCell(ws.getCell(5, col + 1), { bold: true, fill: COLOR.pjeFill });
        ws.getCell(5, col + 1).value = 'PJE';
        col += 2;
      }
    });

    // Filas de atletas.
    let rowIdx = 6;
    ranked.forEach((athlete) => {
      const row = rowIdx++;
      styleCell(ws.getCell(row, 1), { align: 'left' });
      ws.getCell(row, 1).value = athlete.name || '';
      styleCell(ws.getCell(row, 2), { align: 'left' });
      ws.getCell(row, 2).value = athlete.club || '';

      let c = firstEventCol;
      codes.forEach((code) => {
        const event = EVENTS[code];
        if (event.threeAttempts) {
          const attempts = attemptsOf(athlete, code);
          for (let i = 0; i < 3; i++) {
            styleCell(ws.getCell(row, c));
            ws.getCell(row, c).value = attempts[i] || '';
            c++;
          }
          const best = athlete.bestMarks ? athlete.bestMarks[code] : null;
          styleCell(ws.getCell(row, c), { fill: COLOR.mmFill });
          ws.getCell(row, c).value = best != null ? formatMark(best) : '';
          c++;
          styleCell(ws.getCell(row, c), { fill: COLOR.pjeFill, bold: true });
          ws.getCell(row, c).value = pointsText(athlete, code) || '';
          c++;
        } else {
          styleCell(ws.getCell(row, c));
          ws.getCell(row, c).value = athlete.marks[code] || '';
          c++;
          styleCell(ws.getCell(row, c), { fill: COLOR.pjeFill, bold: true });
          ws.getCell(row, c).value = pointsText(athlete, code) || '';
          c++;
        }
      });

      styleCell(ws.getCell(row, totalCol), { fill: COLOR.totalFill, bold: true });
      ws.getCell(row, totalCol).value = athlete.total != null ? athlete.total : '';
      styleCell(ws.getCell(row, puestoCol), { bold: true });
      ws.getCell(row, puestoCol).value = athlete.rank != null ? athlete.rank : '';
    });

    if (ranked.length === 0) {
      // Al menos una fila vacia con el formato, para que no quede una tabla sin bordes.
      for (let c = 1; c <= lastCol; c++) styleCell(ws.getCell(rowIdx, c));
      rowIdx++;
    }

    // Firmas, igual que en la planilla de papel.
    const signRow = rowIdx + 2;
    const third = Math.max(1, Math.floor(lastCol / 3));
    const signSpans = [
      [1, third],
      [third + 1, third * 2],
      [third * 2 + 1, lastCol],
    ];
    signSpans.forEach(([from, to]) => {
      ws.mergeCells(signRow, from, signRow, to);
      const cell = ws.getCell(signRow, from);
      cell.value = '_________________________________';
      cell.alignment = { horizontal: 'center' };
      ws.mergeCells(signRow + 1, from, signRow + 1, to);
      const label = ws.getCell(signRow + 1, from);
      label.value = 'FIRMA Y ACLARACION JUEZ';
      label.alignment = { horizontal: 'center' };
      label.font = { size: 9 };
    });

    // Anchos de columna.
    ws.getColumn(1).width = 24;
    ws.getColumn(2).width = 18;
    for (let c = firstEventCol; c <= lastEventCol; c++) ws.getColumn(c).width = 8;
    ws.getColumn(totalCol).width = 9;
    ws.getColumn(puestoCol).width = 9;

    const fileName = `Planilla_${categoryKey}_${disciplineKey}_${sexoLabel()}`
      .replace(/[^a-zA-Z0-9_]+/g, '_')
      .replace(/_+/g, '_');

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Al cambiar marcas o cargar/quitar atletas, el orden y el puesto quedan
  // desactualizados: se limpian y se muestran de nuevo recien al ordenar,
  // para no mover filas mientras se esta cargando una marca.
  function clearRanks() {
    state.athletes.forEach((a) => {
      a.rank = null;
    });
  }

  // ---- Tabla (desktop) ----
  function buildHeader() {
    const codes = eventCodes();
    const subCols = codes.reduce((sum, code) => sum + (EVENTS[code].threeAttempts ? 5 : 2), 0);

    const row1 = document.createElement('tr');
    row1.appendChild(th('ATLETA', { rowspan: 2 }));
    row1.appendChild(th('INST.', { rowspan: 2 }));
    row1.appendChild(th('PRUEBAS', { colspan: subCols }));
    row1.appendChild(th('TOTAL', { rowspan: 2 }));
    row1.appendChild(th('PUESTO', { rowspan: 2 }));
    row1.appendChild(th('', { rowspan: 2 }));

    const row2 = document.createElement('tr');
    codes.forEach((code) => {
      const event = EVENTS[code];
      const label = event.short || event.name;
      if (event.threeAttempts) {
        row2.appendChild(th(label, { colspan: 3 }));
        row2.appendChild(th('MM', { className: 'pje-head' }));
        row2.appendChild(th('PJE', { className: 'pje-head' }));
      } else {
        row2.appendChild(th(label));
        row2.appendChild(th('PJE', { className: 'pje-head' }));
      }
    });

    theadEl.innerHTML = '';
    theadEl.appendChild(row1);
    theadEl.appendChild(row2);
  }

  function th(text, opts) {
    const el = document.createElement('th');
    el.textContent = text;
    if (opts) {
      if (opts.rowspan) el.rowSpan = opts.rowspan;
      if (opts.colspan) el.colSpan = opts.colspan;
      if (opts.className) el.className = opts.className;
    }
    return el;
  }

  function td(text, className) {
    const el = document.createElement('td');
    el.textContent = text;
    if (className) el.className = className;
    return el;
  }

  function render() {
    // Recalcula puntos/total con las marcas actuales pero SIN reordenar filas:
    // el orden solo cambia cuando se aprieta "Ordenar" (onSortClick).
    const results = computeResultsInOrder(state.athletes, EVENTS);
    results.forEach((result) => {
      const athlete = state.athletes.find((a) => a.id === result.id);
      if (athlete) result.rank = athlete.rank ?? null;
    });

    const codes = eventCodes();
    renderTable(results, codes);
    renderCards(results, codes);
  }

  function renderTable(results, codes) {
    tableBody.innerHTML = '';

    results.forEach((athlete) => {
      const tr = document.createElement('tr');
      tr.dataset.id = athlete.id;

      tr.appendChild(td(athlete.name));
      tr.appendChild(td(athlete.club || ''));

      codes.forEach((code) => {
        const event = EVENTS[code];
        if (event.threeAttempts) {
          const attempts = attemptsOf(athlete, code);
          for (let i = 0; i < 3; i++) {
            const cell = document.createElement('td');
            cell.className = 'mark-cell attempt-cell';
            cell.appendChild(attemptInputEl(code, i, attempts[i], event));
            tr.appendChild(cell);
          }
          const best = athlete.bestMarks ? athlete.bestMarks[code] : null;
          tr.appendChild(td(best != null ? formatMark(best) : '', 'mm-cell'));
          tr.appendChild(td(pointsText(athlete, code), 'pje-cell'));
        } else {
          const cell = document.createElement('td');
          cell.className = 'mark-cell';
          cell.appendChild(markInputEl(code, athlete.marks[code], event));
          if (event.manualAdjustment || event.manualBreakpoints) cell.appendChild(manualToggleEl(code, athlete, event));
          tr.appendChild(cell);
          tr.appendChild(td(pointsText(athlete, code), 'pje-cell'));
        }
      });

      tr.appendChild(td(athlete.total ?? '-', 'total-cell'));
      tr.appendChild(td(athlete.rank ?? '-', 'puesto-cell'));

      const actionsCell = document.createElement('td');
      actionsCell.appendChild(removeButtonEl());
      tr.appendChild(actionsCell);

      tableBody.appendChild(tr);
    });
  }

  function renderCards(results, codes) {
    cardsWrap.innerHTML = '';

    results.forEach((athlete) => {
      const card = document.createElement('div');
      card.className = 'athlete-card';
      card.dataset.id = athlete.id;

      const head = document.createElement('div');
      head.className = 'card-head';
      const nameEl = document.createElement('div');
      nameEl.className = 'card-name';
      nameEl.textContent = athlete.name;
      const clubEl = document.createElement('div');
      clubEl.className = 'card-club';
      clubEl.textContent = athlete.club || '';
      head.appendChild(nameEl);
      head.appendChild(clubEl);
      head.appendChild(removeButtonEl());
      card.appendChild(head);

      codes.forEach((code) => {
        const event = EVENTS[code];
        const group = document.createElement('div');
        group.className = 'card-event';

        const label = document.createElement('div');
        label.className = 'card-event-label';
        label.textContent = event.name;
        group.appendChild(label);

        if (event.threeAttempts) {
          const attempts = attemptsOf(athlete, code);
          const attemptsRow = document.createElement('div');
          attemptsRow.className = 'card-attempts-row';
          for (let i = 0; i < 3; i++) {
            const input = attemptInputEl(code, i, attempts[i], event);
            input.placeholder = `Int. ${i + 1}`;
            attemptsRow.appendChild(input);
          }
          group.appendChild(attemptsRow);

          const best = athlete.bestMarks ? athlete.bestMarks[code] : null;
          const info = document.createElement('div');
          info.className = 'card-event-info';
          info.textContent = `Mejor: ${best != null ? formatMark(best) : '-'}  ·  Pts: ${pointsText(athlete, code) || '-'}`;
          group.appendChild(info);
        } else {
          const row = document.createElement('div');
          row.className = 'card-single-row';
          row.appendChild(markInputEl(code, athlete.marks[code], event));
          if (event.manualAdjustment || event.manualBreakpoints) row.appendChild(manualToggleEl(code, athlete, event));
          const pts = document.createElement('span');
          pts.className = 'card-pts';
          const p = pointsText(athlete, code);
          pts.textContent = p !== '' ? `${p} pts` : '';
          row.appendChild(pts);
          group.appendChild(row);
        }

        card.appendChild(group);
      });

      const footer = document.createElement('div');
      footer.className = 'card-footer';
      const totalEl = document.createElement('span');
      totalEl.textContent = `Total: ${athlete.total ?? '-'}`;
      const puestoEl = document.createElement('span');
      puestoEl.textContent = `Puesto: ${athlete.rank ?? '-'}`;
      footer.appendChild(totalEl);
      footer.appendChild(puestoEl);
      card.appendChild(footer);

      cardsWrap.appendChild(card);
    });
  }

  // ---- helpers de celdas/inputs compartidos por tabla y tarjetas ----
  function attemptsOf(athlete, code) {
    const raw = athlete.marks[code];
    if (Array.isArray(raw)) return raw;
    return raw ? [raw, '', ''] : ['', '', ''];
  }

  function pointsText(athlete, code) {
    const points = athlete.detail ? athlete.detail[code] : null;
    return points != null ? String(points) : '';
  }

  function markInputEl(code, value, event) {
    const input = document.createElement('input');
    input.type = 'text';
    input.inputMode = 'decimal';
    input.dataset.eventCode = code;
    input.value = value || '';
    input.title = event.note;
    return input;
  }

  function attemptInputEl(code, index, value, event) {
    const input = document.createElement('input');
    input.type = 'text';
    input.inputMode = 'decimal';
    input.dataset.eventCode = code;
    input.dataset.attempt = String(index);
    input.value = value || '';
    input.title = event.note;
    return input;
  }

  function manualToggleEl(code, athlete, event) {
    const label = document.createElement('label');
    label.className = 'manual-toggle';
    label.title = event.manualAdjustment
      ? `Tiempo manual: suma ${event.manualAdjustment}s antes de puntuar`
      : 'Tiempo tomado a mano (usa la tabla de puntos para cronometraje manual)';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.manualCode = code;
    checkbox.checked = !!(athlete.manual && athlete.manual[code]);
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(' manual'));
    return label;
  }

  function removeButtonEl() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.action = 'remove';
    btn.className = 'remove-btn';
    btn.textContent = 'Quitar';
    return btn;
  }
})();
