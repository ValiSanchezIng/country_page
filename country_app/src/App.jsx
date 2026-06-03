import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "./views/Home";
import Equitacion from "./views/Equitacion";
import CalendarioReserva from "./components/CalendarioReserva";
import MenuCalendario from "./components/MenuCalendario";
import Login from "./components/Login";
import RegistroUsuarios from "./components/RegistroUsuarios";
import InstructorClases from "./components/InstructorClases";  
import Contabilidad from "./components/Contabilidad";
import Admin from "./components/Administrador";
import SinVista from "./components/SinVista";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/equitacion" element={<Equitacion />} />
        <Route path="/CalendarioReserva" element={<CalendarioReserva />} />
        <Route path="/MenuCalendario" element={
          <ProtectedRoute>
            <MenuCalendario />
          </ProtectedRoute>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={
          <ProtectedRoute>
            <RegistroUsuarios />
          </ProtectedRoute>
        } />
        <Route path="/instructor" element={
          <InstructorClases />
          // <ProtectedRoute>
          //   <InstructorClases />
          // </ProtectedRoute>
        } />
        <Route path="/contabilidad" element={
          <ProtectedRoute>
            <Contabilidad />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        } />
        {/* Respaldo: cualquier ruta inexistente (p. ej. roles sin vista asignada)
            muestra una pantalla con opción de cerrar sesión, evitando quedar atrapado */}
        <Route path="*" element={<SinVista />} />
      </Routes>
    </Router>
  );
}

export default App;