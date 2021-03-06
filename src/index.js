// @flow

import createAuth0Client from '@auth0/auth0-spa-js';
import {Auth0Client} from '@auth0/auth0-spa-js';

/**
 * auth0 clientを生成するヘルパー関数
 * 
 * @returns auth0 client
 */
function createAuth0ClientHelper(): Promise<typeof Auth0Client> {
  return createAuth0Client({
    domain: process.env.AUTH0_DOMAIN,
    client_id: process.env.AUTH0_CLIENT_ID,
    responseType: 'token id_token',
    audience: process.env.AUTH0_AUDIENCE,
    redirectUri: window.location.origin,
  });
}

/**
 * ログイン成功時のリダイレクトか否かを判定する
 * trueでログイン成功時のリダイレクトである
 * 
 * @return 判定結果
 */
function isLoginSuccessRedirect(): boolean {
  const query = window.location.search;
  return query.includes("code=") && query.includes("state=");
}

/**
 * ログインリダイレクトのヒストリーをクリアする
 */
function clearLoginHistory(): void {
  window.history.replaceState({}, document.title, "/");
}

/**
 * エントリポイント
 */
window.addEventListener('load', async (): Promise<void> => {
  const loginButton: HTMLElement = document.querySelector('#login-button') 
    ?? document.createElement('button');
  const logoffButton: HTMLElement = document.querySelector('#logoff-button')
    ?? document.createElement('button');
  const messageSearchResult = document.querySelector('#message');
  const message: HTMLInputElement = (messageSearchResult instanceof HTMLInputElement)
    ? messageSearchResult
    : document.createElement('input');
  const sendButton: HTMLElement = document.querySelector('#send-button')
    ?? document.createElement('button');

  const auth0 = await createAuth0ClientHelper();
  if (isLoginSuccessRedirect()) {
    await auth0.handleRedirectCallback();
    clearLoginHistory();
  }
  loginButton.addEventListener('click', async (): Promise<void> => {
    await auth0.loginWithRedirect({redirect_uri: window.location.origin});
  });
  logoffButton.addEventListener('click', () => {
    auth0.logout({returnTo: window.location.origin});
  });

  const isAuthenticated = await auth0.isAuthenticated();
  if (!isAuthenticated) {
    console.error('no authenticated');
    return;
  }

  const accessToken = await auth0.getTokenSilently();
  const websocketURL = process.env.SLS_CAHT_API_URL ?? '';
  const websocket = new WebSocket(`${websocketURL}?token=${accessToken}`);
  websocket.addEventListener('message', (e: MessageEvent) => {
    console.log(e.data);
  });
  websocket.addEventListener('error', (e: Event) => {
    console.error('websocket error', e);
  });
  sendButton.addEventListener('click', () => {
    const data = message.value;
    message.value = '';
    const originData = {action: "sendmessage", data};
    const json = JSON.stringify(originData);
    websocket.send(json);
  });
});