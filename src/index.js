
// @flow

import createAuth0Client from '@auth0/auth0-spa-js';
import {Auth0Client} from '@auth0/auth0-spa-js';

let auth0: ?(typeof Auth0Client) = null;
let socket: ?WebSocket = null;

window.addEventListener('load', async (): Promise<void> => {
  auth0 = await createAuth0Client({
    domain: process.env.AUTH0_DOMAIN,
    client_id: process.env.AUTH0_CLIENT_ID,
    responseType: 'token id_token',
    audience: process.env.AUTH0_AUDIENCE,
    redirectUri: window.location.origin,
  });
  
  const isAuthenticated = await auth0.isAuthenticated();
  if (!isAuthenticated) {
    await auth0.loginWithRedirect({
      redirect_uri: window.location.origin
    });
    return;
  }

  const query = window.location.search;
  if (query.includes("code=") && query.includes("state=")) {
    await auth0.handleRedirectCallback();
    window.history.replaceState({}, document.title, "/");
  }

  const accessToken = await auth0.getTokenSilently();
  const websocketURL = process.env.SLS_CAHT_API_URL ?? '';
  socket = new WebSocket(`${websocketURL}?token=${accessToken}`);
});