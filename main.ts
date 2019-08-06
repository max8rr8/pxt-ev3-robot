// - - - - - - - - - - - - - - -
// - M - - - - - - - - - - - - -
// - - M - - - - - - - - - - - -
// - - - M - - - - - - - - - - -
// - - - - M - - - - - - - - - -
// - - - M - - - - - - - - - - -
// - - M - - - - - - - - - - - -
// - M - - - - - A A A X X X - -
// - - - - - - - - - - - - - - -

// import '../core/output';
// import '../color-sensor/color';
// import '../base/shims';

interface electronicSettings {
  rightMotor: Output;
  leftMotor: Output;
  rightSensor: sensors.ColorSensor;
  leftSensor: sensors.ColorSensor;
  isLarge: boolean;
  alfaSensor?: sensors.ColorSensor;
  betaSensor?: sensors.ColorSensor;
  speed: number;
}

interface constructionSettings {
  wheelDiameter: number;
  distanceBeetwenWheels: number;
  distanceBeetwenBaseAndSensors: number;
}

interface errorSettings {
  tachoErr: number;
  kRightWheel: number;
  kLeftWheel: number;
  kRightSensor: number;
  kLeftSensor: number;
  kAlfaSensor?: number;
  kBetaSensor?: number;
}

interface lineSettings {
  kP: number;
  kI: number;
  kD: number;
  black: number;
  white: number;
}

interface RobotSettings {
  electronic: electronicSettings;
  construction: constructionSettings;
  error: errorSettings;
  line: lineSettings;
}

interface ScannerSettings {
  samplesFilter: number;
  scan: () => number;
  onDetected: (data: number) => void;
}

enum Side {
  Left,
  Right,
  Alfa,
  Beta,
  Both
}

enum ManipulatorDirection {
  normal = 1,
  inverted = -1
}

class Logger {
  logList: string[];
  logLevel: number;
  pos: number;
  storage: storage.Storage;
  startTime: number;

  constructor(logLevel: number = 4) {
    this.startTime = 0;
    this.logLevel = logLevel;
    this.pos = 0;
    this.logList = [
      '',
      'Robot----------------',
      '-------- pxt     ----',
      '-M------ pxt-ev3 ----',
      '--M----- ts(js)  ----',
      '---M---- lego    ----',
      '----M--- MS      ----',
      '---M-----------------',
      '--M------------------',
      '-M-----AAAXXX--------',
      '---------------------'
    ];
    this.storage = new storage.Storage();
    this.storage.remove('/home/root/lms2012/prjs/log.txt');
    this.logList.forEach(e => {
      this.logToFile(e);
    });
    brick.buttonUp.onEvent(ButtonEvent.Pressed, () => {
      this.pos -= 4;
      this.display();
    });

    brick.buttonDown.onEvent(ButtonEvent.Pressed, () => {
      this.pos += 4;
      this.display();
    });
  }

  setTime() {
    this.startTime = control.millis();
  }

  logToFile(text: string) {
    this.storage.appendLine('/home/root/lms2012/prjs/log.txt', text);
    this.storage.limit('/home/root/lms2012/prjs/log.txt', 65536);
  }

  log(text: string, level: number = 4) {
    if (this.logLevel > level) return;
    console.log(text);
    if (this.logList.length >= 12) this.pos++;
    let time = (control.millis() - this.startTime) / 1000;
    this.logList.push('[' + time.toString().substr(0, 5) + '] ' + text);
    this.logToFile('[' + time.toString().substr(0, 5) + '] ' + text);
    this.display();
  }

  display() {
    brick.clearScreen();
    for (let i = 0; i < 13; i++) {
      if (!this.logList[i + this.pos]) continue;
      brick.showString(this.logList[i + this.pos], i + 1);
    }
  }

  wait(condition: () => boolean, text: string) {
    this.pos++;
    let id = this.logList.length;
    let els = ['|', '/', '-', '\\'].map(e => text + ' ' + e);
    pauseUntil(() => {
      this.logList[id] = els[Math.floor((control.millis() / 400) % 4)];
      this.display();
      return condition();
    });
    this.logList.pop();
    this.pos--;
    this.display();
  }
}

class PID {
  summErr: number;
  lastErr: number;
  k: number[];
  constructor(kP: number, kI: number, kD: number) {
    this.summErr = 0;
    this.lastErr = 0;
    this.k = [kP, kI, kD];
  }

  update(err: number): number {
    let pErr = err * this.k[0];

    this.summErr += err;
    let iErr = this.summErr * this.k[1];

    let dErr = (err - this.lastErr) * this.k[2];

    return pErr + iErr + dErr;
  }
}

