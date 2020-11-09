import { OAuth2, Authorization } from '@advanced-rest-client/arc-types';
import { ProcessingOptions } from './types';

export declare const resolveFunction: unique symbol;
export declare const rejectFunction: unique symbol;
export declare const settingsValue: unique symbol;
export declare const optionsValue: unique symbol;
export declare const prepareSettings: unique symbol;
export declare const prepareOptions: unique symbol;
export declare const authorize: unique symbol;
export declare const stateValue: unique symbol;
export declare const authorizeImplicitCode: unique symbol;
export declare const authorizeClientCredentials: unique symbol;
export declare const authorizePassword: unique symbol;
export declare const authorizeCustomGrant: unique symbol;
export declare const popupValue: unique symbol;
export declare const popupUnloadHandler: unique symbol;
export declare const tokenResponse: unique symbol;
export declare const messageHandler: unique symbol;
export declare const iframeValue: unique symbol;
export declare const processPopupRawData: unique symbol;
export declare const processTokenResponse: unique symbol;
export declare const handleTokenInfo: unique symbol;
export declare const computeTokenInfoScopes: unique symbol;
export declare const computeExpires: unique symbol;
export declare const codeValue: unique symbol;
export declare const frameTimeoutHandler: unique symbol;
export declare const reportOAuthError: unique symbol;
export declare const authorizePopup: unique symbol;
export declare const authorizeTokenNonInteractive: unique symbol;
export declare const createTokenResponseError: unique symbol;
export declare const createErrorParams: unique symbol;
export declare const tokenInfoFromParams: unique symbol;
export declare const processCodeResponse: unique symbol;
export declare const handleTokenCodeError: unique symbol;

/**
 * A library that performs OAuth 2 authorization.
 * 
 * It is build for API components ecosystem and the configuration is defined in `@advanced-rest-client/arc-types`
 * so all components use the same configuration.
 */
export class OAuth2Authorization {
  /**
   * The authorization settings used to initialize this class.
   */
  get settings(): Authorization.OAuth2Authorization;
  [settingsValue]: Authorization.OAuth2Authorization;

  /**
   * The processing options used to initialize this object.
   */
  get options(): ProcessingOptions;
  [optionsValue]: ProcessingOptions;

  /**
   * The request state parameter. If the state is not passed with the configuration one is generated.
   */
  get state(): string;
  [stateValue]: string;

  [resolveFunction]: Function;
  [rejectFunction]: Function;

  /**
   * @param settings The authorization configuration.
   * @param options Additional processing options to configure the behavior of this library.
   */
  constructor(settings: Authorization.OAuth2Authorization, options?: ProcessingOptions);

  /**
   * @returns Processed settings
   */
  [prepareSettings](settings: Authorization.OAuth2Authorization): Authorization.OAuth2Authorization;

  /**
   * @returns Processed options
   */
  [prepareOptions](options: ProcessingOptions): ProcessingOptions;

  /**
   * A function that should be called before the authorization.
   * It checks configuration integrity, and performs some sanity checks 
   * like proper values of the request URIs.
   */
  checkConfig(): void;

  /**
   * Performs the authorization.
   * @returns Promise resolved to the token info.
   */
  authorize(): Promise<OAuth2.TokenInfo>;

  /**
   * Reports authorization error back to the application.
   *
   * This operation clears the promise object.
   *
   * @param message The message to report
   * @param  code Error code
   */
  [reportOAuthError](message: string, code: string): void;

  /**
   * Starts the authorization process.
   */
  [authorize](): void;

  /**
   * Starts the authorization flow for the `implicit` and `authorization_code` flows.
   * If the `interactive` flag is configured it  then it chooses between showing the UI (popup)
   * or non-interactive iframe.
   */
  [authorizeImplicitCode](): void;

  /**
   * Constructs the popup/iframe URL for the `implicit` or `authorization_code` grant types.
   * @return Full URL for the endpoint.
   */
  constructPopupUrl(): string;

  /**
   * Opens a popup to request authorization from the user.
   * @param url The URL to open.
   */
  [authorizePopup](url: string): void;

  /**
   * Tries to authorize the user in a non interactive way (iframe rather than a popup).
   * 
   * This method always result in a success response. When there's an error or
   * user is not logged in then the response won't contain auth token info.
   *
   * @param url Complete authorization url
   */
  [authorizeTokenNonInteractive](url: string): void;

  /**
   * Event handler for the the iframe timeout event.
   * If there's the reject function then it is called with the error details.
   */
  [frameTimeoutHandler](): void;

  /**
   * Clears all registered observers:
   * - popup/iframe message listeners
   * - popup info pull interval
   */
  clearObservers(): void;

