declare var BTN: Pin;

declare var LED1: Pin;

declare var LED2: Pin;

declare var LED3: Pin;

// http://www.espruino.com/json/espruino.json
// https://www.espruino.com/Reference#l_NRF_setServices

declare namespace NRF {

  /**
   * <p>If a device is connected to Espruino, disconnect from it.</p>
   *
   * @url http://www.espruino.com/Reference#l_NRF_disconnect
   */
  function setServices(data: object | undefined, options?: object): void;
}
