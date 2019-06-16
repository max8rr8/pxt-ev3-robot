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
// function pauseUntil(condition: () => boolean, timeOut?: number): void {}

interface electronicSettings {
  rightMotor: motors.Motor;
  leftMotor: motors.Motor;
  rightSensor: sensors.ColorSensor;
  leftSensor: sensors.ColorSensor;
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
  Right
}

class Robot {
  settings: RobotSettings;
  constructor(settings: RobotSettings) {
    this.settings = settings;
    let lM = this.settings.electronic.leftMotor;
    lM.stop();
    lM.reset();
    lM.setPauseOnRun(false);
    let rM = this.settings.electronic.leftMotor;
    rM.stop();
    rM.reset();
    rM.setPauseOnRun(false);

    this.readDataFromSensor(Side.Left);
    this.readDataFromSensor(Side.Right);
  }

  readDataFromSensor(side: Side): number {
    let sensor =
      side == Side.Right
        ? this.settings.electronic.rightSensor
        : this.settings.electronic.leftSensor;

    let errK =
      side == Side.Right ? this.settings.error.kRightSensor : this.settings.error.kLeftSensor;
    return sensor.reflectedLight() * errK;
  }

  readTacho(side: Side): number {
    let motor =
      side == Side.Right
        ? this.settings.electronic.rightMotor
        : this.settings.electronic.leftMotor;

    let errK =
      side == Side.Right ? this.settings.error.kRightWheel : this.settings.error.kLeftWheel;
    return motor.angle() / errK;
  }

  runMotor(side: Side, speed: number) {
    let motor =
      side == Side.Right
        ? this.settings.electronic.rightMotor
        : this.settings.electronic.leftMotor;
    let errK =
      side == Side.Right ? this.settings.error.kRightWheel : this.settings.error.kLeftWheel;
    motor.run(speed * errK);
  }

  stopMotor(side: Side) {
    let motor =
      side == Side.Right
        ? this.settings.electronic.rightMotor
        : this.settings.electronic.leftMotor;
    motor.stop();
  }

  moveWheel(
    side: Side,
    speed: number,
    until: () => boolean = () => false,
    stop: boolean = true
  ) {
    this.runMotor(side, speed);
    pauseUntil(() => {
      return until();
    });
    if (stop) this.stopMotor(side);
  }

  moveWheels(
    speedRight: number,
    speedLeft: number,
    until: () => boolean = () => false,
    stop: boolean = true
  ) {
    this.runMotor(Side.Left, speedLeft);
    this.runMotor(Side.Right, speedRight);
    pauseUntil(() => {
      return until();
    });
    if (stop) this.stopMotor(Side.Left);
    if (stop) this.stopMotor(Side.Right);
  }

  moveAhead(until: () => boolean = () => false,stop: boolean){
    this.moveWheels(this.settings.electronic.speed,this.settings.electronic.speed,until,stop)
  }

  untilTime(time: number): () => boolean {
    let startTime = control.millis();
    return () => {
      return control.millis() - startTime > time;
    };
  }

  untilBlack(side: Side){
    return ()=>{
      return this.readDataFromSensor(side) < this.settings.line.black
    }
  }

  untilCm(side: Side, cm: number): () => boolean {
    let k = this.settings.construction.wheelDiameter * Math.PI 
    let startPos = this.readTacho(side)
    return () => {
      return this.readTacho(side) - startPos > (cm / k) * 360  ;
    };
  }
}
