// server/index.js
import express from "express";
import cors from "cors";
import db from "./db.js"; // db.js al mismo nivel que server
import os from "os";

// Importar rutas
import instructorRoutes from "../routes/instructor.js";
import reservasRoutes from "../routes/reservas_new.js";
import horariosRoutes from "../routes/horarios.js";
import usersRoutes from "../routes/users_new.js";
import emailRoutes from "../routes/email.js";
import caballosRoutes from "../routes/caballos.js";
import instructorasRoutes from "../routes/instructoras.js";
import reservasAdminRoutes from "../routes/reservas_admin.js";
import descansosRoutes from "../routes/descansos.js";
import bloqueosRoutes from "../routes/bloqueos.js";

console.log("✅ Rutas importadas correctamente");

const app = express();
const PORT = 3001;

// ========================
// Middlewares
// ========================
app.use(
  cors({
    origin: true, // Permitir todas las conexiones en desarrollo
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

// ========================
// Ruta de prueba
// ========================
app.get("/", (req, res) => {
  res.send("Servidor backend corriendo 🚀");
});

// ========================
// Login actualizado
// ========================
app.post("/api/login", async (req, res) => {
  const { username, contrasena } = req.body;

  if (!username || !contrasena) {
    return res.status(400).json({ error: "Faltan datos de acceso" });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM usuarios WHERE username = ? AND contrasena = ?",
      [username, contrasena]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "❌ Usuario o contraseña incorrectos" });
    }

    const user = rows[0];
    const estado = (user.estatus || "").toLowerCase();

    switch (estado) {
      case "activo":
        return res.json({
          mensaje: "✅ Login correcto",
          user: {
            id: user.id,
            nombre: user.nombre,
            rol: user.rol || "cliente",
            estatus: user.estatus,
            tipo_nivel: user.tipo_nivel, // Agregar tipo_nivel
            tipo_cliente: user.tipo_cliente, // Agregar tipo_cliente también
          },
        });

      case "inactivo":
        return res.json({
          mensaje: "⚠️ Tu cuenta está inactiva. Comunícate con el administrador.",
          user: { 
            id: user.id, 
            nombre: user.nombre, 
            rol: user.rol, 
            estatus: user.estatus,
            tipo_nivel: user.tipo_nivel,
            tipo_cliente: user.tipo_cliente,
          },
        });

      case "bloqueado":
        return res.status(403).json({
          mensaje: "🚫 Tu cuenta está bloqueada y no puedes iniciar sesión.",
          user: { 
            id: user.id, 
            nombre: user.nombre, 
            rol: user.rol, 
            estatus: user.estatus,
            tipo_nivel: user.tipo_nivel,
            tipo_cliente: user.tipo_cliente,
          },
        });

      default:
        return res.status(403).json({
          mensaje: "❌ Estado de usuario no permitido.",
          user: { 
            id: user.id, 
            nombre: user.nombre, 
            rol: user.rol, 
            estatus: user.estatus,
            tipo_nivel: user.tipo_nivel,
            tipo_cliente: user.tipo_cliente,
          },
        });
    }
  } catch (err) {
    console.error("❌ Error en login:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ========================
// Montar rutas
// ========================
console.log("🔧 Montando rutas...");
app.use("/api/instructor", instructorRoutes);
app.use(
  "/api/reservas",
  (req, res, next) => {
    console.log(`📍 Ruta reservas: ${req.method} ${req.originalUrl}`);
    next();
  },
  reservasRoutes
);
app.use("/api/horarios", horariosRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/caballos", caballosRoutes);
app.use("/api/instructoras", instructorasRoutes);
app.use("/api/reservas-admin", reservasAdminRoutes);
app.use("/api/reservas", reservasRoutes);
app.use("/api/descansos", descansosRoutes);
app.use("/api/bloqueos", bloqueosRoutes);

// ========================
// Manejo de errores
// ========================
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.use((err, req, res, next) => {
  console.error("Error global:", err);
  res.status(500).json({ error: "Error en el servidor" });
});

// ========================
// Job periódico: auto-completar reservas pasadas (+30 min)
// ========================
async function autoCompletarReservasPasadas() {
  try {
    const [result] = await db.query(`
      UPDATE reservas
      SET estatus = 'completada'
      WHERE estatus IN ('pendiente', 'confirmada')
        AND TIMESTAMP(fecha, hora_fin) < DATE_SUB(NOW(), INTERVAL 30 MINUTE)
    `);
    if (result.affectedRows > 0) {
      console.log(`🕐 Auto-completar: ${result.affectedRows} reserva(s) marcadas como completadas`);
    }
  } catch (err) {
    console.error('❌ Error en auto-completar reservas:', err.message);
  }
}

// Ejecutar al arrancar y luego cada 5 minutos
autoCompletarReservasPasadas();
setInterval(autoCompletarReservasPasadas, 30 * 60 * 1000);

// ========================
// Iniciar servidor
// ========================
app.listen(PORT, '0.0.0.0', () => {
  // Obtener la IP de red
  const networkInterfaces = os.networkInterfaces();
  let networkIP = 'No disponible';
  
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        networkIP = iface.address;
        break;
      }
    }
    if (networkIP !== 'No disponible') break;
  }

  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🌐 Network: http://${networkIP}:${PORT}`);
});
