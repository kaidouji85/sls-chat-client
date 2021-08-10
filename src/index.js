
// @flow

import createAuth0Client from '@auth0/auth0-spa-js';

let auth0 = null;

window.addEventListener('load', async (): Promise<void> => {
  console.log('hello');
  auth0 = await createAuth0Client({
    domain: process.env.AUTH0_DOMAIN,
    client_id: process.env.AUTH0_CLIENT_ID,
  });
  const isAuthenticated = await auth0.isAuthenticated();
  console.log(isAuthenticated);
});