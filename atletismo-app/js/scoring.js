/**
 * Logica de puntaje. No depende del DOM: se puede probar aparte (ver test.js).
 */

/**
 * Convierte una marca de tiempo ingresada como texto a segundos.
 * Soporta:
 *   "10.04"        -> 10.04 (segundos con decimales, uso normal para pruebas < 1 min)
 *   "200.00"       -> 200.00 (segundos, forma recomendada para 600/1000 m)
 *   "3:20.00"      -> 200.00 (min:seg.centesimas)
 *   "3.20.00"      -> 200.00 (min.seg.centesimas, notacion alternativa)
 *   "3:20"         -> 200 (min:seg sin centesimas)
 *   "10,04"        -> 10.04 (coma decimal en español)
 */
function parseTimeToSeconds(raw) {
  if (typeof raw === 'number') return raw;
  if (raw == null) return null;

  const str = String(raw).trim().replace(',', '.');
  if (str === '') return null;

  const hasColon = str.includes(':');
  const parts = str.split(/[:.]/).filter((p) => p !== '');

  if (parts.length === 3) {
    const [min, sec, cs] = parts;
    return Number(min) * 60 + Number(sec) + Number(cs) / Math.pow(10, cs.length);
  }
  if (parts.length === 2 && hasColon) {
    const [min, sec] = parts;
    return Number(min) * 60 + Number(sec);
  }

  const value = parseFloat(str);
  return Number.isNaN(value) ? null : value;
}

/** Convierte una marca de distancia (metros) ingresada como texto a numero. */
function parseDistance(raw) {
  if (typeof raw === 'number') return raw;
  if (raw == null) return null;
  const str = String(raw).trim().replace(',', '.');
  if (str === '') return null;
  const value = parseFloat(str);
  return Number.isNaN(value) ? null : value;
}

/** Parsea una marca cruda segun el tipo de prueba (carrera o campo). */
function parseMark(event, rawMark) {
  return event.type === 'carrera' ? parseTimeToSeconds(rawMark) : parseDistance(rawMark);
}

/**
 * Interpola linealmente los puntos de una marca sobre una tabla de quiebres
 * [ [marca, puntos], ... ] ordenada ascendente por marca. Fuera del rango de
 * la tabla, devuelve el valor del extremo mas cercano (no extrapola).
 */
function interpolateBreakpoints(breakpoints, mark) {
  const last = breakpoints.length - 1;
  if (mark <= breakpoints[0][0]) return breakpoints[0][1];
  if (mark >= breakpoints[last][0]) return breakpoints[last][1];

  for (let i = 0; i < last; i++) {
    const [m0, p0] = breakpoints[i];
    const [m1, p1] = breakpoints[i + 1];
    if (mark >= m0 && mark <= m1) {
      const t = (mark - m0) / (m1 - m0);
      return Math.round(p0 + t * (p1 - p0));
    }
  }
  return null;
}

/**
 * Formula oficial IAAF de pruebas combinadas:
 *   Pista:    P = a * (b - T)^c   (T = tiempo en segundos)
 *   Salto:    P = a * (M - b)^c   (M = marca en CENTIMETROS)
 *   Lanz.:    P = a * (D - b)^c   (D = marca en metros)
 * El resultado se trunca hacia abajo (Math.floor), no se redondea.
 * Si el tiempo fue tomado a mano (manual), se le suma el ajuste de la
 * prueba (event.manualAdjustment) antes de calcular.
 */
function computeIaafPoints(event, mark, manual) {
  let x = mark;
  if (manual && event.manualAdjustment) {
    x = mark + event.manualAdjustment;
  }
  if (event.iaafKind === 'distance_cm') {
    x = x * 100;
  }

  const diff = event.iaafKind === 'time' ? event.b - x : x - event.b;
  if (diff <= 0) return 0;

  const raw = event.a * Math.pow(diff, event.c);
  return Math.max(0, Math.floor(raw));
}

/**
 * Calcula los puntos a partir de una marca YA convertida a numero (segundos o
 * metros). Tres formas de puntuar segun la prueba:
 *   - scoringType 'formula' (default, U16): puntos = max(0, round(a*marca^2 + b*marca + c))
 *   - scoringType 'table' (U10/U12/U14): interpola sobre event.breakpoints
 *   - scoringType 'iaaf' (U18/U20/Mayores): formula oficial de combinadas, ver computeIaafPoints
 * Si la prueba tiene event.manualBreakpoints (p. ej. 800m varones U14, que
 * trae una tabla propia para cronometraje a mano) y el atleta tiene el
 * tilde "manual" marcado, se interpola sobre esa tabla en vez de la
 * automatica/electronica.
 */
