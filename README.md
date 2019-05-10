# pxt-keiganmotor

You can control KeiganMotor KM-1 Series from micro:bit via RADIO

<img src="https://github.com/keigan-motor/pxt-KeiganMotor/blob/master/icon.png?raw=true" width="640">

- Product page: https://keigan-motor.com
- Documentation: https://document.keigan-motor.com

## Requirement
1. KeiganMotor KM-1 Series **The device firmware version needs to be more than 2.00.**
2. MakeCode Editor for micro:bit (https://makecode.microbit.org)

## First
You need to specify unique 4 digits "name" of KeiganMotor to control.
You can know it by two ways as belows.

1. The last 4 digits of the serial number. 
 - If the serial number is "ABCDEFGH", the name is "EFGH"  
2. The 4 digits Included by devicename of Bluetooth Low Energy.
 - If the device name is "KM-1 EFGH#RGB", the name is "EFGH". 
   - You can use "KeiganCore" app or other BLE apps to get device name. 

## Setup
You need to change KeiganMotor's RADIO mode from BLE to "micro:bit mode".

1. Supply power to KeiganMotor.
2. Push Stop Button 10 times.
3. It will reboot automatically and change to micro:bit mode.

If you push Stop Button 10 times again, it will be back to BLE mode.


## Blocks
Make KeiganMotor rotate and control LED.
<img src="https://github.com/keigan-motor/pxt-KeiganMotor/blob/master/images/block.png?raw=true" width="640">

## JavaScript
### Initialization
```typescript
// Initialize KeiganMotor by its name
let m = keiganmotor.create("EFGH")
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


## License

MIT

## Supported targets

* for PXT/microbit
  (The metadata above is needed for package search.)
