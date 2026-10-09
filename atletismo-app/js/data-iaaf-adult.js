/**
 * Decatlon (varones y mujeres) y Heptatlon (mujeres), formula oficial IAAF
 * de puntaje de pruebas combinadas:
 *
 *   Pista:        P = a * (b - T)^c   (T = tiempo en segundos)
 *   Salto:        P = a * (M - b)^c   (M = marca en CENTIMETROS)
 *   Lanzamiento:  P = a * (D - b)^c   (D = marca en metros)
 *   El resultado se trunca hacia abajo (no se redondea).
 *
 * A diferencia de U16/U10/U12, esta formula es la misma para cualquier edad
 * (no depende de la categoria): por eso los eventos NO se duplican por
 * categoria, se definen una sola vez aca y U18/U20/Mayores comparten los
 * mismos EVENTS. Lo unico que cambia entre categorias es la lista de
 * atletas cargados (cada categoria guarda su propia lista, ver app.js).
 *
 * Para las 5 pruebas del decatlon que tienen coeficientes propios (100m,
 * 400m, 1500m, Garrocha, Disco) se usan los valores de la tabla "(decathlon)"
 * de la fuente; el resto de las pruebas del decatlon (Largo, Bala, Alto,
 * 110mV, Jabalina) toma los valores de la tabla general "MEN'S EVENTS".
 *
 * Tiempo manual: si una carrera se cronometro a mano (no electronico), la
 * regla IAAF exige sumarle un ajuste antes de calcular los puntos (0.24s
 * para pruebas de hasta 400m salvo la propia 400m, que usa 0.14s; sin
 * ajuste para 800m/1500m en adelante). event.manualAdjustment guarda ese
 * valor; solo se aplica si el atleta tiene el tilde "manual" marcado para
 * esa prueba (ver athlete.manual en app.js / scoring.js).
 */

