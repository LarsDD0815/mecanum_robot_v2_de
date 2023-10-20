//% color="#ff6800" icon="\uf1b9" weight=15
//% groups="['Motor', 'Servo', 'LED', 'Sensor']"
namespace mecanumRobotV2 {

    const rotationSpeed = 2;
    const minDistanceInCentimeters = 15;
    const targetAngleThreshold = 5;
    const smoothingInvervallSize = 5;

    let recentDistances: number[] = [];    
    let recentOutlierDistances: number[] = [];

    let currentCompassHeading: number = 0;
    let currentDistanceInCentimeters: number = 0;

    enum TurnWheels {
        Forward = 0,
        Backwards = 1
    }
        
    enum LineTrackingSensor {
        //% block="links"
        Left,
        //% block="mitte"
        Center,
        //% block="rechts"
        Right
    
    }

    enum LED {
        //% block="links"
        Left = 0x09,
        //% block="rechts"
        Right = 0x0a
    }

    enum LEDColor {
        //% block=Regenbogen
        Rainbow = 4095,
        //% block=aus
        Off = 0
    }

    // control.inBackground(function() {

    //     while (true) {

    //         basic.pause(20);

    //         currentCompassHeading = input.compassHeading();

    //         const currentDistance = messureCurrentDistance();
    //         const currentAverageDistance = calculateAverage(recentDistances);

    //         if (currentDistance == null) {
    //             continue;
    //         }

    //         if (recentDistances.length == smoothingInvervallSize && Math.abs(currentDistance - currentAverageDistance) > currentAverageDistance * 3) {

    //             const averageOutlierDistance = calculateAverage(recentOutlierDistances);
    //             recentOutlierDistances.push(currentDistance);
                
    //             if (recentOutlierDistances.length == smoothingInvervallSize && Math.abs(currentDistance - averageOutlierDistance) < averageOutlierDistance * 1, 5) {
                    
    //                 recentOutlierDistances = [];
    //                 recentDistances = recentOutlierDistances;
    //             }

    //             if (recentOutlierDistances.length > smoothingInvervallSize) {
    //                 recentOutlierDistances.shift();
    //             }
    //         }

    //         recentDistances.push(currentDistance);
            
    //         if (recentDistances.length > smoothingInvervallSize) {
    //             recentDistances.shift();
    //         }

    //         currentDistanceInCentimeters = calculateAverage(recentDistances);
    //     }
    // })

    //% block="Enternung zum Hindernis"
    //% group="Sensor"
    export function aktuelleEntfernungInZentimetern(): number {
        
        const recentDistances: number[] = [];   
        
        for (let i = 0; i < 3; i++) {
            recentDistances[i] = messureCurrentDistance();
        }
        
        return calculateAverage(recentDistances);
    }

    //% block="Kompass-Ausrichtung"
    //% group="Sensor"
    export function aktuelleKompassausrichtung(): number {
        
        const recentAngles: number[] = [];   
        
        for (let i = 0; i < 100; i++) {
            recentAngles[i] = input.compassHeading()
            control.waitMicros(10)
        }
        
        return calculateAverage(recentAngles);
    }

    //% block="Motoren per Bluetooth steuern: $bluetoothUARTWerte"
    //% group="Motor"
    export function stelleMotorenPerBluetooth(bluetoothUARTWerte: String) {

        let rohdaten = bluetoothUARTWerte.split("|");
        
        let motorVorneRechts = parseInt(rohdaten[0]);
        let motorVorneLinks = parseInt(rohdaten[1]);
        let motorHintenRechts = parseInt(rohdaten[2]);
        let motorHintenLinks = parseInt(rohdaten[3]);

        let distanceInCentimeters = aktuelleEntfernungInZentimetern();

        stelleMotor(0x01, 0x02, motorVorneRechts, distanceInCentimeters);
        stelleMotor(0x03, 0x04, motorVorneLinks, distanceInCentimeters);
        stelleMotor(0x05, 0x06, motorHintenRechts, distanceInCentimeters);
        stelleMotor(0x07, 0x08, motorHintenLinks, distanceInCentimeters);
    }