class Manipulator {
  motor: motors.Motor;
  speed: number;

  constructor(motor: motors.Motor, speed: number = 30) {
    this.motor = motor;
    this.speed = speed;
    this.motor.setPauseOnRun(false);
  }

  toBreak(mode: ManipulatorDirection, realPause: boolean = true) {
    this.motor.setRegulated(false);
    this.motor.run(this.speed * mode);
    pause(200);
    let pauseUntilReady = () => {
      pauseUntil(() => Math.abs(this.motor.speed()) < Math.abs(this.speed * 0.2));
      this.motor.run(this.speed * 0.2 * mode);
      if (mode == ManipulatorDirection.normal) this.motor.clearCounts();
    };
    if (realPause) pauseUntilReady();
    else control.runInParallel(pauseUntilReady);
  }

  toPos(dgr: number, pause: boolean = true) {
    this.motor.setRegulated(true);
    this.motor.setBrake(true);
    this.motor.stop();
    if (this.motor.angle() == dgr) return;
    let k = this.motor.angle() - dgr > 0 ? -1 : 1;
    let r = this.speed < 0 ? -1 : 1;
    this.motor.run(this.speed * k, Math.abs(this.motor.angle() * r - dgr), MoveUnit.Degrees);
    if (pause) this.motor.pauseUntilReady();
  }
}

class Scanner {
  settings: ScannerSettings;
  isRunning: boolean;
  lastData: number;
  lastSamples: number;
  lastNorm: number;
  constructor(settings: ScannerSettings) {
    this.settings = settings;
    this.isRunning = false;
    this.lastData = -1;
    this.lastNorm = -1;
    this.lastSamples = 0;
  }

  update(data: number) {
    if (data == this.lastData) {
      this.lastSamples++;
      if (this.lastNorm != data && this.lastSamples == this.settings.samplesFilter) {
        this.settings.onDetected(data);
        this.lastNorm = data;
      }
    } else {
      this.lastSamples = 0;
      this.lastData = data;
    }
  }

  read() {
    this.update(this.settings.scan());
  }

  start() {
    this.isRunning = true;
    control.runInParallel(() => {
      while (this.isRunning) {
        this.read();
        pause(50);
      }
    });
  }

  stop() {
    this.isRunning = false;
  }
}

class Robot {
  settings: RobotSettings;
  logger: Logger;
  rotateRobotControl: boolean;

  leftMotor: motors.Motor;
  rightMotor: motors.Motor;
  bothMotors: motors.Motor;

  constructor(settings: RobotSettings) {
    this.settings = settings;
    this.logger = new Logger();
    this.logger.display();
    this.rotateRobotControl = true;

    let lM = new motors.Motor(
      this.settings.electronic.leftMotor,
      this.settings.electronic.isLarge
    );
    let rM = new motors.Motor(
      this.settings.electronic.rightMotor,
      this.settings.electronic.isLarge
    );
    let bM = new motors.Motor(
      this.settings.electronic.leftMotor | this.settings.electronic.rightMotor,
      this.settings.electronic.isLarge
    );

    lM.reset();
    lM.setPauseOnRun(false);
    lM.setBrake(true);
    rM.reset();
    rM.setPauseOnRun(false);
    rM.setBrake(true);
    bM.setBrake(true);
    bM.stop();

    this.leftMotor = lM;
    this.rightMotor = rM;
    this.bothMotors = bM;
    // this.getSensor(Side.Left).reset()
    // this.getSensor(Side.Right).reset()
    // this.readDataFromSensor(Side.Left);
    // this.readDataFromSensor(Side.Right);
  }

  disableRobotMotorControl() {
    this.rotateRobotControl = false;
  }

  startCycle() {
    this.logger.wait(() => brick.buttonEnter.wasPressed(), 'Press enter');
    pause(100);
    this.logger.setTime();
    this.point('START');
  }

  getSoundFromNumber(num: number): Sound {
    if (num == 1) return sounds.numbersOne;
    if (num == 2) return sounds.numbersTwo;
    if (num == 3) return sounds.numbersThree;
    if (num == 4) return sounds.numbersFour;
    if (num == 5) return sounds.numbersFive;
    if (num == 6) return sounds.numbersSix;
    if (num == 7) return sounds.numbersSeven;
    if (num == 8) return sounds.numbersEight;
    if (num == 9) return sounds.numbersNine;
    if (num == 10) return sounds.numbersTen;

    return sounds.numbersZero;
  }

  log(text: string, level: number = 4) {
    this.logger.log(text, level);
  }

