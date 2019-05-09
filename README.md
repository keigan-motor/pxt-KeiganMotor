# pxt-keiganmotor

You can control KeiganMotor KM-1 Series from micro:bit

<img src="https://github.com/keigan-motor/pxt-KeiganMotor/blob/master/icon.png?raw=true" width="640">

- Product page: https://keigan-motor.com
- Documentation: https://document.keigan-motor.com

**The device firmware version needs to be >= 2.00.**


## First
You need to specify unique 4 digits "name" of KeiganMotor to control.
You can know it by two ways as belows.

1. The last 4 digits of the serial number. 
 - If the serial number is "ABCDEFGH", the name is "EFGH"  
2. The 4 digits Included by devicename of Bluetooth Low Energy.
 - If the device name is "KM-1 EFGH#RGB", the name is "EFGH". 
   - You can use "KeiganCore" app or other BLE apps to get device name. 

Example by MakeCode Blocks and JavaScript

## Block
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
