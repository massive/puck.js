// @ts-ignore
import * as kb from "./modules/ble_hid_keyboard";
import {blink, debounce} from "./lib";

const RELEASE = false;

let sleepTimer: NodeJS.Timeout;
let reportInterval: NodeJS.Timeout;

let sleepState: SleepStates;
enum SleepStates {
  AWAKE, SLEEPING
}

enum ClickType {
  SINGLE, DOUBLE
}

let buttonPress: ClickType;

const sleepTimeout = 1000 * 60 * 10;

function assignSleeptimer() {
  sleepTimer = setTimeout(() => {
    sleep();
  }, sleepTimeout);
}

function showReport() {
  console.log(new Date());
  console.log(`Battery: ${Puck.getBatteryPercentage()}`);
}

// @ts-ignore
NRF.on('connect', (_) => {
  showReport();
  blink(LED2, 2000);
});

function onInit() {
  if (reportInterval) clearInterval(reportInterval);
  setInterval(showReport, sleepTimeout);
  showReport();

  const keyboardSrvc = {
    0x180a: {
      0x2a50: {
        value: [
          0x01,           /* Use USB Vendor IDs */
          0xac, 0x05,     /* Apple */
          0x5a, 0x02,     /* Internal Keyboard */
          0x00, 0x00
        ],
        readable: true,
      }
    }
  };

  const batterySrvc = {
    0x180F: { // Battery Service
      0x2A19: {  // Battery Level
        readable: true,
        notify: true,
        value: [Puck.getBatteryPercentage()]
      }
    }
  };

  const services = Object.assign({}, ...[keyboardSrvc, batterySrvc]);

  NRF.setServices(services, {
    advertise: [0x180a, 0x180f],
    hid: kb.report
  });

  [LED1, LED2, LED3].map((l, i) => {
    l.set();
    setTimeout(() => l.reset(), 1000);
  });

  setWatch(btnPressed, BTN, {
    edge: "both",
    repeat: true,
    debounce: 50
  });

  // NRF.setLowPowerConnection(true);

  assignSleeptimer();
}

function sleep() {
  console.log("Sleeping");
  ledOn(LED1, 2000);
  setTimeout(() => {
    sleepState = SleepStates.SLEEPING;
    NRF.disconnect();
    NRF.sleep();
  }, 2000);
}

function wake() {
  NRF.wake();
  sleepState = SleepStates.AWAKE;
  ledOn(LED2, 1000);
  console.log("Waking up");
}

function reinitSleep() {
  if (sleepTimer !== null && sleepTimer !== undefined) clearTimeout(sleepTimer);
  if (sleepState == SleepStates.SLEEPING) wake();
  assignSleeptimer();
}

function btnPressed(e: Event) {
  reinitSleep();

  // Down
  if (e.state) {
    buttonDown();
    clickCheck(e);
  // Up
  } else {
    buttonUp();
  }
}

type Event = {
  state: boolean
  time: number
  lastTime: number
}

function clickCheck(e: Event) {
  console.log(e);
  const timeDiff = e.time - e.lastTime;
  if (timeDiff > 0.7 || isNaN(timeDiff)) {
    buttonPress = ClickType.SINGLE;
    setTimeout(() => {
      if (buttonPress == ClickType.SINGLE) singleClick();
    }, 500);
  } else {
    doubleClick();
    buttonPress = ClickType.DOUBLE;
  }
}

const muteToggle = (() => {
  console.log("Toggle created");
  return debounce(() => {
    console.log("Toggle triggered");
    kb.tap(kb.KEY.M, kb.MODIFY.SHIFT | kb.MODIFY.GUI);
  }, 200);
})();

function singleClick() {
  console.log("Single");
  // no-op
}

function doubleClick() {
  console.log("Double");
  muteToggle();
  ledOn(LED2);
}

function buttonDown() {
  console.log("Down");
  LED3.set();
  muteToggle();
}

function buttonUp() {
  console.log("Up");
  muteToggle();
  LED3.reset();
}

function ledOn(led: Pin, duration = 500) {
  led.write(true);
  setTimeout(() => led.write(false), duration);
}

if (RELEASE) {
  // save code to flash, to make code permanent
  setTimeout(save,1E3);
} else {
  // or just start onInit, typical way if you are still developing and testing
  setTimeout(onInit,1E3);
}