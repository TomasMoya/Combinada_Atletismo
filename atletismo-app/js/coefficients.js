/**
 * Tabla de coeficientes de puntaje por prueba.
 *
 * En vez de guardar un puntaje para cada marca posible (lo cual requeriria
 * miles de filas por prueba y se volveria inmanejable al sumar categorias),
 * cada prueba se define por los 3 coeficientes (a, b, c) de una parabola
 * ajustada estadisticamente a la tabla oficial:
 *
 *   puntos = max(0, round(a * marca^2 + b * marca + c))
 *
 * Agregar una categoria nueva (U14, U18, Mayores, etc.) es simplemente
 * agregar sus pruebas aca con sus propios coeficientes: no hay que tocar
 * la logica de calculo en scoring.js.
 *
 * Coeficientes extraidos de la hoja "Coef_U16" de la planilla original.
 */

// type: 'carrera' -> menor marca = mejor (tiempo). 'campo' -> mayor marca = mejor (metros).
// threeAttempts: true en lanzamientos y salto largo/triple -> se cargan 3 intentos
// y cuenta el mejor (regla de atletismo). Alto y garrocha NO llevan intentos: son
// una sola marca (progresion de altura). Las carreras tampoco.
const EVENTS = {
  M_80: {
    code: 'M_80', category: 'U16', gender: 'M', name: '80 m', short: '80 M',
    unit: 'segundos', type: 'carrera',
    a: 24.121639063477687, b: -655.3465934180733, c: 5130.5884111348905,
    note: 'Ingresar tiempo en segundos, ej: 10.04',
  },
  M_Largo: {
    code: 'M_Largo', category: 'U16', gender: 'M', name: 'Largo', short: 'S.L.',
    unit: 'metros', type: 'campo', threeAttempts: true,
    a: 14.470137005958064, b: 45.46832797683981, c: -206.930827804136,
    note: 'Marca en metros, ej: 5.80',
  },
  M_Bala: {
    code: 'M_Bala', category: 'U16', gender: 'M', name: 'Bala', short: 'BALA',
    unit: 'metros', type: 'campo', threeAttempts: true,
    a: 0.1990403371328799, b: 56.01009946249921, c: -94.41645309937111,
    note: 'Marca en metros.',
  },
  M_Alto: {
    code: 'M_Alto', category: 'U16', gender: 'M', name: 'Alto', short: 'S.A.',
    unit: 'metros', type: 'campo',
    a: 213.93305534489085, b: 92.07683105248084, c: -230.87269935395614,
    note: 'Marca en metros.',
  },
  M_110V: {
    code: 'M_110V', category: 'U16', gender: 'M', name: '110 c/v', short: '110CV',
    unit: 'segundos', type: 'carrera',
    a: 4.243618558623205, b: -248.6148679934488, c: 3624.247750696649,
    note: 'Ingresar tiempo en segundos.',
  },
  M_Garrocha: {
    code: 'M_Garrocha', category: 'U16', gender: 'M', name: 'Garrocha', short: 'GAR',
    unit: 'metros', type: 'campo',
    a: 29.862198106779562, b: 69.03742230450032, c: -117.35748533819282,
    note: 'Marca en metros.',
  },
  M_Jabalina: {
    code: 'M_Jabalina', category: 'U16', gender: 'M', name: 'Jabalina', short: 'JABA',
    unit: 'metros', type: 'campo', threeAttempts: true,
    a: 0.02769734390380821, b: 12.385451469712416, c: -97.48064741695292,
    note: 'Marca en metros.',
  },
  M_1000: {
    code: 'M_1000', category: 'U16', gender: 'M', name: '1000 m', short: '1000M',
    unit: 'segundos', type: 'carrera',
    a: 0.03444958647229679, b: -22.222626021811937, c: 3548.2088734160784,
    note: 'Ingresar en segundos o mm:ss.cc, ej: 3:20.00 o 200.00',
  },
  F_80V: {
    code: 'F_80V', category: 'U16', gender: 'F', name: '80 c/v', short: '80CV',
    unit: 'segundos', type: 'carrera',
    a: 5.359912032841859, b: -256.21256661739204, c: 3213.2155115485316,
    note: 'Ingresar tiempo en segundos.',
  },
  F_Alto: {
    code: 'F_Alto', category: 'U16', gender: 'F', name: 'Alto', short: 'S.A.',
    unit: 'metros', type: 'campo',
    a: 308.1020240375096, b: 197.9052965457122, c: -369.0547392471005,
    note: 'Marca en metros.',
  },
  F_Bala: {
    code: 'F_Bala', category: 'U16', gender: 'F', name: 'Bala', short: 'BALA',
    unit: 'metros', type: 'campo', threeAttempts: true,
    a: 0.2813255597097135, b: 60.06900243643719, c: -99.12109944925989,
    note: 'Marca en metros.',
  },
  F_Largo: {
    code: 'F_Largo', category: 'U16', gender: 'F', name: 'Largo', short: 'S.L.',
    unit: 'metros', type: 'campo', threeAttempts: true,
    a: 26.434056039457673, b: 14.605323385679329, c: -173.23218569788702,
    note: 'Marca en metros.',
  },
  F_Jabalina: {
    code: 'F_Jabalina', category: 'U16', gender: 'F', name: 'Jabalina', short: 'JABA',
    unit: 'metros', type: 'campo', threeAttempts: true,
    a: 0.017843121426040973, b: 17.787041660536655, c: -73.55471199898304,
    note: 'Marca en metros.',
  },
  F_600: {
    code: 'F_600', category: 'U16', gender: 'F', name: '600 m', short: '600M',
    unit: 'segundos', type: 'carrera',
    a: 0.04038220259001901, b: -20.1177184433746, c: 2350.2626895675494,
    note: 'Ingresar en segundos o mm:ss.cc, ej: 1:54.89 o 114.89',
  },
};

// Una categoria agrupa las disciplinas combinadas que le corresponden a cada sexo.
// Para sumar una categoria nueva: agregar sus EVENTS arriba y una entrada aca.
const CATEGORIES = {
  U16: {
    label: 'U16',
    disciplines: {
      'Octatlon Masculino': {
        gender: 'M',
        eventCodes: ['M_80', 'M_Largo', 'M_Bala', 'M_Alto', 'M_110V', 'M_Garrocha', 'M_Jabalina', 'M_1000'],
      },
      'Hexatlon Femenino': {
        gender: 'F',
        eventCodes: ['F_80V', 'F_Alto', 'F_Bala', 'F_Largo', 'F_Jabalina', 'F_600'],
      },
    },
  },
};