  point(name: string) {
    this.logger.log('@' + name, 10);
    control.runInParallel(function() {
      music.playTone(Note.A, 100);
      pause(100);
      music.playTone(Note.A, 100);
    });
  }

  breakPoint(num: number) {
    motors.stopAll();
    this.log('BREAKPOINT: ' + num.toString());
    music.playSoundEffectUntilDone(this.getSoundFromNumber(num));
    this.logger.wait(this.untilTime(3000), 'BREAKPOINT');
  }

  setDebugLevel(num: number) {
    this.logger.logLevel = num;
  }

  setSpeed(speed: number) {
    this.log('Set speed to ' + speed.toString(), 0);
    this.settings.electronic.speed = speed;
  }

  setRegulation(stat: boolean) {
    this.getMotor(Side.Left).setRegulated(stat);
    this.getMotor(Side.Right).setRegulated(stat);
  }

  pause(until: () => boolean) {
    pauseUntil(until);
  }

  getSensor(side: Side): sensors.ColorSensor {
    if (side == Side.Left) return this.settings.electronic.leftSensor;
    if (side == Side.Right) return this.settings.electronic.rightSensor;
    if (side == Side.Alfa) return this.settings.electronic.alfaSensor;
    if (side == Side.Beta) return this.settings.electronic.betaSensor;
    return sensors.color3;
  }

  getSensorK(side: Side): number {
    if (side == Side.Left) return this.settings.error.kLeftSensor;
    if (side == Side.Right) return this.settings.error.kRightSensor;
    if (side == Side.Alfa) return this.settings.error.kAlfaSensor;
    if (side == Side.Beta) return this.settings.error.kBetaSensor;
    return 1;
  }

  getMotor(side: Side): motors.Motor {
    if (side == Side.Left) return this.leftMotor;
    if (side == Side.Right) return this.rightMotor;
    return this.bothMotors;
  }

  getMotorK(side: Side): number {
    if (side == Side.Left) return this.settings.error.kLeftWheel;
    if (side == Side.Right) return this.settings.error.kRightWheel;
    return 1;
  }

  getSideK(side: Side) {
    if (side == Side.Left) return 1;
    if (side == Side.Right) return -1;
    return 0;
  }

  calcRotateData(degrees: number, pointRotate: number, rotateK: number) {
    let j = [-1 - pointRotate, 1 - pointRotate];
    let k = this.settings.electronic.speed / Math.max(Math.abs(j[0]), Math.abs(j[1]));
    let d = [
      (this.settings.construction.distanceBeetwenWheels / 2) * j[0],
      (this.settings.construction.distanceBeetwenWheels / 2) * j[1]
    ];
    let l = (2 * degrees) / this.settings.construction.wheelDiameter;
    return [j[0] * k, j[1] * k, d[0] * l, d[1] * l].map(e => e * rotateK);
  }

  readDataFromSensor(side: Side): number {
    return this.getSensor(side).reflectedLight() * this.getSensorK(side);
  }

  readTacho(side: Side): number {
    if (side == Side.Both)
      return (
        (this.getMotor(Side.Left).angle() / this.getMotorK(Side.Left) +
          this.getMotor(Side.Right).angle() / this.getMotorK(Side.Right)) /
        2
      );
    return this.getMotor(side).angle() / this.getMotorK(side);
  }

  runMotor(side: Side, speed: number) {
    this.getMotor(side).run(speed * this.getMotorK(side));
  }

  stopMotor(side: Side) {
    this.getMotor(side).stop();
  }

  stopWheels() {
    this.log('Stop wheels', 1);
    this.setRegulation(false)
    this.bothMotors.setRegulated(false)
    this.bothMotors.stop();
    pause(250);
  }

  moveWheel(side: Side, speed: number, until: () => boolean, stop: boolean = true) {
    this.log('Move wheel', 1);
    this.runMotor(side, speed);
    this.pause(until);
    if (stop) this.stopMotor(side);
  }

  moveWheels(
    speedLeft: number,
    speedRight: number,
    until: () => boolean,
    stop: boolean = true
  ) {
    this.log('Move wheels', 1);
    this.runMotor(Side.Left, speedLeft);
    this.runMotor(Side.Right, speedRight);
    this.pause(until);
    if (stop) this.stopWheels();
  }

  moveAhead(until: () => boolean, stop: boolean = true, isRegulted = true) {
    this.log('Move ahead', 3);
    this.setRegulation(isRegulted);
    this.moveWheels(
      this.settings.electronic.speed,
      this.settings.electronic.speed,
      until,
      stop
    );
  }

