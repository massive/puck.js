// @ts-ignore
import * as kb from "./modules/ble_hid_keyboard";
// @ts-ignore
import * as controls from "./modules/ble_hid_telephony";
import {blink, ledOnOff, debounce} from "./lib";

// https://github.com/tomgidden/page-turn-o-matic/blob/master/page-turn-o-matic.js

const RELEASE = false;
const USE_LOW_POWER = false;
const SLEEP_TIMEOUT = 1000 * 60 * 10;
const DOUBLE_CLICK_DETECTION_TIME = 350;
enum MutingTypes {
  TEAMS, 
  TELEPHONY
}

enum SleepStates {
  AWAKE, SLEEPING
}

enum ClickType {
  SINGLE, DOUBLE
}

enum PressStates {
  DOWN, UP
}

type Event = {
  state: boolean
  time: number
  lastTime: number
}

let mutingType: MutingTypes = MutingTypes.TEAMS;
let sleepTimer: NodeJS.Timeout;
let reportInterval: NodeJS.Timeout;
let sleepState: SleepStates;
let buttonPressType: ClickType;
let buttonPressState: PressStates = PressStates.UP;
let buttonUpHandler: Function = () => {};

function assignSleepTimer() {
  sleepTimer = setTimeout(() => {
    sleep();
  }, SLEEP_TIMEOUT);
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
  setInterval(showReport, SLEEP_TIMEOUT);
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
  const report = mutingType === MutingTypes.TEAMS ? kb.report : controls.report;

  NRF.setServices(services, {
    advertise: [0x180a, 0x180f],
    hid: report
  });

  [LED1, LED2, LED3].map((l, i) => {
    l.set();
    setTimeout(() => l.reset(), 1000 + (i * 500));
  });

  setWatch(btnPressed, BTN, {
    edge: "both",
    repeat: true,
    debounce: 50
  });

  if (USE_LOW_POWER) NRF.setLowPowerConnection(true);

  assignSleepTimer();
}

function sleep() {
  console.log("Sleeping");
  blink(LED1, 2000);
  setTimeout(() => {
    sleepState = SleepStates.SLEEPING;
    NRF.disconnect();
    NRF.sleep();
  }, 2000);
}

function wake() {
  NRF.wake();
  sleepState = SleepStates.AWAKE;
  blink(LED2, 2000);
  console.log("Waking up");
}

function reinitSleep() {
  if (sleepTimer !== null && sleepTimer !== undefined) clearTimeout(sleepTimer);
  if (sleepState == SleepStates.SLEEPING) wake();
  assignSleepTimer();
}

function btnPressed(e: Event) {
  reinitSleep();

  // Down
  if (e.state) {
   // buttonDown();
   clickCheck(e);
  // Up
  } else {
    // buttonUp();
  }
}

function clickCheck(e: Event) {
  console.log(e);
  const timeDiff = e.time - e.lastTime;
  console.log(timeDiff);
  if (timeDiff > (DOUBLE_CLICK_DETECTION_TIME/1000) || isNaN(timeDiff)) {
    buttonPressType = ClickType.SINGLE;
    setTimeout(() => {
      if (buttonPressType == ClickType.SINGLE) singleClick();
    }, DOUBLE_CLICK_DETECTION_TIME);
  } else {
    doubleClick();
    buttonPressType = ClickType.DOUBLE;
  }
}

const toggleMute = (() => {
  console.log("Toggle created");
  return debounce(() => {
    console.log("Toggle triggered");
    mute();
  }, 200);
})();


type MuteResolver = Record<MutingTypes, Function>;
function mute(): void {
  const functions: MuteResolver = {
    [MutingTypes.TEAMS]: () => {
      kb.tap(kb.KEY.M, kb.MODIFY.SHIFT | kb.MODIFY.GUI)
      console.log("Teams");
    },
    [MutingTypes.TELEPHONY]: () => {
      controls.mute()
      console.log("Telephony");
    }
  }

  const fun = functions[mutingType]
  fun();
}

function singleClick() {
  console.log("Single");
  mute();
  ledOnOff(LED1, 200);
}

function doubleClick() {
  console.log("Double");
  ledOnOff(LED2, 200);
}

function buttonDown() {
  console.log("Down");
  buttonPressState = PressStates.DOWN;
  setTimeout(() => {
    if (buttonPressState != PressStates.DOWN) return;

    LED3.set();
    toggleMute();
    buttonUpHandler = () => {
      toggleMute();
      LED3.reset();
    }
  }, 300);
}

function buttonUp() {
  console.log("Up");
  buttonUpHandler();
  buttonPressState = PressStates.UP;
  buttonUpHandler = () => {};
}

if (RELEASE) {
  // save code to flash, to make code permanent
  setTimeout(save, 1E3);
} else {
  // or just start onInit, typical way if you are still developing and testing
  setTimeout(onInit, 1E3);
}