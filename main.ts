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

interface electronicSettings {
  rightMotor: motors.Motor;
  leftMotor: motors.Motor;
  rightSensor: sensors.ColorSensor;
  leftSensor: sensors.ColorSensor;
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

class Robot {
  settings: RobotSettings;
  constructor(settings: RobotSettings) {
    this.settings = settings;
  }
}
