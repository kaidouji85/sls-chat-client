// @flow

import createAuth0Client from '@auth0/auth0-spa-js';
import {Auth0Client} from '@auth0/auth0-spa-js';

let auth0: ?(typeof Auth0Client) = null;
let socket: ?WebSocket = null;

const loginButton = document.querySelector('#login-button') ?? document.createElement('button');
const logoffButton = document.querySelector('#logoff-button') ?? document.createElement('button');

window.addEventListener('load', async (): Promise<void> => {
  auth0 = await createAuth0Client({
    domain: process.env.AUTH0_DOMAIN,
    client_id: process.env.AUTH0_CLIENT_ID,
    responseType: 'token id_token',
    audience: process.env.AUTH0_AUDIENCE,
    redirectUri: window.location.origin,
  });

  loginButton.addEventListener('click', onLoginButtonClick);
  logoffButton.addEventListener('click', onLogoffButtonClick);

  const query = window.location.search;
  if (query.includes("code=") && query.includes("state=")) {
    await auth0.handleRedirectCallback();
    window.history.replaceState({}, document.title, "/");
  }

  const isAuthenticated = await auth0.isAuthenticated();
  if (!isAuthenticated) {
    console.error('no authenticated');
    return;
  }

  const accessToken = await auth0.getTokenSilently();
  const websocketURL = process.env.SLS_CAHT_API_URL ?? '';
  socket = new WebSocket(`${websocketURL}?token=${accessToken}`);
});

async function onLoginButtonClick() {
  if (!auth0) {
    return;
  }

  await auth0.loginWithRedirect({
    redirect_uri: window.location.origin
  });
}

function onLogoffButtonClick() {
  if (!auth0) {
    return;
  }

  auth0.logout({
    returnTo: window.location.origin
  });
}