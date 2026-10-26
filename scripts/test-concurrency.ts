import { randomUUID } from 'crypto';
import { DISCIPLINES, SKILLS, INTERESTS } from '../lib/events/constants';

interface ConcurrencyTestReport {
  totalRequested: number;
  successful: number;
  failed: number;
  duplicateRegistrations: number;
  duplicateEdgesDetected: number;
  totalParticipantsInDb: number;
  totalConnectionsInDb: number;
  durationMs: number;
}

const FIRST_NAMES = [
  'Alejandro', 'Sofía', 'Carlos', 'Valeria', 'Mateo', 'Camila', 'Santiago', 'Lucía',
  'Daniel', 'Mariana', 'Diego', 'Elena', 'Emiliano', 'Paula', 'Leonardo', 'Renata',
  'Javier', 'Andrea', 'Fernando', 'Jimena', 'Rodrigo', 'Regina', 'Gabriel', 'Natalia',
  'Ricardo', 'Victoria', 'Sebastián', 'Abril', 'Adrián', 'Miranda', 'Bruno', 'Ivanna',
  'Eduardo', 'Fernanda', 'Mauricio', 'Romina', 'Manuel', 'Alexa', 'Hugo', 'Ximena',
  'Emilio', 'Daniela', 'Ángel', 'Samantha', 'Pablo', 'Paulina', 'Jorge', 'Carolina',
  'David', 'Sara'
];

async function runConcurrencyTest(baseUrl: string = 'http://localhost:3000', concurrentCount = 50): Promise<ConcurrencyTestReport> {
  console.log(`\n======================================================`);
  console.log(`🚀 INICIANDO TEST DE CONCURRENCIA: ${concurrentCount} REGISTROS SIMULTÁNEOS`);
  console.log(`Target: ${baseUrl}`);
  console.log(`======================================================\n`);

  const startTime = Date.now();
  const visitorIds = new Set<string>();

  // Prepare 50 unique participant registration payloads
  const payloads = Array.from({ length: concurrentCount }, (_, i) => {
    const vid = randomUUID();
    visitorIds.add(vid);

    const name = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${String.fromCharCode(65 + (i % 26))}.`;
    const discipline = DISCIPLINES[i % DISCIPLINES.length];

    // Pick 1-3 skills
    const skills = [
      SKILLS[i % SKILLS.length],
      SKILLS[(i + 3) % SKILLS.length],
    ];

    // Pick 1-2 interests
    const interests = [
      INTERESTS[i % INTERESTS.length],
      INTERESTS[(i + 2) % INTERESTS.length],
    ];

    return {
      eventSlug: 'tec-matamoros-2026',
      displayName: name,
      discipline,
      skills,
      interests,
      consent: true,
      visitorId: vid,
    };
  });

  let successful = 0;
  let failed = 0;
  let duplicateRegistrations = 0;

  // Execute all requests concurrently via Promise.all
  console.log(`Enviando ${concurrentCount} peticiones concurrentes...`);
  const promises = payloads.map(async (payload, idx) => {
    try {
      const res = await fetch(`${baseUrl}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        if (json.isExisting) {
          duplicateRegistrations++;
        } else {
          successful++;
        }
      } else {
        console.error(`Petición #${idx} falló:`, json.error);
        failed++;
      }
    } catch (err: unknown) {
      console.error(`Petición #${idx} lanzó excepción:`, err);
      failed++;
    }
  });

  await Promise.all(promises);
  const durationMs = Date.now() - startTime;

  console.log(`\nPeticiones completadas en ${durationMs}ms`);
  console.log(`Verificando integridad en la base de datos...`);

  // Verify database state through GET /api/events/tec-matamoros-2026
  let totalParticipantsInDb = 0;
  let totalConnectionsInDb = 0;
  let duplicateEdgesDetected = 0;

  try {
    const checkRes = await fetch(`${baseUrl}/api/events/tec-matamoros-2026`);
    const checkJson = await checkRes.json();

    if (checkJson.success) {
      totalParticipantsInDb = checkJson.stats.totalBuilders;
      totalConnectionsInDb = checkJson.stats.totalConnections;

      // Check for duplicate edges
      const edgePairs = new Set<string>();
      for (const edge of checkJson.connections) {
        const canonicalKey = `${edge.sourceId}<->${edge.targetId}`;
        if (edgePairs.has(canonicalKey)) {
          duplicateEdgesDetected++;
        } else {
          edgePairs.add(canonicalKey);
        }
      }
    }
  } catch (err) {
    console.error('Error verificando base de datos:', err);
  }

  const report: ConcurrencyTestReport = {
    totalRequested: concurrentCount,
    successful,
    failed,
    duplicateRegistrations,
    duplicateEdgesDetected,
    totalParticipantsInDb,
    totalConnectionsInDb,
    durationMs,
  };

  console.log(`\n======================================================`);
  console.log(`📊 REPORTE DE RESULTADOS DE CONCURRENCIA`);
  console.log(`======================================================`);
  console.log(`Total solicitados:            ${report.totalRequested}`);
  console.log(`Registros exitosos:           ${report.successful}`);
  console.log(`Registros fallidos:           ${report.failed}`);
  console.log(`Registros duplicados:         ${report.duplicateRegistrations}`);
  console.log(`Bordes/conexiones duplicadas: ${report.duplicateEdgesDetected} (debe ser 0)`);
  console.log(`Total participantes en DB:    ${report.totalParticipantsInDb}`);
  console.log(`Total conexiones en DB:       ${report.totalConnectionsInDb}`);
  console.log(`Tiempo total:                 ${report.durationMs}ms (${(report.durationMs / concurrentCount).toFixed(1)}ms/req promedio)`);
  console.log(`======================================================\n`);

  return report;
}

// Allow CLI execution with tsx or node
if (process.argv[1]?.includes('test-concurrency')) {
  const targetUrl = process.env.TEST_URL || 'http://localhost:3000';
  runConcurrencyTest(targetUrl, 50).catch(console.error);
}

export { runConcurrencyTest };
