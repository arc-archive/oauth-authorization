/* eslint-disable class-methods-use-this */
import { OAuth2AuthorizeEvent } from '@advanced-rest-client/arc-events';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin';
import { Authorization } from '@advanced-rest-client/arc-types'

export declare const authorizeHandler: unique symbol;

/**
 * An element that utilizes the `OAuth2Authorization` class in a web component.
 * It handles DOM events to perform the authorization.
 */ 
export class OAuth2AuthorizationElement extends EventsTargetMixin(HTMLElement) {
  constructor();

  _attachListeners(node: EventTarget): void;

  _detachListeners(node: EventTarget): void;

  [authorizeHandler](e: OAuth2AuthorizeEvent): void;

  /**
   * Authorize the user using provided settings.
   * This is left for compatibility. Use the `OAuth2Authorization` instead.
   *
   * @param settings The authorization configuration.
   */
  authorize(settings: Authorization.OAuth2Authorization): Promise<Authorization.TokenInfo>;
}
