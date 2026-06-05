import express from "express";
import { Resend } from "resend";

const router = express.Router();
const resend = new Resend("re_h3MUFR11_AMEvhDEbDmza1P89t3fHWkJ5");

// Funcion helper para formatear fechas correctamente evitando problemas de zona horaria
function formatearFecha(fechaReserva) {
  if (!fechaReserva) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaReserva)) {
    const [year, month, day] = fechaReserva.split('-').map(Number);
    const fecha = new Date(year, month - 1, day, 12, 0, 0);
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  if (fechaReserva instanceof Date) {
    return fechaReserva.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  const fechaStr = String(fechaReserva).split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
    const [year, month, day] = fechaStr.split('-').map(Number);
    const fecha = new Date(year, month - 1, day, 12, 0, 0);
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  const fecha = new Date(fechaReserva);
  return fecha.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// -- Helpers de template reutilizables --

function emailWrapper(preheaderText, content) {
  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>EL REFUGIO</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    :root { color-scheme: light only; supported-color-schemes: light only; }
    body, .email-bg { background-color: #f0ece7 !important; }
    .card-bg { background-color: #ffffff !important; }
    .cred-box { background-color: #faf8f5 !important; }
    .cred-value { background-color: #ffffff !important; color: #1a1a1a !important; }
    .note-warn { background-color: #fef9ef !important; }
    .note-ok { background-color: #f0f8f0 !important; }
    .detail-bg { background-color: #faf8f5 !important; }
    .footer-bg { background-color: #1f1f1f !important; }
    u + .body .gmail-blend { background: none !important; }

    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .email-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .header-padding { padding: 20px 20px !important; }
      .cred-inner { padding: 16px 16px !important; }
      .cred-value-box { padding: 14px 12px !important; }
      .cta-btn { padding: 14px 32px !important; font-size: 14px !important; }
      .footer-text { padding: 16px 20px !important; }
    }
  </style>
</head>
<body class="body" style="margin:0; padding:0; background-color:#f0ece7; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; -webkit-font-smoothing:antialiased; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
  <!-- Preheader -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    ${preheaderText}
    ${'&nbsp;&zwnj;'.repeat(30)}
  </div>

  <table width="100%" cellspacing="0" cellpadding="0" class="email-bg" style="background-color:#f0ece7; padding:20px 12px;" role="presentation">
    <tr>
      <td align="center">
        <table width="540" cellspacing="0" cellpadding="0" class="email-container card-bg" style="background-color:#ffffff; border-radius:12px; overflow:hidden; max-width:100%;" role="presentation">
          ${content}
        </table>

        <table width="540" cellspacing="0" cellpadding="0" class="email-container" style="max-width:100%;" role="presentation">
          <tr>
            <td style="padding:14px 24px 8px; text-align:center;">
              <p style="margin:0; color:#a09484; font-size:11px; line-height:1.5;">
                Este correo fue enviado automaticamente. No respondas a este mensaje.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function emailHeader() {
  return `
<!-- Header -->
<tr>
  <td class="header-padding" style="background: linear-gradient(160deg, #7a5e3e 0%, #8b6f4e 40%, #a68968 100%); padding:24px 28px; text-align:center;">
    <img src="https://elrefugiocountryclub.com/El_refugio_logo.png"
         alt="El Refugio"
         width="44"
         style="display:block; margin:0 auto 8px;">
    <h1 style="margin:0; color:#ffffff; font-size:18px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; font-family:Georgia,'Times New Roman',serif;">
      EL REFUGIO
    </h1>
    <p style="margin:2px 0 0; color:rgba(255,255,255,0.65); font-size:9px; font-weight:500; letter-spacing:2px; text-transform:uppercase;">
      Country Club
    </p>
  </td>
</tr>`;
}

function emailFooter() {
  return `
<!-- Footer -->
<tr>
  <td style="padding:0;">
    <div style="height:2px; background:linear-gradient(90deg, #8b6f4e, #bfa47e, #8b6f4e);"></div>
    <table width="100%" cellspacing="0" cellpadding="0" class="footer-bg" style="background-color:#1f1f1f;" role="presentation">
      <tr>
        <td class="footer-text" style="padding:16px 24px; text-align:center;">
          <p style="margin:0 0 2px 0; color:rgba(255,255,255,0.6); font-size:11px; font-weight:600; letter-spacing:1px;">
            EL REFUGIO
          </p>
          <p style="margin:0; color:rgba(255,255,255,0.3); font-size:10px;">
            &copy; ${new Date().getFullYear()} &middot; elrefugiocountryclub.com
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

// Iconos SVG hospedados en el dominio (igual que el logo)
// Los archivos estan en country_app/public/icons/ y se sirven desde el dominio
const ICON_BASE = 'https://elrefugiocountryclub.com/icons';
const icons = {
  calendar:      `${ICON_BASE}/calendar.svg`,
  clock:         `${ICON_BASE}/clock.svg`,
  user:          `${ICON_BASE}/user.svg`,
  award:         `${ICON_BASE}/award.svg`,
  tag:           `${ICON_BASE}/tag.svg`,
  lock:          `${ICON_BASE}/lock.svg`,
  key:           `${ICON_BASE}/key.svg`,
  checkCircle:   `${ICON_BASE}/check-circle.svg`,
  xCircle:       `${ICON_BASE}/x-circle.svg`,
  alertTriangle: `${ICON_BASE}/alert.svg`,
  shield:        `${ICON_BASE}/shield.svg`,
  message:       `${ICON_BASE}/message.svg`,
};

// Mapa de iconos por label para auto-asignar
const iconForLabel = {
  'Nivel': icons.award,
  'Tipo': icons.tag,
  'Tipo de Reserva': icons.tag,
  'Fecha': icons.calendar,
  'Fecha de la Clase': icons.calendar,
  'Horario': icons.clock,
  'Instructor(a)': icons.user,
  'Usuario': icons.user,
  'Contrasena Temporal': icons.lock,
  'Contrasena': icons.lock,
  'Nueva Contrasena': icons.key,
  'Motivo': icons.message,
};

function detailRow(label, value, opts = {}) {
  const { strike = false, borderBottom = true, icon } = opts;
  const valueStyle = strike
    ? 'color:#1a1a1a; font-size:15px; font-weight:600; text-decoration:line-through; opacity:0.6;'
    : 'color:#1a1a1a; font-size:15px; font-weight:600;';
  const capitalize = label === 'Fecha' ? ' text-transform:capitalize;' : '';
  const iconSrc = icon || iconForLabel[label] || null;
  const iconHtml = iconSrc
    ? `<img src="${iconSrc}" alt="" width="16" height="16" style="display:inline-block; vertical-align:middle; margin-right:6px;">`
    : '';
  return `
  <table width="100%" cellspacing="0" cellpadding="0" style="${borderBottom ? 'border-bottom:1px solid #ebe5dd; margin-bottom:10px; padding-bottom:10px;' : ''}">
    <tr>
      <td>
        <span style="color:#999; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:3px;">${iconHtml}${label}</span>
        <span style="${valueStyle}${capitalize}">${value}</span>
      </td>
    </tr>
  </table>`;
}

function ctaButton(text, href = 'https://elrefugiocountryclub.com/login') {
  return `
<div style="text-align:center; margin:20px 0 0;">
  <a href="${href}" class="cta-btn" style="display:inline-block; background-color:#8b6f4e; color:#ffffff !important; text-decoration:none; padding:13px 36px; border-radius:8px; font-size:14px; font-weight:700; letter-spacing:0.3px; mso-padding-alt:0; text-align:center;">
    ${text}
  </a>
</div>`;
}

// -- Endpoints --

router.post("/send-credentials", async (req, res) => {
  try {
    const usuarioData = req.body;
    console.log("Enviando credenciales por email a:", usuarioData.email);

    if (!usuarioData.email) {
      return res
        .status(400)
        .json({ error: "El correo electronico es requerido" });
    }

    const htmlContent = emailWrapper(
      `Bienvenido a EL REFUGIO, ${usuarioData.nombre}. Aqui estan tus credenciales de acceso.`,
      `
      ${emailHeader()}

      <tr>
        <td class="email-padding" style="padding:24px 28px 20px;">
          <h2 style="margin:0 0 4px 0; color:#1a1a1a; font-size:18px; font-weight:700; text-align:center;">
            Bienvenido(a), ${usuarioData.nombre}
          </h2>
          <p style="margin:0 0 20px 0; color:#888; font-size:13px; text-align:center; line-height:1.5;">
            Tu cuenta ha sido creada con el rol de <strong style="color:#8b6f4e;">${usuarioData.rol}</strong>
          </p>

          <!-- Credenciales -->
          <table width="100%" cellspacing="0" cellpadding="0" class="cred-box" style="background-color:#faf8f5; border:1px solid #e8e0d6; border-radius:10px; margin-bottom:16px;" role="presentation">
            <tr>
              <td class="cred-inner" style="padding:18px 20px;">
                <p style="margin:0 0 14px 0; text-align:center;">
                  <span style="display:inline-block; background-color:#8b6f4e; color:#fff; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; padding:4px 14px; border-radius:20px;">
                    Credenciales de Acceso
                  </span>
                </p>

                <!-- Usuario -->
                <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:12px;" role="presentation">
                  <tr>
                    <td>
                      <span style="color:#8b6f4e; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:6px;">
                        <img src="${icons.user}" alt="" width="13" height="13" style="display:inline-block; vertical-align:middle; margin-right:4px;">Usuario
                      </span>
                      <div class="cred-value" style="background-color:#ffffff; border:1px solid #e0dbd5; border-radius:8px; text-align:center;">
                        <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
                          <tr>
                            <td class="cred-value-box" style="padding:14px 16px; text-align:center;">
                              <span style="color:#1a1a1a; font-size:17px; font-weight:700; letter-spacing:0.3px;">
                                ${usuarioData.username}
                              </span>
                            </td>
                          </tr>
                        </table>
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Contrasena -->
                <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
                  <tr>
                    <td>
                      <span style="color:#8b6f4e; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:6px;">
                        <img src="${icons.lock}" alt="" width="13" height="13" style="display:inline-block; vertical-align:middle; margin-right:4px;">Contrasena Temporal
                      </span>
                      <div class="cred-value" style="background-color:#ffffff; border:1px solid #e0dbd5; border-radius:8px; text-align:center;">
                        <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
                          <tr>
                            <td class="cred-value-box" style="padding:14px 16px; text-align:center;">
                              <span style="color:#1a1a1a; font-size:17px; font-weight:700; letter-spacing:0.5px;">
                                ${usuarioData.password}
                              </span>
                            </td>
                          </tr>
                        </table>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Nota de seguridad -->
          <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
            <tr>
              <td class="note-warn" style="background-color:#fef9ef; border:1px solid #f5e6c4; border-radius:8px; padding:12px 14px;">
                <p style="margin:0; color:#8b6f4e; font-size:12px; font-weight:600; line-height:1.5;">
                  <img src="${icons.shield}" alt="" width="14" height="14" style="display:inline-block; vertical-align:middle; margin-right:4px;">Cambia tu contrasena en tu primer inicio de sesion. No compartas estos datos.
                </p>
              </td>
            </tr>
          </table>

          ${ctaButton('Acceder a la Plataforma')}
        </td>
      </tr>

      ${emailFooter()}
      `
    );

    const response = await resend.emails.send({
      from: "EL REFUGIO <noreply@elrefugiocountryclub.com>",
      to: usuarioData.email,
      subject: "Bienvenido a EL REFUGIO - Tus credenciales de acceso",
      html: htmlContent,
    });

    console.log("Email enviado exitosamente:", response);
    res.json({ success: true, data: response });
  } catch (error) {
    console.error("Error al enviar email:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para enviar credenciales actualizadas
router.post("/send-updated-credentials", async (req, res) => {
  try {
    const { email, nombre, username, newPassword } = req.body;
    console.log("Enviando credenciales actualizadas por email a:", email);

    if (!email || !nombre || !username || !newPassword) {
      return res
        .status(400)
        .json({ error: "Todos los campos son requeridos (email, nombre, username, newPassword)" });
    }

    const htmlContent = emailWrapper(
      `Hola ${nombre}, tu contrasena ha sido actualizada exitosamente.`,
      `
      ${emailHeader()}

      <tr>
        <td class="email-padding" style="padding:24px 28px 20px;">
          <h2 style="margin:0 0 4px 0; color:#1a1a1a; font-size:18px; font-weight:700; text-align:center;">
            Contrasena Actualizada
          </h2>
          <p style="margin:0 0 20px 0; color:#888; font-size:13px; text-align:center; line-height:1.5;">
            Hola <strong style="color:#8b6f4e;">${nombre}</strong>, tu contrasena ha sido actualizada exitosamente.
          </p>

          <!-- Credenciales -->
          <table width="100%" cellspacing="0" cellpadding="0" class="cred-box" style="background-color:#faf8f5; border:1px solid #e8e0d6; border-radius:10px; margin-bottom:16px;" role="presentation">
            <tr>
              <td class="cred-inner" style="padding:18px 20px;">
                <p style="margin:0 0 14px 0; text-align:center;">
                  <span style="display:inline-block; background-color:#8b6f4e; color:#fff; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; padding:4px 14px; border-radius:20px;">
                    Credenciales Actualizadas
                  </span>
                </p>

                <!-- Usuario -->
                <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:12px;" role="presentation">
                  <tr>
                    <td>
                      <span style="color:#8b6f4e; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:6px;">
                        <img src="${icons.user}" alt="" width="13" height="13" style="display:inline-block; vertical-align:middle; margin-right:4px;">Usuario
                      </span>
                      <div class="cred-value" style="background-color:#ffffff; border:1px solid #e0dbd5; border-radius:8px; text-align:center;">
                        <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
                          <tr>
                            <td class="cred-value-box" style="padding:14px 16px; text-align:center;">
                              <span style="color:#1a1a1a; font-size:17px; font-weight:700; letter-spacing:0.3px;">
                                ${username}
                              </span>
                            </td>
                          </tr>
                        </table>
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Nueva contrasena -->
                <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
                  <tr>
                    <td>
                      <span style="color:#8b6f4e; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:6px;">
                        <img src="${icons.key}" alt="" width="13" height="13" style="display:inline-block; vertical-align:middle; margin-right:4px;">Nueva Contrasena
                      </span>
                      <div class="cred-value" style="background-color:#ffffff; border:1px solid #e0dbd5; border-radius:8px; text-align:center;">
                        <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
                          <tr>
                            <td class="cred-value-box" style="padding:14px 16px; text-align:center;">
                              <span style="color:#1a1a1a; font-size:17px; font-weight:700; letter-spacing:0.5px;">
                                ${newPassword}
                              </span>
                            </td>
                          </tr>
                        </table>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Nota -->
          <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
            <tr>
              <td class="note-ok" style="background-color:#f0f8f0; border:1px solid #c8e6c8; border-radius:8px; padding:12px 14px;">
                <p style="margin:0; color:#2e7d32; font-size:12px; font-weight:600; line-height:1.5;">
                  <img src="${icons.checkCircle}" alt="" width="14" height="14" style="display:inline-block; vertical-align:middle; margin-right:4px;">Tu contrasena ha sido cambiada correctamente. Manten tus credenciales seguras.
                </p>
              </td>
            </tr>
          </table>

          ${ctaButton('Acceder a la Plataforma')}
        </td>
      </tr>

      ${emailFooter()}
      `
    );

    const response = await resend.emails.send({
      from: "EL REFUGIO <noreply@elrefugiocountryclub.com>",
      to: email,
      subject: "Contrasena actualizada - EL REFUGIO",
      html: htmlContent,
    });

    console.log("Email de credenciales actualizadas enviado exitosamente:", response);
    res.json({ success: true, data: response });
  } catch (error) {
    console.error("Error al enviar email de credenciales actualizadas:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para confirmar reserva
router.post("/send-reservation-confirmation", async (req, res) => {
  try {
    const { email, nombre, fechaReserva, horaInicio, horaFin, instructor, tipoReserva, nivel } = req.body;
    console.log("Enviando confirmacion de reserva por email a:", email);

    if (!email || !nombre || !fechaReserva || !horaInicio || !horaFin) {
      return res
        .status(400)
        .json({ error: "Campos requeridos: email, nombre, fechaReserva, horaInicio, horaFin" });
    }

    const fechaFormateada = formatearFecha(fechaReserva);

    // Capitalizar nivel
    const nivelFormateado = nivel ? nivel.charAt(0).toUpperCase() + nivel.slice(1).toLowerCase() : null;

    const tipoReservaAmigable = tipoReserva === 'propietario' ? 'Propietario' :
                                tipoReserva === 'renta' ? 'Renta' :
                                tipoReserva === 'media_renta' ? 'Media Renta' :
                                'Clase Regular';

    const htmlContent = emailWrapper(
      `Hola ${nombre}, tu reserva para el ${fechaFormateada} ha sido confirmada.`,
      `
      ${emailHeader()}

      <tr>
        <td class="email-padding" style="padding:24px 28px 20px;">
          <!-- Badge confirmado -->
          <div style="text-align:center; margin-bottom:16px;">
            <span class="note-ok" style="display:inline-block; background-color:#e8f5e9; color:#2e7d32; font-size:12px; font-weight:700; padding:6px 18px; border-radius:20px; border:1px solid #c8e6c8;">
              <img src="${icons.checkCircle}" alt="" width="14" height="14" style="display:inline-block; vertical-align:middle; margin-right:4px;">Reserva Confirmada
            </span>
          </div>

          <p style="margin:0 0 20px 0; color:#666; font-size:14px; text-align:center; line-height:1.5;">
            Hola <strong style="color:#8b6f4e;">${nombre}</strong>, tu reserva ha sido confirmada.
          </p>

          <!-- Detalles -->
          <table width="100%" cellspacing="0" cellpadding="0" class="detail-bg" style="background-color:#faf8f5; border:1px solid #e8e0d6; border-radius:10px; margin-bottom:16px;" role="presentation">
            <tr>
              <td class="cred-inner" style="padding:16px 18px;">
                ${nivelFormateado ? detailRow('Nivel', nivelFormateado) : ''}
                ${tipoReserva ? detailRow('Tipo', tipoReservaAmigable) : ''}
                ${detailRow('Fecha', fechaFormateada)}
                ${detailRow('Horario', `${horaInicio} - ${horaFin}`, { borderBottom: !!instructor })}
                ${instructor ? detailRow('Instructor(a)', instructor, { borderBottom: false }) : ''}
              </td>
            </tr>
          </table>

          <!-- Nota cancelacion -->
          <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
            <tr>
              <td class="note-warn" style="background-color:#fef9ef; border:1px solid #f5e6c4; border-radius:8px; padding:10px 14px;">
                <p style="margin:0; color:#8b6f4e; font-size:11px; line-height:1.5;">
                  <img src="${icons.alertTriangle}" alt="" width="14" height="14" style="display:inline-block; vertical-align:middle; margin-right:4px;"><strong>Cancelacion:</strong> Si necesitas cancelar, hazlo con al menos 2 horas de anticipacion.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      ${emailFooter()}
      `
    );

    const response = await resend.emails.send({
      from: "EL REFUGIO <noreply@elrefugiocountryclub.com>",
      to: email,
      subject: "Reserva Confirmada - EL REFUGIO",
      html: htmlContent,
    });

    console.log("Email de confirmacion de reserva enviado exitosamente:", response);
    res.json({ success: true, data: response });
  } catch (error) {
    console.error("Error al enviar email de confirmacion de reserva:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para cancelacion de reserva
router.post("/send-cancellation-notification", async (req, res) => {
  try {
    const { email, nombre, fechaReserva, horaInicio, horaFin, instructor, motivoCancelacion } = req.body;
    console.log("Enviando notificacion de cancelacion por email a:", email);

    if (!email || !nombre || !fechaReserva || !horaInicio || !horaFin) {
      return res
        .status(400)
        .json({ error: "Campos requeridos: email, nombre, fechaReserva, horaInicio, horaFin" });
    }

    const fechaFormateada = formatearFecha(fechaReserva);

    const htmlContent = emailWrapper(
      `Hola ${nombre}, tu reserva del ${fechaFormateada} ha sido cancelada.`,
      `
      ${emailHeader()}

      <tr>
        <td class="email-padding" style="padding:24px 28px 20px;">
          <!-- Badge cancelado -->
          <div style="text-align:center; margin-bottom:16px;">
            <span style="display:inline-block; background-color:#fdecea; color:#c0392b; font-size:12px; font-weight:700; padding:6px 18px; border-radius:20px; border:1px solid #f5c6cb;">
              <img src="${icons.xCircle}" alt="" width="14" height="14" style="display:inline-block; vertical-align:middle; margin-right:4px;">Reserva Cancelada
            </span>
          </div>

          <p style="margin:0 0 20px 0; color:#666; font-size:14px; text-align:center; line-height:1.5;">
            Hola <strong style="color:#8b6f4e;">${nombre}</strong>, tu reserva ha sido cancelada.
          </p>

          <!-- Detalles -->
          <table width="100%" cellspacing="0" cellpadding="0" class="detail-bg" style="background-color:#faf8f5; border:1px solid #e8e0d6; border-radius:10px; margin-bottom:16px;" role="presentation">
            <tr>
              <td class="cred-inner" style="padding:16px 18px;">
                ${detailRow('Fecha', fechaFormateada, { strike: true })}
                ${detailRow('Horario', `${horaInicio} - ${horaFin}`, { strike: true, borderBottom: !!(instructor || motivoCancelacion) })}
                ${instructor ? detailRow('Instructor(a)', instructor, { borderBottom: !!motivoCancelacion }) : ''}
                ${motivoCancelacion ? detailRow('Motivo', motivoCancelacion, { borderBottom: false }) : ''}
              </td>
            </tr>
          </table>

          <!-- Nota -->
          <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
            <tr>
              <td class="note-warn" style="background-color:#fef9ef; border:1px solid #f5e6c4; border-radius:8px; padding:10px 14px;">
                <p style="margin:0; color:#8b6f4e; font-size:11px; line-height:1.5;">
                  Puedes hacer una nueva reserva desde la plataforma o contactarnos para reprogramar.
                </p>
              </td>
            </tr>
          </table>

          ${ctaButton('Hacer Nueva Reserva')}
        </td>
      </tr>

      ${emailFooter()}
      `
    );

    const response = await resend.emails.send({
      from: "EL REFUGIO <noreply@elrefugiocountryclub.com>",
      to: email,
      subject: "Reserva Cancelada - EL REFUGIO",
      html: htmlContent,
    });

    console.log("Email de cancelacion enviado exitosamente:", response);
    res.json({ success: true, data: response });
  } catch (error) {
    console.error("Error al enviar email de cancelacion:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para recordatorio de reserva (2 horas antes de la clase)
router.post("/send-reminder", async (req, res) => {
  try {
    const { email, nombre, fechaReserva, horaInicio, horaFin, instructor } = req.body;
    console.log("Enviando recordatorio de reserva por email a:", email);

    if (!email || !nombre || !fechaReserva || !horaInicio || !horaFin) {
      return res
        .status(400)
        .json({ error: "Campos requeridos: email, nombre, fechaReserva, horaInicio, horaFin" });
    }

    const fechaFormateada = formatearFecha(fechaReserva);

    const htmlContent = emailWrapper(
      `Hola ${nombre}, te recordamos tu clase de hoy a las ${horaInicio}.`,
      `
      ${emailHeader()}

      <tr>
        <td class="email-padding" style="padding:24px 28px 20px;">
          <div style="text-align:center; margin-bottom:16px;">
            <span style="display:inline-block; background-color:#fef9ef; color:#8b6f4e; font-size:12px; font-weight:700; padding:6px 18px; border-radius:20px; border:1px solid #f5e6c4;">
              <img src="${icons.clock}" alt="" width="14" height="14" style="display:inline-block; vertical-align:middle; margin-right:4px;">Recordatorio de Clase
            </span>
          </div>

          <p style="margin:0 0 20px 0; color:#666; font-size:14px; text-align:center; line-height:1.5;">
            Hola <strong style="color:#8b6f4e;">${nombre}</strong>, tu clase comienza en aproximadamente <strong>2 horas</strong>. Por favor confirma tu asistencia.
          </p>

          <table width="100%" cellspacing="0" cellpadding="0" class="detail-bg" style="background-color:#faf8f5; border:1px solid #e8e0d6; border-radius:10px; margin-bottom:16px;" role="presentation">
            <tr>
              <td class="cred-inner" style="padding:16px 18px;">
                ${detailRow('Fecha', fechaFormateada)}
                ${detailRow('Horario', `${horaInicio} - ${horaFin}`, { borderBottom: !!instructor })}
                ${instructor ? detailRow('Instructor(a)', instructor, { borderBottom: false }) : ''}
              </td>
            </tr>
          </table>

          <table width="100%" cellspacing="0" cellpadding="0" role="presentation">
            <tr>
              <td class="note-warn" style="background-color:#fef9ef; border:1px solid #f5e6c4; border-radius:8px; padding:10px 14px;">
                <p style="margin:0; color:#8b6f4e; font-size:11px; line-height:1.5;">
                  <img src="${icons.alertTriangle}" alt="" width="14" height="14" style="display:inline-block; vertical-align:middle; margin-right:4px;"><strong>Importante:</strong> Si no puedes asistir, cancela desde la plataforma para liberar tu espacio.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      ${emailFooter()}
      `
    );

    const response = await resend.emails.send({
      from: "EL REFUGIO <noreply@elrefugiocountryclub.com>",
      to: email,
      subject: "Recordatorio de tu clase - EL REFUGIO",
      html: htmlContent,
    });

    console.log("Email de recordatorio enviado exitosamente:", response);
    res.json({ success: true, data: response });
  } catch (error) {
    console.error("Error al enviar email de recordatorio:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
