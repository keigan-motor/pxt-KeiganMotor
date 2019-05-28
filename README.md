# pxt-keiganmotor

You can control KeiganMotor KM-1 Series from micro:bit via RADIO

<img src="https://github.com/keigan-motor/pxt-KeiganMotor/blob/master/icon.png?raw=true" width="640">

- Product page: https://keigan-motor.com
- Documentation: https://document.keigan-motor.com

## Requirement
1. KeiganMotor KM-1 Series: **The device firmware version needs to be more than 2.05.**
2. MakeCode Editor for micro:bit (https://makecode.microbit.org)

## Setup
You need to change KeiganMotor's RADIO mode from BLE to "micro:bit mode".

1. Supply power to KeiganMotor.
2. Push the middle "Stop" Button 10 times.
3. It will reboot automatically and change to micro:bit mode.
(LED will blink Yellow for 2 seconds right after startup when micro:bit mode.)

If you push Stop Button 10 times again, it will be back to BLE mode.

## Important
You need to specify KeiganMotor's unique 4 digits "name" and its RADIO group for micro:bit to control it.
It is used in initializer of KeiganMotor on MakeCode editor as belows.

### (1) Name
It is a unique specific 4 digit number of KeiganMotor.
You can know it by two ways as belows.
1. The last 4 digits of the serial number. 
 - If the serial number is "ABCDEFGH", the name is "EFGH"  
2. The 4 digits Included by devicename of Bluetooth Low Energy.
 - If the device name is "KM-1 EFGH#RGB", the name is "EFGH". 
   - You can use "KeiganCore" app or other BLE apps to get device name. 

### (2) RADIO group
You need to match RADIO group between MakeCode and KeiganMotor.
The default RADIO group of KeiganMotor is 0. 

You can get RADIO group of KeiganMotor to use the following sample.
#### KMRadioGroupFinder
https://makecode.microbit.org/_fbvR7ifav6Ht
1. Set your KeiganMotor's 4 digit name to parameter "name".
2. Download to micro:bit and push "A" button.
3. If the name is found, the display shows the name and RADIO group number.

You can write RADIO group of KeiganMotor to use the following sample.
#### KMRadioGroupWriter
https://makecode.microbit.org/_fbvR7ifav6Ht
1. Set your KeiganMotor's 4 digit name to parameter "name".
2. Set a new group to parameter "newGroupId".
3. Download to micro:bit and push "A" button.
4. If the name is found, micro:bit write newGroupId to KeiganMotor.
5. KeiganMotor will reboot and start RADIO with newGroupId.


## Blocks
Make KeiganMotor rotate and control LED.
<img src="https://github.com/keigan-motor/pxt-KeiganMotor/blob/master/images/block.png?raw=true" width="640">

## JavaScript
### Initialization
```typescript
// Initialize KeiganMotor by RADIO group and its name
// RADIO group should be from 0 to 255
let m = keiganmotor.create(0, "EFGH") // RADIO group ID = 0, name = "EFGH"
```

### Enable Action
```typescript
m.enable() 
```

### Rotate
```typescript
m.runRpm(10) // run at velocity 10 [rotation/minute]
basic.pause(10000) // wait for 10 seconds
m.stop() // stop (set speed to 0)
```
### LED
```typescript
m.led(led_state.ON_SOLID, 255, 255, 0) // Set LED color to RGB(255,255,0) = yellow
```

### Control Multiple KeiganMotors
**You should change RADIO groupId separately to avoid to get jammed.**

```typescript
let m1 = keiganmotor.create(0, "EFGH")
let m2 = keiganmotor.create(1, "PQRS")

m1.enable()
m2.enable()
```
#### TIPS
If you want to control multiple KeiganMotors that have the same RADIO group ID,
You can avoid to get jammed by inserting "basic.pause(50)" between commands as belows.

```typescript
m1.moveToDeg(30)
basic.pause(50)
m2.moveToDeg(-30)
```

## License

MIT

## Supported targets

* for PXT/microbit
  (The metadata above is needed for package search.)
