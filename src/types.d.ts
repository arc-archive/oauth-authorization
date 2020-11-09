export declare interface ProcessingOptions {
  /**
   * The number of milliseconds of an interval to check the popup state.
   * Default to 250 ms.
   */
  popupPullTimeout?: number;
  /**
   * The event target on which to listen to the redirect page `message` event.
   * This event should contain a list of authorization parameters returned by the authorization server.
   * 
   * The library contains `oauth-popup.html` page that reads the data from the URL and posts it back to the opener.
   * However, you can create `tokenInfoTranslation` to map returned by the popup parameters to the onces used by the library.
   */
  messageTarget?: EventTarget;
  /**
   * A number of milliseconds after which the iframe triggers a timeout if the response is not present.
   * Defaults to `1020`.
   */
  iframeTimeout?: number;
}