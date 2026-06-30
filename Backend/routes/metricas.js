// Métricas y gráficas de caballos para el dashboard (admin e instructores).
import express from 'express';
import db from '../server/db.js';

const router = express.Router();

// GET /api/metricas/caballos?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
// Devuelve conteos de estado y series para las gráficas. El rango de fechas
// aplica sólo a las gráficas basadas en reservas (frecuencia y por clase).
router.get('/caballos', async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    // --- Conteos de estado (no dependen del rango) ---
    const [[conteos]] = await db.query(`
      SELECT
        SUM(disponibilidad = 'disponible')        AS disponibles,
        SUM(disponibilidad = 'no_disponible')     AS no_disponibles,
        SUM(estatus = 'renta')                    AS en_renta,
        SUM(estatus = 'media_renta')              AS media_renta,
        SUM(propietario_id IS NOT NULL)           AS con_propietario,
        SUM(estatus = 'publico')                  AS publicos,
        SUM(estatus = 'privado')                  AS privados,
        SUM(disponibilidad = 'no_disponible')     AS no_disponibles_clases,
        COUNT(*)                                  AS total
      FROM caballos
    `);

    // --- Filtro de fechas para las gráficas ---
    const condFechas = [];
    const params = [];
    if (desde) { condFechas.push('r.fecha >= ?'); params.push(desde); }
    if (hasta) { condFechas.push('r.fecha <= ?'); params.push(hasta); }
    const whereFechas = condFechas.length ? `AND ${condFechas.join(' AND ')}` : '';

    // Gráfica 1: caballos que salen con frecuencia (total de salidas por caballo)
    const [frecuencia] = await db.query(`
      SELECT c.id, c.nombre, COUNT(r.id) AS salidas
      FROM caballos c
      LEFT JOIN reservas r ON r.caballo_id = c.id
        AND r.estatus IN ('confirmada','completada') ${whereFechas}
      GROUP BY c.id, c.nombre
      ORDER BY salidas DESC
    `, params);

    // Gráfica 2: caballos que salen más por clase (salidas por caballo + clase)
    const [porClase] = await db.query(`
      SELECT c.id AS caballo_id, c.nombre AS caballo, cl.nombre AS clase,
             COUNT(r.id) AS salidas
      FROM reservas r
      JOIN caballos c ON c.id = r.caballo_id
      JOIN clases cl ON cl.id = r.clase_id
      WHERE r.estatus IN ('confirmada','completada') ${whereFechas}
      GROUP BY c.id, c.nombre, cl.nombre
      ORDER BY salidas DESC
    `, params);

    // Gráfica 3: caballos con propietario
    const [conPropietario] = await db.query(`
      SELECT c.id, c.nombre,
             CONCAT(u.nombre, ' ', u.apellido) AS propietario
      FROM caballos c
      JOIN usuarios u ON u.id = c.propietario_id
      ORDER BY c.nombre ASC
    `);

    res.json({
      conteos: {
        disponibles: Number(conteos.disponibles) || 0,
        no_disponibles: Number(conteos.no_disponibles) || 0,
        en_renta: Number(conteos.en_renta) || 0,
        media_renta: Number(conteos.media_renta) || 0,
        con_propietario: Number(conteos.con_propietario) || 0,
        publicos: Number(conteos.publicos) || 0,
        privados: Number(conteos.privados) || 0,
        no_disponibles_clases: Number(conteos.no_disponibles_clases) || 0,
        total: Number(conteos.total) || 0
      },
      graficas: {
        frecuencia,
        por_clase: porClase,
        con_propietario: conPropietario
      },
      rango: { desde: desde || null, hasta: hasta || null }
    });
  } catch (err) {
    console.error('Error obteniendo métricas de caballos:', err);
    res.status(500).json({ error: 'Error obteniendo métricas de caballos' });
  }
});

// GET /api/metricas/inicio
// Datos agregados (reales) para las gráficas del panel de inicio del admin.
router.get('/inicio', async (req, res) => {
  try {
    const hoy = new Date();

    // 1) Reservas de los últimos 7 días (por día)
    const [reservasDia] = await db.query(`
      SELECT DATE(fecha) AS f, COUNT(*) AS total
      FROM reservas
      WHERE estatus NOT LIKE 'cancelada%'
        AND fecha >= (CURDATE() - INTERVAL 6 DAY) AND fecha <= CURDATE()
      GROUP BY DATE(fecha)
    `);
    const mapDia = new Map(reservasDia.map(r => [String(r.f).slice(0, 10), Number(r.total)]));
    const diasLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const reservas_semana = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      reservas_semana.push({ dia: diasLabels[d.getDay()], total: mapDia.get(key) || 0 });
    }

    // 2) Clases impartidas por instructora (mes en curso)
    const [instructoras] = await db.query(`
      SELECT CONCAT(i.nombre, ' ', COALESCE(i.apellido, '')) AS nombre, COUNT(r.id) AS total
      FROM instructoras i
      LEFT JOIN reservas r ON r.instructora_id = i.id
        AND r.estatus = 'completada'
        AND r.fecha >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
      GROUP BY i.id
      ORDER BY total DESC
      LIMIT 6
    `);

    // 3) Disponibilidad de caballos
    const [[disp]] = await db.query(`
      SELECT SUM(disponibilidad = 'disponible') AS disponibles, COUNT(*) AS total
      FROM caballos
    `);

    // 4) Tendencia de reservas (últimos 6 meses)
    const [tendRows] = await db.query(`
      SELECT DATE_FORMAT(fecha, '%Y-%m') AS ym, COUNT(*) AS total
      FROM reservas
      WHERE estatus NOT LIKE 'cancelada%'
        AND fecha >= DATE_FORMAT((CURDATE() - INTERVAL 5 MONTH), '%Y-%m-01')
      GROUP BY ym
    `);
    const mapTend = new Map(tendRows.map(r => [r.ym, Number(r.total)]));
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const tendencia = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      tendencia.push({ mes: meses[d.getMonth()], total: mapTend.get(ym) || 0 });
    }

    // 5) Ranking de caballos más utilizados
    const [caballosRanking] = await db.query(`
      SELECT c.nombre, COUNT(r.id) AS salidas
      FROM caballos c
      LEFT JOIN reservas r ON r.caballo_id = c.id AND r.estatus IN ('confirmada', 'completada')
      GROUP BY c.id
      ORDER BY salidas DESC
      LIMIT 5
    `);

    res.json({
      reservas_semana,
      instructoras: instructoras.map(i => ({ nombre: (i.nombre || '').trim(), total: Number(i.total) })),
      disponibilidad: {
        disponibles: Number(disp.disponibles) || 0,
        total: Number(disp.total) || 0
      },
      tendencia,
      caballos_ranking: caballosRanking.map(c => ({ nombre: c.nombre, salidas: Number(c.salidas) }))
    });
  } catch (err) {
    console.error('Error obteniendo métricas de inicio:', err);
    res.status(500).json({ error: 'Error obteniendo métricas de inicio' });
  }
});

export default router;
