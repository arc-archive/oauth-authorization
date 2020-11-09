import {OAuth2AuthorizationElement} from './src/OAuth2AuthorizationElement.js';

declare global {
  interface HTMLElementTagNameMap {
    "oauth2-authorization": OAuth2AuthorizationElement;
  }
}