    //% block="Vorwörts mit Geschwindigkeit: $speed \\%"
    //% speed.min=0 speed.max=100
    //% group="Motor"
    export function motorenVorwärts(speed: number) {
          
        motorVorneLinks(TurnWheels.Forward, speed);
        motorVorneRechts(TurnWheels.Forward, speed);
        motorHintenLinks(TurnWheels.Forward, speed);
        motorHintenRechts(TurnWheels.Forward, speed);
    }

    //% block="Rückwärts mit Geschwindigkeit: $speed \\%"
    //% speed.min=0 speed.max=100
    //% group="Motor"
    export function motorenRückwärts(speed: number) {

        motorVorneLinks(TurnWheels.Backwards, speed);
        motorVorneRechts(TurnWheels.Backwards, speed);
        motorHintenLinks(TurnWheels.Backwards, speed);
        motorHintenRechts(TurnWheels.Backwards, speed);
    }

    //% block="Rechts drehen mit Geschwindigkeit: $speed \\%"
    //% speed.min=0 speed.max=100
    //% group="Motor"
    export function rechtsDrehen(speed: number) {

        motorVorneLinks(TurnWheels.Forward, speed);
        motorVorneRechts(TurnWheels.Backwards, speed);
        motorHintenLinks(TurnWheels.Forward, speed);
        motorHintenRechts(TurnWheels.Backwards, speed);
    }

    //% block="Links drehen mit Geschwindigkeit: $speed \\%"
    //% speed.min=0 speed.max=100
    //% group="Motor"
    export function linksDrehen(speed: number) {

        motorVorneLinks(TurnWheels.Backwards, speed);
        motorVorneRechts(TurnWheels.Forward, speed);
        motorHintenLinks(TurnWheels.Backwards, speed);
        motorHintenRechts(TurnWheels.Forward, speed);
    }

    //% block="Motor anhalten"
    //% group="Motor"
    export function motorenAnhalten() {
        setEngineSpeedValue(0x01, 0); //M1A
        setEngineSpeedValue(0x02, 0); //M1B
        setEngineSpeedValue(0x03, 0); //M1A
        setEngineSpeedValue(0x04, 0); //M1B
        setEngineSpeedValue(0x05, 0); //M1A
        setEngineSpeedValue(0x06, 0); //M1B
        setEngineSpeedValue(0x07, 0); //M1A
        setEngineSpeedValue(0x08, 0); //M1B
    }

    //% block="Finde den Weg: $speed \\%"
    //% speed.min=0 speed.max=100
    //% group="Motor"
    export function folgeWeg(speed: number) {

        let currentForwardSpeed = 0;

        let distanceInCentimeters = aktuelleEntfernungInZentimetern();
        let adjustedSpeed = ermittleGeschwindigkeit(speed, distanceInCentimeters);

        if (adjustedSpeed != 0 && currentForwardSpeed == adjustedSpeed) {
            return;
        }

        currentForwardSpeed = adjustedSpeed;

        if (currentForwardSpeed > 0) {
            motorenVorwärts(currentForwardSpeed);
        } else {
            motorenAnhalten();

            currentForwardSpeed = 0;

            neuAusrichten();
        }
    }

    function neuAusrichten() {

        const modifiedTargetAngle = ermittleNeueZielrichtung();
        
        rechtsDrehen(rotationSpeed);

        while (true) {
            if (Math.abs(aktuelleKompassausrichtung() - modifiedTargetAngle) > targetAngleThreshold) {
                continue;
            }

            motorenAnhalten();

            break;
        }
    }

