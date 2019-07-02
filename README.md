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
    tachoErr: 10, // Error of your tacho sensor on motors
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

You can also change speed directly in program

```ts
robot.setSpeed(10);
```

## Logger

There are log in this lib you can log to it using

```ts
robot.log('test');
```

and this message will be sended to log

You can read log in file located in //home/root/lms2012/prjs/log.txt on ev3 and on screen using button up and button down to scroll it

Log is created using class Logger you can access to it in

```ts
robot.logger;
```

In log you can see time time starts from last call of logger.setTime

```ts
robot.logger.setTime();
```

You can also wait until smth using logger.wait and it will display message on screen

```ts
robot.logger.wait(() => false, 'Infinity wait');
```

There also method to send smth to file

```ts
robot.logger.logToFile('This string will be in file');
```

And method display used to display log, but don`t use it, it calls automaticly

## Usefull program things

Whe you start your robot and wait for press enter button, you can use startCycle, it will wait unyil button wil be pressed and call logger.setTime

```ts
robot.startCycle();
```

There are also method for convert number(0-10) to sound

```ts
music.playSoundEffect(robot.getSoundFromNumber(0));
```

When you reach point in your program for example collectFirst, moveToZone, scan use robot.point it will write in log about that and beep two times

```ts
robot.point('scan');
```

When your robot do something uncorrect use robot.breakPoint, with number it will say number aloud, log to log, and pause for 3 seconds

```ts
robot.breakPoint('breakpoint');
```

There also setDebugLevel it need for what your robot do, debug levels
4 - normal
3 - log moveLine, moveAhead, rotate
2 - log until methods
1 - log moveWheel, moveWheels, stopWheels

```ts
robot.setDebugLevel(3);
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

There are methods to get motor and sensor and their k passed to robot parameters
Use that way to work with sensors and motors, use `robot.getMotor(Side.Left)` instead `motors.mediumB`

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

There are methods to control motors but that is not good way to control your robot

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
robot.moveWheels(50, 50, robot.untilTime(10000), false);
```

## Robot movements

Move Ahead is used to MOVE AHEAD. It uses speed specified in parameters of robot

```ts
// Move ahead until 10 cm
robot.moveAhead(robot.untilCm(Side.Left, 10));
//You can also specify if you want to stop motors
robot.moveAhead(robot.untilBlack(Side.Left), false);
```

There also move backward
```ts

// Move ahead until 10 cm
robot.moveBackward(robot.untilCm(Side.Left, 10));
//You can also specify if you want to stop motors
robot.moveBackward(robot.untilBlack(Side.Left), false);
```

You can also move using two sensors and line

```ts
//Move line until black
robot.moveLine(robot.untilBlack(Side.Left));
//And also with dont stop motors
robot.moveLine(robot.untilCm(Side.Left, 10), false);
```

There are also methods for move using one sensor
But it is recomended to use two sensors instead one

```ts
//Move line until black using left sensor
robot.moveLineOne(Side.Left, robot.untilBlack(Side.Left));
//And also with dont stop motors using right sensor
robot.moveLineOne(robot.untilCm(Side.Left, 10), false);
```

You can rotate robot using rotate method

```ts
//Rotate robot to left 90
robot.rotate(Side.Left);

//Rotate robot to right 45
robot.rotate(Side.Right, 45);
```

There are third parameter point rotate
It specifies point around which you want to turn

```
Examples
- robot parts
+ point of rotate
| whee;

  Point: 0       Point: -1      Point: 1
|-----+-----|  +-----------|  |----------+|

  Point: 0.5    Point 2
|-------+---|  |-----------|           +
```

## PID

There are class that representate pid regulator used in moveLine

```ts
//Example creation with kP=0.3, kI=0, kD=0.3
let regulator = new PID(0.3, 0, 0.3);
```

When you want to get new correction from error use update

```ts
regulator.update(5);
```

## Manipulator

For controlling manipulaters better use manipulator

```ts
//Create manipulator with speed -30
let manipulator = new Manipulator(-30);
```

To move manipulator to break use toBreak

```ts
//Rotates for speed -30
manipulator.toBreak(ManipulatorDirection.normal);

//Rotates for speed 30
manipulator.toBreak(ManipulatorDirection.inverted);
```

Or to use to any pos from start use toPos

```ts
//Move to pos 20
manipultor.toPos(20);
```

You can pass second parameter as false if you do not want to stop programm execution 

## Scanner
When you want to scan correct data use scanner class, it wil scan only when see one data more than samplesFilter

```ts
// Example creation
let scanner = new Scanner({
    onDetected: (data: number) => robot.log(data.toString()),
    scan: ()=>sensors.color1.color(),
    samplesFilter: 3
})
```
To proccess one meagurement use read
```ts
scanner.read()
```

But you can use scanner in parallel thread, using start and stop
```ts
scanner.start()
pause(2000)
scanner.stop()
```
