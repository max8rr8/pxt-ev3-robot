# Ev3 robot
Library for creating powerfull robots using makecode and ev3
```ts
//Example cretion of robot
let robot = new Robot({
    construction: {
        distanceBeetwenWheels: 14.5,
        distanceBeetwenBaseAndSensors: 12.5,
        wheelDiameter: 8.5
    },
    electronic: {
        leftMotor: motors.mediumB,
        rightMotor: motors.mediumC,
        leftSensor: sensors.color2,
        rightSensor: sensors.color3,
        speed: 50
    },
    error: {
        kLeftSensor: 1,
        kRightSensor: 1,
        kLeftWheel: 1,
        kRightWheel: 1
    },
    line: {
        kP: 1,
        kI: 0,
        kD: 10,
        black: 20,
        white: 20
    }
}) 
```