    function ermittleNeueZielrichtung() {

        const initialAngle = aktuelleKompassausrichtung();

        const leftTargetAngle = adjustTargetAngle(initialAngle - 90);
        const rightTargetAngle = adjustTargetAngle(initialAngle + 90);

        rechtsDrehen(rotationSpeed);

        while (true) {
            if (Math.abs(aktuelleKompassausrichtung() - rightTargetAngle) > targetAngleThreshold) {
                continue;
            }

            motorenAnhalten();

            break;
        }

        const angleWithMaximumDistanceRight = determineAngleWithMaximumDistance(rightTargetAngle);

        rechtsDrehen(rotationSpeed);
        
        while (true) {
            if (Math.abs(aktuelleKompassausrichtung() - leftTargetAngle) > targetAngleThreshold) {
                continue;
            }

            motorenAnhalten();

            break;
        }
        
        const angleWithMaximumDistanceLeft = determineAngleWithMaximumDistance(leftTargetAngle);

        if ((angleWithMaximumDistanceLeft.dinstance == undefined || angleWithMaximumDistanceLeft.dinstance <= minDistanceInCentimeters) && (angleWithMaximumDistanceRight.dinstance == undefined || angleWithMaximumDistanceRight.dinstance <= minDistanceInCentimeters)) {
            return adjustTargetAngle(initialAngle - 180);
        } else if (angleWithMaximumDistanceLeft.dinstance == null || angleWithMaximumDistanceLeft.dinstance <= minDistanceInCentimeters){
            return angleWithMaximumDistanceRight.angle;
        } else if (angleWithMaximumDistanceRight.dinstance == null || angleWithMaximumDistanceRight.dinstance <= minDistanceInCentimeters) {
            return angleWithMaximumDistanceLeft.angle;
        } else {
            return angleWithMaximumDistanceLeft.dinstance >= angleWithMaximumDistanceRight.dinstance ? angleWithMaximumDistanceLeft.angle : angleWithMaximumDistanceRight.angle;
        }
    }

    class AngleToDistanceMapping {
        angle: number;
        dinstance: number;
    }

    function determineAngleWithMaximumDistance(initialAngle : number) : AngleToDistanceMapping {

        const angleWithMaximumDistance = new AngleToDistanceMapping();

        setServoAngle(0);

        for (let servoAusschlag = -80; servoAusschlag <= 80; servoAusschlag += 2) {
            
            setServoAngle(servoAusschlag);

            const entfernungZumHindernis = aktuelleEntfernungInZentimetern();
            
            if (entfernungZumHindernis <= angleWithMaximumDistance.dinstance) {
                continue;
            }
               
            angleWithMaximumDistance.dinstance = entfernungZumHindernis;
            angleWithMaximumDistance.angle = adjustTargetAngle(initialAngle + servoAusschlag);
        }

        setServoAngle(0);

        return angleWithMaximumDistance;
    }

    function adjustTargetAngle(angle: number): number {
        let targetAngle = angle;
        
        if (targetAngle > 360) {
            targetAngle -= 360;
        } else if (targetAngle < 0) {
            targetAngle += 360;
        }

        return targetAngle;
    }

    function ermittleGeschwindigkeit(targetSpeed: number, distanceInCentimeters : number) {

        if (distanceInCentimeters > 100) {
            return targetSpeed;
        } else if (distanceInCentimeters < minDistanceInCentimeters) {
            return 0;
        }

        const maxSpeed = Math.map(distanceInCentimeters, minDistanceInCentimeters, 100, 1, 20);

        return Math.min(targetSpeed, maxSpeed);
    }

    function messureCurrentDistance(): number {

        pins.setPull(DigitalPin.P15, PinPullMode.PullNone);
        pins.digitalWritePin(DigitalPin.P15, 0)
        control.waitMicros(2);
        pins.digitalWritePin(DigitalPin.P15, 1)
        control.waitMicros(10);
        pins.digitalWritePin(DigitalPin.P15, 0)

        // Puls-Laufzeit für Schallgescwindigkeit bei einer Maximalen Mess-Entfernung von 3 m > 1s/340m*(2 * 3m) > 0,01764705882s
        const laufzeitInMilliseconds = pins.pulseIn(DigitalPin.P16, PulseValue.High, 18000);

        if (laufzeitInMilliseconds != 0) {
            return Math.round(laufzeitInMilliseconds / 58);
        }

        return 300;
    }

