// Job de recordatorios: envía un correo ~2 horas antes de cada clase y marca
// reservas.recordatorio_enviado = 1 para no repetirlo. Sin auto-cancelar.
// Se ejecuta con setInterval desde server/index.js (mismo patrón que
// autoCompletarReservasPasadas). Ventana de 110–130 min para tolerar la cadencia.
import axios from 'axios';
import db from '../server/db.js';

const EMAIL_URL = 'https://elrefugiocountryclub.com/api/api/email/send-reminder';

export async function enviarRecordatorios2h() {
  try {
    const [reservas] = await db.query(`
      SELECT r.id, r.fecha, r.hora_inicio, r.hora_fin,
             u.nombre, u.apellido, u.correo,
             i.nombre AS inst_nombre, i.apellido AS inst_apellido
      FROM reservas r
      LEFT JOIN usuarios u ON u.id = r.cliente_id
      LEFT JOIN instructoras inst ON inst.id = r.instructora_id
      LEFT JOIN usuarios i ON inst.usuario_id = i.id
      WHERE r.estatus IN ('pendiente', 'confirmada')
        AND r.recordatorio_enviado = 0
        AND TIMESTAMP(r.fecha, r.hora_inicio)
            BETWEEN DATE_ADD(NOW(), INTERVAL 110 MINUTE)
                AND DATE_ADD(NOW(), INTERVAL 130 MINUTE)
    `);

    if (reservas.length === 0) return;

    for (const r of reservas) {
      // Marcar como enviado primero para evitar duplicados aunque el correo tarde.
      await db.query(`UPDATE reservas SET recordatorio_enviado = 1 WHERE id = ?`, [r.id]);

      if (!r.correo || r.correo.trim() === '') continue;
      const fechaStr = r.fecha instanceof Date
        ? r.fecha.toISOString().split('T')[0]
        : String(r.fecha).split('T')[0];
      const instructor = r.inst_nombre
        ? `${r.inst_nombre} ${r.inst_apellido || ''}`.trim()
        : null;

      const payload = {
        email: r.correo.trim(),
        nombre: `${r.nombre || ''} ${r.apellido || ''}`.trim(),
        fechaReserva: fechaStr,
        horaInicio: r.hora_inicio ? String(r.hora_inicio).slice(0, 5) : '',
        horaFin: r.hora_fin ? String(r.hora_fin).slice(0, 5) : '',
        instructor
      };

      axios.post(EMAIL_URL, payload)
        .then(() => console.log(`✅ Recordatorio enviado a: ${r.correo}`))
        .catch(e => console.error(`⚠️ Error recordatorio a ${r.correo}:`, e.message));
    }

    console.log(`🔔 Recordatorios procesados: ${reservas.length}`);
  } catch (err) {
    console.error('❌ Error en job de recordatorios:', err.message);
  }
}
