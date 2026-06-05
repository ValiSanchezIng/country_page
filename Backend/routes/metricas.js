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

export default router;
