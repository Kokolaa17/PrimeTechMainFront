import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router
} from '@angular/router';

const ROLE_MAP: { [key: number]: string } = {
  0: 'user',
  1: 'admin',
  2: 'manager',
  3: 'guest' // 👈 Added guest to the map just in case you use number 3 later
};

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  
  let user: any = null;
  const userString = localStorage.getItem('user');

  if (!userString) {
    // 1. Fallback to a guest object if no one is logged in
    user = { role: 'guest' };
  } else {
    try {
      user = JSON.parse(userString);
    } catch (error) {
      console.error('Error parsing user data, falling back to "guest":', error);
      user = { role: 'guest' };
    }
  }

  try {
    const allowedRoles = (route.data?.['roles'] as string[]) || [];
    
    // Normalize allowed roles from the route config to lowercase
    const allowedRolesLower = allowedRoles.map(role => role.toLowerCase());

    // 2. Extract and resolve the user's role string
    let userRoleStr = '';

    if (typeof user?.role === 'number') {
      userRoleStr = ROLE_MAP[user.role] || '';
    } else if (typeof user?.role === 'string') {
      userRoleStr = user.role.toLowerCase();
    }

    // 3. Perform the match check
    if (userRoleStr && allowedRolesLower.includes(userRoleStr)) {
      return true; // Access granted! (e.g. if the route allows 'guest')
    }

    // If no roles matched, cancel navigation silently
    console.warn(`Unauthorized access attempt. Role "${userRoleStr}" is not allowed here.`);
    return false; // Keeps them on the current page

  } catch (error) {
    console.error('Error checking permissions:', error);
    return false; // Safely cancel navigation on unexpected crash
  }
};