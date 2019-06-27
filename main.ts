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
  rightMotor: motors.Motor;
  leftMotor: motors.Motor;
  rightSensor: sensors.ColorSensor;
  leftSensor: sensors.ColorSensor;
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

enum Side {
  Left,
  Right,
  Alfa,
  Beta
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

class Robot {
  settings: RobotSettings;
  constructor(settings: RobotSettings) {
    this.settings = settings;
    let lM = this.settings.electronic.leftMotor;
    lM.stop();
    lM.reset();
    lM.setPauseOnRun(false);
    lM.setBrake(true);
    let rM = this.settings.electronic.leftMotor;
    rM.stop();
    rM.reset();
    rM.setPauseOnRun(false);
    rM.setBrake(true);

    this.readDataFromSensor(Side.Left);
    this.readDataFromSensor(Side.Right);
  }

  setRegulation(stat: boolean) {
    this.settings.electronic.rightMotor.setRegulated(stat);
    this.settings.electronic.leftMotor.setRegulated(stat);
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
    if (side == Side.Left) return this.settings.electronic.leftMotor;
    if (side == Side.Right) return this.settings.electronic.rightMotor;
    return motors.largeA;
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
    let l =  degrees / this.settings.construction.wheelDiameter;
    return [j[0] * k, j[1] * k, d[0] * l, d[1] * l].map(e=>e*rotateK);
  }

  readDataFromSensor(side: Side): number {
    return this.getSensor(side).reflectedLight() * this.getSensorK(side);
  }

  readTacho(side: Side): number {
    return this.getMotor(side).angle() / this.getMotorK(side);
  }

  runMotor(side: Side, speed: number) {
    this.getMotor(side).run(speed * this.getMotorK(side));
  }

  stopMotor(side: Side) {
    this.getMotor(side).stop();
  }

  moveWheel(side: Side, speed: number, until: () => boolean, stop: boolean = true) {
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
    this.runMotor(Side.Left, speedLeft);
    this.runMotor(Side.Right, speedRight);
    this.pause(until);
    if (stop) this.stopMotor(Side.Left);
    if (stop) this.stopMotor(Side.Right);
  }

  moveAhead(until: () => boolean, stop: boolean = true) {
    this.setRegulation(true);
    this.moveWheels(
      this.settings.electronic.speed,
      this.settings.electronic.speed,
      until,
      stop
    );
  }

  moveLine(until: () => boolean, stop: boolean = true) {
    this.setRegulation(false);
    let regulator = new PID(
      this.settings.line.kP,
      this.settings.line.kI,
      this.settings.line.kD
    );
    let speed = this.settings.electronic.speed;
    this.pause(() => {
      let err: number =
        this.readDataFromSensor(Side.Left) - this.readDataFromSensor(Side.Right);
      let res = regulator.update(err);
      this.runMotor(Side.Left, speed + res);
      this.runMotor(Side.Right, speed - res);
      return until();
    });
  }

  moveLineOne(sensor: Side, side: Side, until: () => boolean, stop: boolean = true) {
    this.setRegulation(false);
    let regulator = new PID(
      this.settings.line.kP,
      this.settings.line.kI,
      this.settings.line.kD
    );
    let speed = this.settings.electronic.speed;
    let line = this.settings.line.black + this.settings.line.white;
    line *= 0.5;
    this.pause(() => {
      let err: number = this.getSideK(side) * (this.readDataFromSensor(sensor) - line);
      let res = regulator.update(err);
      this.runMotor(Side.Left, speed + res);
      this.runMotor(Side.Right, speed - res);
      return until();
    });
  }

  rotate(rotateSide: Side, degrees = 90, pointRotate = 0) {
    this.setRegulation(true)
    let k = this.getSideK(rotateSide);
    let data = this.calcRotateData(degrees, pointRotate, k)
    let untilData: number[] = []
    if(Math.abs(data[0]) > Math.abs(data[1]))untilData=[Side.Left, data[2]]
    if(Math.abs(data[1]) > Math.abs(data[0]))untilData=[Side.Right, data[3]]
    this.moveWheels(
      data[0],
      data[1],
      this.untilDegrees(untilData[0], untilData[1])
    )
  }

  untilTime(time: number): () => boolean {
    let startTime = control.millis();
    return () => {
      return control.millis() - startTime > time;
    };
  }
  untilBlack(side: Side) {
    return () => {
      return this.readDataFromSensor(side) < this.settings.line.black;
    };
  }

  untilCm(side: Side, cm: number): () => boolean {
    let k = this.settings.construction.wheelDiameter * Math.PI;
    let startPos = this.readTacho(side);
    return () => {
      return this.readTacho(side) - startPos > (cm / k) * 360;
    };
  }

  untilDegrees(side: Side, dgr: number): () => boolean {
    let startPos = this.readTacho(side);
    return () => {
      return this.readTacho(side) - startPos > dgr;
    };
  }
}
