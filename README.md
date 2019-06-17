# Ev3 robot

Library for creating powerfull robots using makecode and ev3

```ts
//Example cretion of robot
let robot = new Robot({
  construction: {
    distanceBeetwenWheels: 14.5,
    distanceBeetwenBaseAndSensors: 12.5,
    wheelDiameter: 8.16
  },
  electronic: {
    leftMotor: motors.mediumB,
    rightMotor: motors.mediumC,
    leftSensor: sensors.color2,
    rightSensor: sensors.color3,
    alfaSensor: sensors.color1, // Use on only when you have more than 2 sensors
    betaSensor: sensors.color4, // Use on only when you have more than 3 sensors
    speed: 50 //Standart speed of robot
  },
  error: {
    kLeftSensor: 1, // k of left sensor, data from left sensor calculates using leftSensor.reflectedLight() * kLeftSensor
    kRightSensor: 1, // k of right sensor, same as kLeftSensor but for right
    kAlfaSensor: 1, //Use only when use alfaSensor
    kBetaSensor: 1, //Use only when use betaSensor
    kLeftWheel: 1, //k of left wheel, speed calculates using speed * kLeftWheel
    kRightWheel: -1 //k of right wheel, same as kLeftWheel, but for right
  },
  line: {
    // k of PID-regulator
    kP: 1,
    kI: 0,
    kD: 10,
    black: 20, // Reflected light on black
    white: 20 // Reflected light on white
  }
});
```

## Pause

This lib use until methods. There are method pause that takes function, and stop when function return false, example:

```ts
//Randomly pause
robot.pause(() => Math.random() > 0.5);
```

### There are also ready-to-use until methods

Method untilTime uses to wait miliseconds

```ts
// Pause for 2.8 seconds
robot.pause(robot.untilTime(2500));
```

Method untilBlack uses to wait until sensor see black

```ts
// Pause until left sensot see black
robot.pause(robot.untilBlack(Side.Left));
```

Method untilCm uses to wait until wheel get rotated to x cm

```ts
// Pause until left wheel wil be rotated to 10 cm
robot.pause(robot.untilCm(Side.Left, 10));
```

Method untilDegrees uses to wait until wheel get rotated to x degrees

```ts
// Pause until left wheel wil be rotated to 180 degrees
robot.pause(robot.untilDegrees(Side.Left, 180));
```

## Getting sensors, motors and their data

You can get motor and it errorK (k\_\_\_\_Wheel) using methods getMotor and getMotorK

```ts
// Getting left motor
robot.getMotor(Side.Left);
// End kRightWheel
robot.getMotorK(Side.Right);
```

You can get sensor and it errorK (k\_\_\_\_Sensor) using methods getSensor and getSensorK

```ts
// Getting alfa sensor
robot.getSensor(Side.Alfa);
// End kBetaSensor
robot.getSensorK(Side.Beta);
```

You can read degrees from motor

```ts
// Reading degrees from left motor
robot.readTacho(Side.Left);
```

You can also read data from sensor

```ts
// Reading degrees from left sensor
robot.readDataFromSensor(Side.Left);
```

## Motors

You can simply turn on or stop your motor

```ts
// Start left motor with 50 speed
robot.runMotor(Side.Left, 50);

//And stop it
robot.stopMotor(Side.Left);
```

But more efficent way use moveWheel

```ts
//Turn on motor and dont stop it until left sensor see black line
robot.moveWheel(Side.Left, 50, robot.untilBlack(Side.Left));

//You can also give last parameter when you not want to stop motor
robot.moveWheel(Side.Left, 50, robot.untilBlack(Side.Left), false);

//Exaple rotation for
robot.moveWheel(Side.Left, 50, robot.untilDegrees(Side.Left, 100), false); // 100 degress
//And
robot.moveWheel(Side.Left, 50, robot.untilCm(Side.Left, 10), false); // 10 cm
```

You can also move two motors 
```ts
//Moves two wheels with speed 50 left and  50 right until 10 seconds than dont stop it
robot.moveWheels(50, 50, robot.untilTime(10000), false)
```

### There are more efficent ways to control movement

Move Ahead is used to MOVE AHEAD. It uses speed specified in parameters of robot
```ts
// Move ahead until 10 cm
robot.moveAhead(robot.untilCm(Side.Left, 10))
//You can also specify if you want to stop motors
robot.moveAhead(robot.untilBlack(Side.Left), false)
```