  /**
   * This is called when the popup info pull interval detects that the window was closed.
   * It checks whether the token info has been set by the redirect page and if not then it reports an error.
   */
  [popupUnloadHandler](): void;

  /**
   * A handler for the `message` event registered when performing authorization that involves the popup
   * of the iframe.
   */
  [messageHandler](e: MessageEvent): void;

  /**
   * @param raw The data from the `MessageEvent`. Might not be the data returned by the auth popup/iframe.
   */
  [processPopupRawData](raw: any): void;

  /**
   * Processes the response returned by the popup or the iframe.
   * @param oauthParams
   */
  [processTokenResponse](oauthParams: URLSearchParams): Promise<void>;

  /**
   * Processes the response returned by the popup or the iframe.
   * @param oauthParams
   * @returns Parameters for the [reportOAuthError]() function
   */
  [createTokenResponseError](oauthParams: URLSearchParams): string[];

  /**
   * Creates arguments for the error function from error response
   * @param code Returned from the authorization server error code
   * @param description Returned from the authorization server error description
   * @returns Parameters for the [reportOAuthError]() function
   */
  [createErrorParams](code: string, description?: string): string[];

  /**
   * Creates a token info object from query parameters
   */
  [tokenInfoFromParams](oauthParams: URLSearchParams): OAuth2.TokenInfo;

  /**
   * Processes token info object when it's ready.
   *
   * @param info Token info returned from the server.
   */
  [handleTokenInfo](info: OAuth2.TokenInfo): void;

  /**
   * Computes token expiration time.
   * It sets `expires_at` property on the token info object which is the time
   * in the future when when the token expires.
   *
   * @param tokenInfo Token info object
   * @returns A copy with updated properties.
   */
  [computeExpires](tokenInfo: OAuth2.TokenInfo): OAuth2.TokenInfo;

  /**
   * Computes the final list of granted scopes.
   * It is a list of scopes received in the response or the list of requested scopes.
   * Because the user may change the list of scopes during the authorization process
   * the received list of scopes can be different than the one requested by the user.
   *
   * @param scope The `scope` parameter received with the response. It's null safe.
   * @returns The list of scopes for the token.
   */
  [computeTokenInfoScopes](scope: string): string[];

  /**
   * Exchanges the authorization code for authorization token.
   *
   * @param code Returned code from the authorization endpoint.
   * @returns The token info when the request was a success.
   */
  exchangeCode(code: string): Promise<OAuth2.TokenInfo>;

  /**
   * Returns a body value for the code exchange request.
   * @param code Authorization code value returned by the authorization server.
   * @return Request body.
   */
  getCodeRequestBody(code: string): string;

  /**
   * Requests for token from the authorization server for `code`, `password`, `client_credentials` and custom grant types.
   *
   * @param url Base URI of the endpoint. Custom properties will be applied to the final URL.
   * @param body Generated body for given type. Custom properties will be applied to the final body.
   * @returns Promise resolved to the response string.
   */
  requestToken(url: string, body: string): Promise<OAuth2.TokenInfo>;

  /**
   * Processes code response body and produces map of values.
   *
   * @param body Body received in the response.
   * @param mime Response content type.
   * @return Response as an object.
   * @throws {Error} Exception when the body is invalid.
   */
  [processCodeResponse](body: string, mime: string): OAuth2.TokenInfo;

  /**
   * A handler for the error that happened during code exchange.
   */
  [handleTokenCodeError](e: Error): void;

  /**
   * Requests a token for `client_credentials` request type.
   * 
   * This method resolves the main promise set by the `authorize()` function.
   *
   * @return Promise resolved to a token info object.
   */
  [authorizeClientCredentials](): Promise<void>;

  /**
   * Generates a payload message for client credentials.
   *
   * @return Message body as defined in OAuth2 spec.
   */
  getClientCredentialsBody(): string;

  /**
   * Requests a token for `client_credentials` request type.
   * 
   * This method resolves the main promise set by the `authorize()` function.
   *
   * @returns Promise resolved to a token info object.
   */
  [authorizePassword](): Promise<void>;

  /**
   * Generates a payload message for password authorization.
   *
   * @return Message body as defined in OAuth2 spec.
   */
  getPasswordBody(): string;

  /**
   * Performs authorization on custom grant type.
   * This extension is described in OAuth 2.0 spec.
   * 
   * This method resolves the main promise set by the `authorize()` function.
   *
   * @returns Promise resolved when the request finish.
   */
  [authorizeCustomGrant](): Promise<void>;

  /**
   * Generates a payload message for the custom grant.
   *
   * @return {string} Message body as defined in OAuth2 spec.
   */
  getCustomGrantBody(): string;
}