  moveBackward(until: () => boolean, stop: boolean = true, isRegulted = true) {
    this.log('Move ahead', 3);
    this.setRegulation(isRegulted);
    this.moveWheels(
      -this.settings.electronic.speed,
      -this.settings.electronic.speed,
      until,
      stop
    );
  }

  moveLine(until: () => boolean, stop: boolean = true) {
    this.log('Move line', 3);
    this.setRegulation(false);
    let regulator = new PID(
      this.settings.line.kP,
      this.settings.line.kI,
      this.settings.line.kD
    );
    let speed = this.settings.electronic.speed + 5;
    this.pause(() => {
      let err: number =
        this.readDataFromSensor(Side.Left) - this.readDataFromSensor(Side.Right);
      let res = regulator.update(err);
      this.runMotor(Side.Left, speed + res);
      this.runMotor(Side.Right, speed - res);
      return until();
    });
    if (stop) this.stopWheels();
  }

  moveLineOne(sensor: Side, side: Side, until: () => boolean, stop: boolean = true) {
    this.log('Move line one', 3);
    this.setRegulation(false);
    let regulator = new PID(
      this.settings.line.kP,
      this.settings.line.kI,
      this.settings.line.kD
    );
    let speed = this.settings.electronic.speed + 5;
    let line = this.settings.line.black + this.settings.line.white;
    line *= 0.5;
    this.pause(() => {
      let err: number = this.getSideK(side) * (this.readDataFromSensor(sensor) - line);
      let res = regulator.update(err);
      this.runMotor(Side.Left, speed + res);
      this.runMotor(Side.Right, speed - res);
      return until();
    });
    if (stop) this.stopWheels();
  }

  rotate(rotateSide: Side, degrees = 90, pointRotate = 0) {
    this.log('Rotate', 3);
    this.setRegulation(true);
    let k = this.getSideK(rotateSide);
    let data = this.calcRotateData(degrees, pointRotate, k);
    let untilData: number[] = [];
    if (Math.abs(data[0]) >= Math.abs(data[1])) untilData = [Side.Left, data[2]];
    if (Math.abs(data[1]) > Math.abs(data[0])) untilData = [Side.Right, data[3]];
    this.moveWheels(data[0], data[1], this.untilDegrees(untilData[0], untilData[1]));
  }

  rotateLine(rotateSide: Side, linesSensor: Side) {
    this.log('Rotate line', 3);
    let k = this.getSideK(rotateSide) * this.settings.electronic.speed;
    this.setRegulation(true);
    this.moveWheels(-k, k, this.untilBlack(linesSensor));
  }

  rotateDouble(rotateSide: Side, degrees = 90, lineSensor: Side, pointRotate = 0) {
    this.log('Rotate double', 3);
    this.setRegulation(true);
    let k = this.getSideK(rotateSide);
    let data = this.calcRotateData(degrees, pointRotate, k);
    let untilData: number[] = [];
    if (Math.abs(data[0]) >= Math.abs(data[1])) untilData = [Side.Left, data[2]];
    if (Math.abs(data[1]) > Math.abs(data[0])) untilData = [Side.Right, data[3]];
    this.moveWheels(data[0], data[1], this.untilBoth(
      this.untilDegrees(untilData[0], untilData[1]),
      this.untilBlack(lineSensor)
    ));
  }

  untilTime(time: number): () => boolean {
    this.log('Until time', 2);
    let startTime = control.millis();
    return () => {
      return control.millis() - startTime > time;
    };
  }
  untilBlack(side: Side) {
    this.log('Until black', 2);
    return () => {
      if(side !== Side.Both)
        return this.readDataFromSensor(side) < this.settings.line.black;
      else 
        return this.readDataFromSensor(Side.Right) < this.settings.line.black &&
               this.readDataFromSensor(Side.Left) < this.settings.line.black 
    };
  }

  untilDegrees(side: Side, dgr: number): () => boolean {
    this.log('Until degrees', 2);
    let startPos = this.readTacho(side);
    return () => {
      return (
        Math.abs(this.readTacho(side) - startPos) > Math.abs(dgr) - this.settings.error.tachoErr
      );
    };
  }

  untilCm(side: Side, cm: number): () => boolean {
    this.log('Until cm', 2);
    let k = this.settings.construction.wheelDiameter * Math.PI;
    return this.untilDegrees(side, (cm / k) * 360);
  }

  untilBoth(first: () => boolean, second: () => boolean): () => boolean{
    let stat = 0
    return () => {
      if(stat == 1) return second()
      if(stat == 0) if(first()) stat = 1
      return false;
    }
  }
}