function computePointsFromMark(event, mark, manual) {
  if (mark == null || Number.isNaN(mark)) return null;

  if (event.scoringType === 'table') {
    const breakpoints = manual && event.manualBreakpoints ? event.manualBreakpoints : event.breakpoints;
    return Math.max(0, interpolateBreakpoints(breakpoints, mark));
  }

  if (event.scoringType === 'iaaf') {
    return computeIaafPoints(event, mark, manual);
  }

  const raw = event.a * mark * mark + event.b * mark + event.c;
  return Math.max(0, Math.round(raw));
}

/**
 * Calcula los puntos de una marca cruda (texto ingresado) para una prueba.
 * Devuelve null si la marca esta vacia o no es valida.
 */
function computePoints(event, rawMark, manual) {
  const mark = parseMark(event, rawMark);
  return computePointsFromMark(event, mark, manual);
}

/**
 * Pruebas con 3 intentos (lanzamientos y salto largo/triple, ver
 * event.threeAttempts): cuenta el mejor de los intentos validos. Como estas
 * pruebas son siempre de tipo 'campo' (mayor marca = mejor), el mejor
 * intento es simplemente el numero mas alto.
 * attempts es un array de hasta 3 strings, p.ej. ['5.20','','5.35'].
 * Devuelve el mejor valor numerico, o null si no hay ningun intento valido.
 */
function bestAttemptMark(event, attempts) {
  // Acepta tambien una marca suelta (string) como intento unico, por
  // compatibilidad con datos guardados antes de que la prueba tuviera
  // 3 intentos.
  const list = Array.isArray(attempts) ? attempts : [attempts];
  let best = null;
  for (const raw of list) {
    if (raw === '' || raw == null) continue;
    const value = parseMark(event, raw);
    if (value == null || Number.isNaN(value)) continue;
    if (best == null || value > best) best = value;
  }
  return best;
}

/**
 * Calcula el detalle por prueba y el total de un atleta.
 * athlete.marks es un objeto { eventCode: '10.04' | ['5.20','5.35','5.10'] }:
 * string para pruebas normales, array de hasta 3 marcas para las que tienen
 * threeAttempts (ver event.threeAttempts en coefficients.js / data-*.js).
 * events es el diccionario EVENTS (o un subconjunto) de coefficients.js
 */
function computeAthleteResult(athlete, events) {
  const detail = {};
  const bestMarks = {};
  let total = 0;
  let hasAnyMark = false;

  for (const code of Object.keys(athlete.marks || {})) {
    const event = events[code];
    const rawMark = athlete.marks[code];
    if (!event) continue;

    let points;
    if (event.threeAttempts) {
      const best = bestAttemptMark(event, rawMark);
      bestMarks[code] = best;
      points = best == null ? null : computePointsFromMark(event, best);
    } else {
      if (rawMark === '' || rawMark == null) continue;
      const manual = !!(athlete.manual && athlete.manual[code]);
      points = computePoints(event, rawMark, manual);
    }

    detail[code] = points;
    if (points != null) {
      total += points;
      hasAnyMark = true;
    }
  }

  return { detail, bestMarks, total: hasAnyMark ? total : null };
}

/**
 * Calcula el detalle y el total de cada atleta SIN reordenar la lista.
 * Se usa para refrescar puntos/total en vivo mientras se cargan marcas,
 * sin mover de lugar la fila que se esta editando.
 */
function computeResultsInOrder(athletes, events) {
  return athletes.map((athlete) => {
    const { detail, bestMarks, total } = computeAthleteResult(athlete, events);
    return { ...athlete, detail, bestMarks, total };
  });
}

/**
 * Ordena atletas por puntaje total descendente y asigna puesto.
 * Empates comparten puesto (ranking de competencia: 1,1,3,... como RANK() de Excel).
 * Atletas sin ninguna marca cargada quedan al final sin puesto.
 * Esto SI reordena la lista: se usa solo cuando el usuario aprieta "Ordenar".
 */
function rankAthletes(athletes, events) {
  const withResults = computeResultsInOrder(athletes, events);

  withResults.sort((a, b) => {
    if (a.total == null && b.total == null) return 0;
    if (a.total == null) return 1;
    if (b.total == null) return -1;
    return b.total - a.total;
  });

  let lastTotal = null;
  let lastRank = 0;
  withResults.forEach((athlete, index) => {
    if (athlete.total == null) {
      athlete.rank = null;
      return;
    }
    if (athlete.total === lastTotal) {
      athlete.rank = lastRank;
    } else {
      athlete.rank = index + 1;
      lastRank = index + 1;
      lastTotal = athlete.total;
    }
  });

  return withResults;
}
