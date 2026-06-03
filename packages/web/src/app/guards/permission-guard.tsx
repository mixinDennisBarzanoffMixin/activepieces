import { Permission } from '@activepieces/shared';
import type { JSX } from 'solid-js';

import { useAuthorization } from '@/hooks/authorization-hooks';

export const RoutePermissionGuard = ({
  requiredPermissions: permission,
  children,
}: {
  children: JSX.Element;
  requiredPermissions: Permission | Permission[];
}) => {
  const { checkAccess } = useAuthorization();
  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = permissions.some((p) => checkAccess(p));
  if (!hasAccess) {
    window.location.replace('/404');
    return null;
  }
  return children;
};
