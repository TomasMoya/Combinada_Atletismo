/**
 * Test manual (sin framework): node js/coefficients.js + js/scoring.js + js/test.js
 * Corre con: node --input-type=commonjs -e "..." o simplemente concatenando,
 * ver instrucciones al final del archivo.
 */
const assert = require('assert');

function run() {
  // Caso real de la planilla: 80 m = 10.04 -> 982 pts; Largo = 5.80 -> 544 pts.
  const pts80 = computePoints(EVENTS.M_80, '10.04');
  assert.strictEqual(pts80, 982, `80m deberia dar 982, dio ${pts80}`);

  const ptsLargo = computePoints(EVENTS.M_Largo, '5.8');
  assert.strictEqual(ptsLargo, 544, `Largo deberia dar 544, dio ${ptsLargo}`);

  // Parseo de tiempos en formato minutos.
  assert.strictEqual(parseTimeToSeconds('3:20.00'), 200);
  assert.strictEqual(parseTimeToSeconds('3.20.00'), 200);
  assert.strictEqual(parseTimeToSeconds('1:54.89'), 114.89);
  assert.strictEqual(parseTimeToSeconds('200.00'), 200);
  assert.strictEqual(parseTimeToSeconds('10,04'), 10.04);

  // Marca vacia no debe romper el calculo.
  assert.strictEqual(computePoints(EVENTS.M_80, ''), null);
  assert.strictEqual(computePoints(EVENTS.M_80, null), null);

  // Atleta con marcas parciales.
  const athlete = {
    name: 'Atleta Prueba',
    marks: { M_80: '10.04', M_Largo: '5.8' },
  };
  const result = computeAthleteResult(athlete, EVENTS);
  assert.strictEqual(result.total, 982 + 544, `total deberia ser 1526, dio ${result.total}`);

  // Ranking con empate.
  const ranked = rankAthletes(
    [
      { name: 'A', marks: { M_80: '10.04' } }, // 982
      { name: 'B', marks: { M_80: '10.04' } }, // 982 (empate con A)
      { name: 'C', marks: { M_80: '11.00' } }, // menos puntos
      { name: 'D', marks: {} }, // sin marcas
    ],
    EVENTS
  );
  assert.strictEqual(ranked[0].rank, 1);
  assert.strictEqual(ranked[1].rank, 1);
  assert.strictEqual(ranked[2].rank, 3);
  assert.strictEqual(ranked[3].rank, null);

  // --- U10 / U12 (tablas por interpolacion) ---
  // Valores exactos de la tabla original (excel U10-U12): coinciden con un breakpoint.
  assert.strictEqual(computePoints(EVENTS.U10_60M, '10.0'), 288);
  assert.strictEqual(computePoints(EVENTS.U12_60M, '10.0'), 288);
  assert.strictEqual(computePoints(EVENTS.U10_ALTO, '1.20'), 430);
  assert.strictEqual(computePoints(EVENTS.U10_BALA, '9'), 590);
  assert.strictEqual(computePoints(EVENTS.U10_LARGO, '4'), 500);
  assert.strictEqual(computePoints(EVENTS.U10_SOFTBOL, '26'), 750);
  assert.strictEqual(computePoints(EVENTS.U10_VALLAS64, '13'), 600);

  // Interpolacion entre dos breakpoints: 60m entre 10.0 (288) y 10.1 (285) -> a mitad de camino, 286 o 287.
  const mid = computePoints(EVENTS.U10_60M, '10.05');
  assert.ok(mid === 286 || mid === 287, `interpolacion 10.05 deberia rondar 286/287, dio ${mid}`);

  // Fuera de rango: clampea al extremo, no extrapola.
  assert.strictEqual(computePoints(EVENTS.U10_60M, '5.0'), 350); // mas rapido que el mejor de la tabla
  assert.strictEqual(computePoints(EVENTS.U10_60M, '25.0'), 1); // mas lento que el peor de la tabla

  // U10 y U12 son categorias independientes (duplicadas), no comparten el mismo objeto.
  assert.notStrictEqual(EVENTS.U10_60M, EVENTS.U12_60M);
  assert.notStrictEqual(EVENTS.U10_60M.breakpoints, EVENTS.U12_60M.breakpoints);

  // --- IAAF (Decatlon/Heptatlon, U18/U20/Mayores) ---
  // Ejemplo oficial de la formula (tabla general 100m, no la de decatlon):
  // auto 10.40 -> 999 pts; manual (+0.24s) -> 942 pts.
  const generalMen100m = { type: 'carrera', scoringType: 'iaaf', iaafKind: 'time', a: 25.4347, b: 18.00, c: 1.81, manualAdjustment: 0.24 };
  assert.strictEqual(computePoints(generalMen100m, '10.40'), 999);
  assert.strictEqual(computePoints(generalMen100m, '10.40', true), 942);

  // DECA_100M usa los coeficientes propios de decatlon (distintos a la tabla general).
  assert.strictEqual(computePoints(EVENTS.DECA_100M, '10.40'), 1281);
  // Mismo tiempo pero manual (+0.24s) -> bastante menos puntos.
  const deca100Manual = computePoints(EVENTS.DECA_100M, '10.40', true);
  assert.ok(deca100Manual < 1281, `manual deberia dar menos que 1281, dio ${deca100Manual}`);
  // Sin el tilde manual, el mismo 10.40 vuelve al valor automatico.
  assert.strictEqual(computePoints(EVENTS.DECA_100M, '10.40', false), 1281);

  // Salto (marca en metros, la formula usa centimetros por dentro).
  const ljPts = computePoints(EVENTS.DECA_LJ, '7.20');
  assert.ok(ljPts > 0, `Largo 7.20 deberia dar puntos positivos, dio ${ljPts}`);

  // Marca peor que el minimo de la formula (diff <= 0) -> 0 puntos, no NaN/negativo.
  assert.strictEqual(computePoints(EVENTS.DECA_SHOT, '1.00'), 0);

  // Atleta de heptatlon con tiempo manual en 100mV, via computeAthleteResult.
  const heptAthlete = {
    marks: { HEP_100H: '14.20' },
    manual: { HEP_100H: true },
  };
  const heptResult = computeAthleteResult(heptAthlete, EVENTS);
  const heptAuto = computePoints(EVENTS.HEP_100H, '14.20', false);
  assert.ok(heptResult.detail.HEP_100H < heptAuto, 'el tiempo manual debe dar menos puntos que el mismo tiempo automatico');

  // Las 3 categorias adultas comparten los mismos EVENTS (la formula no depende de la edad).
  assert.strictEqual(CATEGORIES.U18.disciplines.Decatlon, CATEGORIES.U20.disciplines.Decatlon);
  assert.strictEqual(CATEGORIES.Mayores.disciplines.Decatlon.eventCodes.length, 10);
  assert.strictEqual(CATEGORIES.U18.disciplines['Heptatlon Femenino'].eventCodes.length, 7);

  // --- 3 intentos (lanzamientos y salto largo/triple) ---
  // Marca correctas: lanzamientos y largo llevan threeAttempts; alto/garrocha y carreras no.
  assert.strictEqual(EVENTS.M_Bala.threeAttempts, true);
  assert.strictEqual(EVENTS.M_Largo.threeAttempts, true);
  assert.strictEqual(EVENTS.M_Jabalina.threeAttempts, true);
  assert.ok(!EVENTS.M_Alto.threeAttempts, 'Alto NO deberia tener 3 intentos (progresion de altura)');
  assert.ok(!EVENTS.M_Garrocha.threeAttempts, 'Garrocha NO deberia tener 3 intentos');
  assert.ok(!EVENTS.M_80.threeAttempts, 'una carrera no deberia tener 3 intentos');
  assert.strictEqual(EVENTS.U10_BALA.threeAttempts, true);
  assert.strictEqual(EVENTS.DECA_DISCUS.threeAttempts, true);
  assert.strictEqual(EVENTS.HEP_LJ.threeAttempts, true);
  assert.ok(!EVENTS.DECA_HJ.threeAttempts);
  assert.ok(!EVENTS.HEP_HJ.threeAttempts);

  // bestAttemptMark toma el mayor de los 3 intentos (ignora vacios).
  assert.strictEqual(bestAttemptMark(EVENTS.M_Bala, ['10.20', '', '10.55']), 10.55);
  assert.strictEqual(bestAttemptMark(EVENTS.M_Bala, ['', '', '']), null);
  assert.strictEqual(bestAttemptMark(EVENTS.M_Bala, []), null);
  // Compatibilidad: una marca suelta (no array) se toma como intento unico.
  assert.strictEqual(bestAttemptMark(EVENTS.M_Bala, '10.20'), 10.20);

  // Atleta con los 3 intentos de bala cargados: cuenta el mejor (10.55), no el ultimo ni el primero.
  const throwAthlete = { marks: { M_Bala: ['10.20', '10.55', '9.90'] } };
  const throwResult = computeAthleteResult(throwAthlete, EVENTS);
  assert.strictEqual(throwResult.bestMarks.M_Bala, 10.55);
  assert.strictEqual(throwResult.detail.M_Bala, computePoints(EVENTS.M_Bala, '10.55'));
  assert.strictEqual(throwResult.total, throwResult.detail.M_Bala);

  // Si los 3 intentos estan vacios, no cuenta como marca cargada (total null).
  const noAttemptsAthlete = { marks: { M_Bala: ['', '', ''] } };
  const noAttemptsResult = computeAthleteResult(noAttemptsAthlete, EVENTS);
  assert.strictEqual(noAttemptsResult.detail.M_Bala, null);
  assert.strictEqual(noAttemptsResult.total, null);

  // --- U10/U12: pruebas nuevas (1000m ya existia con datos malos y se habia
  // dejado afuera; ahora vino arreglada. 600m es una prueba nueva). ---
  assert.ok(CATEGORIES.U10.disciplines['Combinada Promocional'].eventCodes.includes('U10_1000M'));
  assert.ok(CATEGORIES.U10.disciplines['Combinada Promocional'].eventCodes.includes('U10_600M'));
  assert.strictEqual(CATEGORIES.U10.disciplines['Combinada Promocional'].eventCodes.length, 8);
  // 1000m: "3:27." (fuente) = 3*60+27 = 207s -> 417 pts (primer breakpoint real).
  assert.strictEqual(computePoints(EVENTS.U10_1000M, '207'), 417);
  assert.strictEqual(computePoints(EVENTS.U10_1000M, '3:27'), 417);
  // 600m: "1:45.00" = 105s -> 683 pts.
  assert.strictEqual(computePoints(EVENTS.U10_600M, '105'), 683);
  assert.strictEqual(computePoints(EVENTS.U10_600M, '1:45.00'), 683);

  // --- U14 (categoria que faltaba) ---
  assert.strictEqual(CATEGORIES.U14.disciplines['Octatlon Masculino'].eventCodes.length, 8);
  assert.strictEqual(CATEGORIES.U14.disciplines['Heptatlon Femenino'].eventCodes.length, 7);
  // Valores exactos de la fuente (fila 4 de cada hoja: mejor marca de la tabla).
  assert.strictEqual(computePoints(EVENTS.U14M_80M, '9'), 1186);
  assert.strictEqual(computePoints(EVENTS.U14F_80M, '9'), 1186);
  assert.strictEqual(computePoints(EVENTS.U14M_ALTO, '1.99'), 1402);
  assert.strictEqual(computePoints(EVENTS.U14F_LARGO, '5.69'), 1293);

  // Jabalina U14 varones: la fuente traia la tabla partida en dos columnas
  // que en realidad empalman sin salto (60.00m/1055pts -> 60.05m/1056pts);
  // se unificaron en una sola tabla continua.
  assert.strictEqual(computePoints(EVENTS.U14M_JABALINA, '60.00'), 1055);
  assert.strictEqual(computePoints(EVENTS.U14M_JABALINA, '60.05'), 1056);
  assert.strictEqual(computePoints(EVENTS.U14M_JABALINA, '82.63'), 1500);

  // 800m varones U14: tabla propia para cronometraje manual (no es un ajuste
  // numerico como en IAAF adultos, es otra tabla completa). El tilde
  // "manual" hace que se use event.manualBreakpoints en vez de breakpoints.
  assert.notStrictEqual(EVENTS.U14M_800M.breakpoints, EVENTS.U14M_800M.manualBreakpoints);
  const u14mAuto = computePoints(EVENTS.U14M_800M, '140', false);
  const u14mManual = computePoints(EVENTS.U14M_800M, '140', true);
  assert.notStrictEqual(u14mAuto, u14mManual, 'automatico y manual deberian salir de tablas distintas');
  // Via computeAthleteResult, igual que con el ajuste IAAF.
  const u14Athlete = { marks: { U14M_800M: '140' }, manual: { U14M_800M: true } };
  const u14Result = computeAthleteResult(u14Athlete, EVENTS);
  assert.strictEqual(u14Result.detail.U14M_800M, u14mManual);
  // U14F_800M no tiene tabla manual (la fuente solo trae una para mujeres).
  assert.strictEqual(EVENTS.U14F_800M.manualBreakpoints, undefined);

  console.log('OK: todos los tests de scoring.js pasaron.');
}

run();