    function calculateAverage(values: number[]): number {
 
        let sumOfValues = 0;
 
        values.forEach(function (value, idx) {
            sumOfValues += value;
        });


        return Math.round(sumOfValues / values.length);
    }

    function motorVorneRechts(engineRotationDirection: TurnWheels, speed: number) {

        if (engineRotationDirection == 0) {
            setEngineSpeedValue(0x01, 0); //M2A
            setEngineSpeedValue(0x02, convertToEngineSpeedValue(speed)); //M2B
        } else if (engineRotationDirection == 1) {
            setEngineSpeedValue(0x01, convertToEngineSpeedValue(speed)); //M2A
            setEngineSpeedValue(0x02, 0); //M2B
        }
    }

    function motorVorneLinks(engineRotationDirection: TurnWheels, speed: number) {

        if (engineRotationDirection == 0) {
            setEngineSpeedValue(0x03, 0); //M2A
            setEngineSpeedValue(0x04, convertToEngineSpeedValue(speed)); //M2B
        } else if (engineRotationDirection == 1) {
            setEngineSpeedValue(0x03, convertToEngineSpeedValue(speed)); //M2A
            setEngineSpeedValue(0x04, 0); //M2B
        }
    }

    function motorHintenLinks(engineRotationDirection: TurnWheels, speed: number) {

        if (engineRotationDirection == 0) {
            setEngineSpeedValue(0x07, 0); //M2A
            setEngineSpeedValue(0x08, convertToEngineSpeedValue(speed)); //M2B
        } else if (engineRotationDirection == 1) {
            setEngineSpeedValue(0x07, convertToEngineSpeedValue(speed)); //M2A
            setEngineSpeedValue(0x08, 0); //M2B
        }
    }

    function motorHintenRechts(engineRotationDirection: TurnWheels, speed: number) {

        if (engineRotationDirection == 0) {
            setEngineSpeedValue(0x05, 0); //M2A
            setEngineSpeedValue(0x06, convertToEngineSpeedValue(speed)); //M2B
        } else if (engineRotationDirection == 1) {
            setEngineSpeedValue(0x05, convertToEngineSpeedValue(speed)); //M2A
            setEngineSpeedValue(0x06, 0); //M2B
        }
    }

    function stelleMotor(engineRegister1: number, engineRegister2: number, speed: number, distanceInCentimeters : number) {
        
        if (speed == 0) {
            setEngineSpeedValue(engineRegister1, 0);
            setEngineSpeedValue(engineRegister2, 0);
        } else if (speed > 0) {

            let adjustedSpeed = ermittleGeschwindigkeit(speed, distanceInCentimeters);

            setEngineSpeedValue(engineRegister1, 0);
            setEngineSpeedValue(engineRegister2, convertToEngineSpeedValue(adjustedSpeed));
        } else {
            setEngineSpeedValue(engineRegister2, 0);
            setEngineSpeedValue(engineRegister1, convertToEngineSpeedValue(speed));
        }
    }

    function convertToEngineSpeedValue(speed: number) {
        if (speed == 0) {
            return 0;
        }

        return Math.trunc(Math.map(Math.abs(speed), 1, 100, 32, 255));
    }

    function setServoAngle(angle: number): void {
        pins.servoWritePin(AnalogPin.P14, angle + 90)
    }

    function setEngineSpeedValue(engineRegister: number, engineSpeedValue: number) {
        let buf = pins.createBuffer(2)
        buf[0] = engineRegister
        buf[1] = engineSpeedValue
        pins.i2cWriteBuffer(0x30, buf)
    }

    setServoAngle(0);
}