import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRedirectRoute } from '../utils/roleRedirect';

export default function useRoleGuard(requiredRoles) {
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (!userStr) {
      navigate('/login', { replace: true });
      return;
    }
    let user;
    try {
      user = JSON.parse(userStr);
    } catch {
      sessionStorage.removeItem('user');
      navigate('/login', { replace: true });
      return;
    }
    if (!user.rol || !requiredRoles.includes(user.rol)) {
      // Redirigir al destino correcto según su rol
      navigate(getRedirectRoute(user.rol), { replace: true });
    }
  }, [navigate, requiredRoles]);
}
