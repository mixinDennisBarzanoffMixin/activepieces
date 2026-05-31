import { useNavigate, useLocation } from '@solidjs/router';
import { createEffect } from 'solid-js';

import { authenticationSession } from '@/lib/authentication-session';

const AuthenticatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const response = searchParams.get('response');

  createEffect(() => {
    if (response) {
      const decodedResponse = JSON.parse(response);
      authenticationSession.saveResponse(decodedResponse, false);
      navigate('/flows');
    }
  });

  return <>Please wait...</>;
};

export default AuthenticatePage;