const EVENTS_IAAF = {
  DECA_100M: {
    code: 'DECA_100M', category: 'IAAF', gender: null, name: '100 m', short: '100M',
    unit: 'segundos', type: 'carrera', scoringType: 'iaaf', iaafKind: 'time',
    a: 17.8570, b: 21.0, c: 1.81, manualAdjustment: 0.24,
    note: 'Tiempo en segundos, ej: 11.20',
  },
  DECA_LJ: {
    code: 'DECA_LJ', category: 'IAAF', gender: null, name: 'Salto largo', short: 'S.L.',
    unit: 'metros', type: 'campo', scoringType: 'iaaf', iaafKind: 'distance_cm', threeAttempts: true,
    a: 0.14354, b: 220.00, c: 1.40,
    note: 'Marca en metros, ej: 7.20',
  },
  DECA_SHOT: {
    code: 'DECA_SHOT', category: 'IAAF', gender: null, name: 'Bala', short: 'BALA',
    unit: 'metros', type: 'campo', scoringType: 'iaaf', iaafKind: 'distance_m', threeAttempts: true,
    a: 51.39, b: 1.50, c: 1.05,
    note: 'Marca en metros, ej: 14.50',
  },
  DECA_HJ: {
    code: 'DECA_HJ', category: 'IAAF', gender: null, name: 'Salto en alto', short: 'S.A.',
    unit: 'metros', type: 'campo', scoringType: 'iaaf', iaafKind: 'distance_cm',
    a: 0.8465, b: 75.00, c: 1.42,
    note: 'Marca en metros, ej: 1.95',
  },
  DECA_400M: {
    code: 'DECA_400M', category: 'IAAF', gender: null, name: '400 m', short: '400M',
    unit: 'segundos', type: 'carrera', scoringType: 'iaaf', iaafKind: 'time',
    a: 1.34285, b: 91.7, c: 1.81, manualAdjustment: 0.14,
    note: 'Tiempo en segundos, ej: 49.50',
  },
  DECA_110H: {
    code: 'DECA_110H', category: 'IAAF', gender: null, name: '110 c/v', short: '110CV',
    unit: 'segundos', type: 'carrera', scoringType: 'iaaf', iaafKind: 'time',
    a: 5.74352, b: 28.50, c: 1.92, manualAdjustment: 0.24,
    note: 'Tiempo en segundos, ej: 14.80',
  },
  DECA_DISCUS: {
    code: 'DECA_DISCUS', category: 'IAAF', gender: null, name: 'Disco', short: 'DISC',
    unit: 'metros', type: 'campo', scoringType: 'iaaf', iaafKind: 'distance_m', threeAttempts: true,
    a: 12.3311, b: 3.00, c: 1.10,
    note: 'Marca en metros, ej: 42.00',
  },
  DECA_PV: {
    code: 'DECA_PV', category: 'IAAF', gender: null, name: 'Garrocha', short: 'GAR',
    unit: 'metros', type: 'campo', scoringType: 'iaaf', iaafKind: 'distance_cm',
    a: 0.44125, b: 100, c: 1.35,
    note: 'Marca en metros, ej: 4.20',
  },
  DECA_JAV: {
    code: 'DECA_JAV', category: 'IAAF', gender: null, name: 'Jabalina', short: 'JABA',
    unit: 'metros', type: 'campo', scoringType: 'iaaf', iaafKind: 'distance_m', threeAttempts: true,
    a: 10.14, b: 7.00, c: 1.08,
    note: 'Marca en metros, ej: 55.00',
  },
  DECA_1500M: {
    code: 'DECA_1500M', category: 'IAAF', gender: null, name: '1500 m', short: '1500M',
    unit: 'segundos', type: 'carrera', scoringType: 'iaaf', iaafKind: 'time',
    a: 0.02883, b: 535, c: 1.88,
    note: 'Tiempo en segundos o mm:ss.cc, ej: 4:30.00 o 270.00',
  },

  HEP_100H: {
    code: 'HEP_100H', category: 'IAAF', gender: 'F', name: '100 c/v', short: '100CV',
    unit: 'segundos', type: 'carrera', scoringType: 'iaaf', iaafKind: 'time',
    a: 9.23076, b: 26.70, c: 1.835, manualAdjustment: 0.24,
    note: 'Tiempo en segundos, ej: 14.20',
  },
  HEP_HJ: {
    code: 'HEP_HJ', category: 'IAAF', gender: 'F', name: 'Salto en alto', short: 'S.A.',
    unit: 'metros', type: 'campo', scoringType: 'iaaf', iaafKind: 'distance_cm',
    a: 1.84523, b: 75.00, c: 1.348,
    note: 'Marca en metros, ej: 1.70',
  },
  HEP_SHOT: {
    code: 'HEP_SHOT', category: 'IAAF', gender: 'F', name: 'Bala', short: 'BALA',
    unit: 'metros', type: 'campo', scoringType: 'iaaf', iaafKind: 'distance_m', threeAttempts: true,
    a: 56.0211, b: 1.50, c: 1.05,
    note: 'Marca en metros, ej: 12.50',
  },
  HEP_200M: {
    code: 'HEP_200M', category: 'IAAF', gender: 'F', name: '200 m', short: '200M',
    unit: 'segundos', type: 'carrera', scoringType: 'iaaf', iaafKind: 'time',
    a: 4.99087, b: 42.50, c: 1.81, manualAdjustment: 0.24,
    note: 'Tiempo en segundos, ej: 24.50',
  },
  HEP_LJ: {
    code: 'HEP_LJ', category: 'IAAF', gender: 'F', name: 'Salto largo', short: 'S.L.',
    unit: 'metros', type: 'campo', scoringType: 'iaaf', iaafKind: 'distance_cm', threeAttempts: true,
    a: 0.188807, b: 210.00, c: 1.41,
    note: 'Marca en metros, ej: 6.00',
  },
  HEP_JAV: {
    code: 'HEP_JAV', category: 'IAAF', gender: 'F', name: 'Jabalina', short: 'JABA',
    unit: 'metros', type: 'campo', scoringType: 'iaaf', iaafKind: 'distance_m', threeAttempts: true,
    a: 15.9803, b: 3.80, c: 1.04,
    note: 'Marca en metros, ej: 40.00',
  },
  HEP_800M: {
    code: 'HEP_800M', category: 'IAAF', gender: 'F', name: '800 m', short: '800M',
    unit: 'segundos', type: 'carrera', scoringType: 'iaaf', iaafKind: 'time',
    a: 0.11193, b: 254.00, c: 1.88,
    note: 'Tiempo en segundos o mm:ss.cc, ej: 2:15.00 o 135.00',
  },
};

Object.assign(EVENTS, EVENTS_IAAF);

const IAAF_DISCIPLINES = {
  Decatlon: {
    gender: null,
    eventCodes: ['DECA_100M', 'DECA_LJ', 'DECA_SHOT', 'DECA_HJ', 'DECA_400M',
      'DECA_110H', 'DECA_DISCUS', 'DECA_PV', 'DECA_JAV', 'DECA_1500M'],
  },
  'Heptatlon Femenino': {
    gender: 'F',
    eventCodes: ['HEP_100H', 'HEP_HJ', 'HEP_SHOT', 'HEP_200M', 'HEP_LJ', 'HEP_JAV', 'HEP_800M'],
  },
};

['U18', 'U20', 'Mayores'].forEach((key) => {
  CATEGORIES[key] = { label: key, disciplines: IAAF_DISCIPLINES };
});
