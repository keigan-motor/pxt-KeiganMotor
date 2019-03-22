/**
 * LED state
 */
enum led_state {
    OFF = 0,
    ON_SOLID = 1,
    ON_FLASH = 2,
    ON_DIM = 3
}

/**
 * Playback motion start option
 */
enum playback_option {
    START_FROM_RAW = 0, // Start from the raw position.
    START_FROM_CURRENT = 1, // Start from the current position.
}

/**
 * Functions to operate KeiganMotor
 */
//% weight=5 color=#D82317 icon="\uf110"
namespace keiganmotor {

    const RPM_TO_RADIANPERSEC = 0.10471975511965977
    const DEGREE_TO_RADIAN = 0.017453292519943295
    const RADIAN_TO_DEGREE = 57.2957795131

    const CMD_ACT_DISABLE = 0x50
    const CMD_ACT_ENABLE = 0x51
    const CMD_ACT_SPEED = 0x58
    const CMD_ACT_RUN_FORWARD = 0x60
    const CMD_ACT_RUN_REVERSE = 0x61
    const CMD_ACT_RUN_AT_VELOCITY = 0x62
    const CMD_ACT_FREE = 0x6C
    const CMD_ACT_STOP = 0x6D
    const CMD_ACT_MOVE_TO_POSITION = 0x66
    const CMD_ACT_MOVE_BY_DISTANCE = 0x68

    const CMD_ACT_PREPARE_PLAYBACK_MOTION = 0x86
    const CMD_ACT_START_PLAYBACK_MOTION_FROM_PREP = 0x87
    const CMD_ACT_STOP_PLAYBACK_MOTION = 0x88

    const CMD_DT_START_TEACH_MOTION = 0xA9
    const CMD_DT_STOP_TEACH_MOTION = 0xAC
    const CMD_DT_ERASE_MOTION = 0xAD

    const CMD_READ_STATUS = 0x9A
    const CMD_READ_MOTOR_MEASUREMENT = 0xB4
    // TODO const CMD_READ_IMU_MEASUREMENT = 0xB5

    const CMD_LED_SET = 0xE0

    const CMD_OTHERS_REBOOT = 0xF0


    let mArray: KeiganMotor[] // Array to put KeiganMotor
    let mIndex: number

    /**
     * Create a new KeiganMotor.
     * @param name included by KeiganMotor's device name
     */
    //% blockId="KeiganMotor_create" block="KeiganMotor %name"
    //% weight=90 blockGap=8
    //% parts="KeiganMotor"
    //% trackArgs=0,2
    //% blockSetVariable=m
    export function create(name: string): KeiganMotor {
        let m = new KeiganMotor(name);
        return m;
    }

    /*
     * Set RADIO groupId 
     */
    export function setGroup(id: number) {
        if (0 <= id && id <= 255) radio.setGroup(id);
    }

    /*
     * Add KeiganMotor to mArray
     */
    export function addKeiganMotor(motor: KeiganMotor) {
        mArray[mIndex] = motor
        motor.index = mIndex
        mIndex++
    }

    radio.onReceivedBuffer(function (receivedBuffer: Buffer) {
        let cmd = receivedBuffer.getNumber(NumberFormat.UInt8BE, 4)
        let pos = receivedBuffer.getNumber(NumberFormat.Float32BE, 5)
        let vel = receivedBuffer.getNumber(NumberFormat.Float32BE, 9)
        let trq = receivedBuffer.getNumber(NumberFormat.Float32BE, 13)
        //let hex = receivedBuffer.toHex()
        //console.log(hex)
        console.logValue("pos", pos)
        console.logValue("vel", vel)
        console.logValue("trq", trq)
        //basic.showNumber(pos)
    })

    /**
     * A KeiganMotor
     */
    export class KeiganMotor {

        name: string
        nameArray: number[]
        group: number // radio group
        index: number // index in mArray

        packetId: number

        public velocity: number // [radians per second] 
        public position: number // [radians]
        public torque: number // [N*m]

        public rpm: number // [rotation per minute] velocity's another expression 
        public degree: number // [degree] position's another expression

        constructor(name: string) {
            this.name = name
            this.makeNameArray()
            this.packetId = 0
            radio.setTransmitSerialNumber(true) // Include micro:bit serial number to packet
            radio.setGroup(1) // TODO
            addKeiganMotor(this)
        }

        private makeNameArray() {
            let array = [0, 0, 0, 0]
            for (let index = 0; index < 4; index++) {
                array.insertAt(index, this.name.charCodeAt(index))
            }
            this.nameArray = array
        }

        /**
         * Send Buffer by RADIO
         */
        send(buf: Buffer) {
            radio.sendBuffer(buf)
            this.packetId++
            if (this.packetId == 65536) this.packetId = 0
        }

        /**
         * Send command after prepending name = "XXXX" 
         * [ X X X X | CMD | packetId ]
         */
        write(command: number) {
            let buf = pins.createBuffer(7) // 4 + 1 + 2 
            buf.write(0, pins.createBufferFromArray(this.nameArray))
            buf.setNumber(NumberFormat.UInt8BE, 4, command)
            buf.setNumber(NumberFormat.UInt16BE, 5, this.packetId)
            this.send(buf)

        }

        /**
         * Send command and float value after prepending name = "XXXX"
         * [ X X X X | CMD | packetId | VALUES(BYTES) ]
         */
        writeFloat32(command: number, value: number) {
            let buf = pins.createBuffer(7 + 4)
            buf.write(0, pins.createBufferFromArray(this.nameArray))
            buf.setNumber(NumberFormat.UInt8BE, 4, command)
            buf.setNumber(NumberFormat.UInt16BE, 5, this.packetId)
            buf.setNumber(NumberFormat.Float32BE, 7, value)
            this.send(buf)
        }
        /**
         * Send command and UInt32 value after prepending name = "XXXX"
         * [ X X X X | CMD | packetId | VALUES(BYTES) ]
         */
        writeUInt32(command: number, value: number) {
            let buf = pins.createBuffer(7 + 4)
            buf.write(0, pins.createBufferFromArray(this.nameArray))
            buf.setNumber(NumberFormat.UInt8BE, 4, command)
            buf.setNumber(NumberFormat.UInt16BE, 5, this.packetId)
            buf.setNumber(NumberFormat.UInt32LE, 7, value)
            this.send(buf)
        }

        /**
        * Send command, UInt16 and UInt32 values after prepending name = "XXXX"
        * [ X X X X | CMD | packetId | VALUE1 | VALUE2 ]
        */
        writeUInt16UInt32(command: number, value1: number, value2: number) {
            let buf = pins.createBuffer(7 + 2 + 4)
            buf.write(0, pins.createBufferFromArray(this.nameArray))
            buf.setNumber(NumberFormat.UInt8BE, 4, command)
            buf.setNumber(NumberFormat.UInt16BE, 5, this.packetId)
            buf.setNumber(NumberFormat.UInt16BE, 7, value1)
            buf.setNumber(NumberFormat.UInt32BE, 9, value2)
            this.send(buf)
        }

        /**
        * Send command, UInt16, UInt32, and UInt8 value after prepending name = "XXXX"
        * [ X X X X | CMD | packetId | VALUE1 | VALUE2 | VALUE3 ]
        */
        writeUInt16UInt32UInt8(command: number, value1: number, value2: number, value3: number) {
            let buf = pins.createBuffer(7 + 2 + 4 + 1)
            buf.write(0, pins.createBufferFromArray(this.nameArray))
            buf.setNumber(NumberFormat.UInt8BE, 4, command)
            buf.setNumber(NumberFormat.UInt16BE, 5, this.packetId)
            buf.setNumber(NumberFormat.UInt16BE, 7, value1)
            buf.setNumber(NumberFormat.UInt32BE, 9, value2)
            buf.setNumber(NumberFormat.UInt8BE, 13, value3)
            this.send(buf)
        }

        /**
         * Send command and UInt16 value after prepending name = "XXXX"
         * [ X X X X | CMD | packetId | VALUE ]
         */
        writeUInt16(command: number, value: number) {
            let buf = pins.createBuffer(7 + 2)
            buf.write(0, pins.createBufferFromArray(this.nameArray))
            buf.setNumber(NumberFormat.UInt8BE, 4, command)
            buf.setNumber(NumberFormat.UInt16BE, 5, this.packetId)
            buf.setNumber(NumberFormat.UInt16BE, 7, value)
            this.send(buf)
        }

        /**
         * Send command and UInt8 values after prepending name = "XXXX"
         * [ X X X X | CMD | packetId | VALUES(BYTES) ]
         */
        writeUInt8Array(command: number, values: number[]) {
            let buf = pins.createBuffer(7 + values.length)
            buf.write(0, pins.createBufferFromArray(this.nameArray))
            buf.setNumber(NumberFormat.UInt8BE, 4, command)
            buf.setNumber(NumberFormat.UInt16BE, 5, this.packetId)
            for (let i = 0; i < values.length; i++) {
                buf.setNumber(NumberFormat.UInt8BE, 7 + i, values[i])
            }

            radio.sendBuffer(buf)
        }

        /**
         * Disable action 
         */
        //% blockId="disable" block="%KeiganMotor|disable action" 
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        disable() {
            this.write(CMD_ACT_DISABLE)

        }

        /**
         * Enable action 
         */
        //% blockId="enable" block="%KeiganMotor|enable action" 
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        enable() {
            this.write(CMD_ACT_ENABLE)
        }


        /**
         * Set speed
         * @param speed [radians/sec]
         */
        speed(value: number) {
            this.writeFloat32(CMD_ACT_SPEED, value)
        }



        /**
         * Set speed rotation per minute
         * @param speed [rotation/minute]
         */
        //% blockId="speedRpm" block="%KeiganMotor|set speed(rpm) %value"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        speedRpm(value: number) {
            this.speed(RPM_TO_RADIANPERSEC * value)
        }


        /**
         * Run forward
         */
        //% blockId="runForward" block="%KeiganMotor|run forward" 
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        runForward() {
            this.write(CMD_ACT_RUN_FORWARD)
        }

        /**
         * Run Reverse
         */
        //% blockId="runReverse" block="%KeiganMotor|run reverse" 
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        runReverse() {
            this.write(CMD_ACT_RUN_REVERSE)
        }



        /**
         * Run At Velocity
         * @param velocity [radian/sec]
         */
        run(velocity: number) {
            this.writeFloat32(CMD_ACT_RUN_AT_VELOCITY, velocity)
        }

        /**
         * Run At Velocity(rpm)
         * @param velocity [rotation/minute]
         */
        //% blockId="runRpm" block="%KeiganMotor|run at velocity(rpm) %velocity"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        runRpm(velocity: number) {
            this.run(RPM_TO_RADIANPERSEC * velocity)
        }

        /**
        * Move To Position
        * @param position [radian]
        */
        moveTo(position: number) {
            this.writeFloat32(CMD_ACT_MOVE_TO_POSITION, position)
        }

        /**
         * Move To Position
         * @param position [degree]
         */
        //% blockId="moveToDeg" block="%KeiganMotor|move to position(degree) %position"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        moveToDeg(position: number) {
            this.moveTo(DEGREE_TO_RADIAN * position)
        }

        /**
        * Move By Distance
        * @param distance [radian]
        */
        moveBy(distance: number) {
            this.writeFloat32(CMD_ACT_MOVE_BY_DISTANCE, distance)
        }

        /**
         * Move To Position
         * @param distance [degree]
         */
        //% blockId="moveByDeg" block="%KeiganMotor|move by distance(degree) %position"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        moveByDeg(distance: number) {
            this.moveBy(DEGREE_TO_RADIAN * distance)
        }

        /**
         * Free // de-energize Motor
         */
        //% blockId="free" block="%KeiganMotor|free" 
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        free() {
            this.write(CMD_ACT_FREE)
        }

        /**
         * Stop // Set speed 0 to Motor
         */
        //% blockId="stop" block="%KeiganMotor|stop" 
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        stop() {
            this.write(CMD_ACT_STOP)
        }

        /**
         * Erase Motion at Index
         * @param index 
         */
        //% blockId="eraseMotion" block="%KeiganMotor|erase motion at index %index"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        eraseMotion(index: number) {
            this.writeUInt16(CMD_DT_ERASE_MOTION, index)
        }

        /**
         * Start Teaching Motion at Index
         * @param index 
         * @param time [milliseconds]
         */
        //% blockId="startTeachingMotion" block="%KeiganMotor|start teaching motion at index %index"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        startTeachingMotion(index: number, time: number) {
            this.writeUInt16UInt32(CMD_DT_START_TEACH_MOTION, index, time)
        }

        /**
         * Stop Teaching Motion
         */
        //% blockId="stopTeachingMotion" block="%KeiganMotor|stop teaching motion"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        stopTeachingMotion() {
            this.write(CMD_DT_STOP_TEACH_MOTION)
        }



        /**
         * Prepare Playback Motion at Index
         * @param index 
         * @param repeating // times
         * @param option // playback start option 
         */
        //% blockId="preparePlaybackMotion" block="%KeiganMotor|prepare playback motion at index %index"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        preparePlaybackMotion(index: number, repeating: number, option: playback_option) {
            let start_op: number = option
            this.writeUInt16UInt32UInt8(CMD_ACT_PREPARE_PLAYBACK_MOTION, index, repeating, start_op)
        }


        /**
         * Start Playback Motion at Index
         */
        //% blockId="startPlaybackMotion" block="%KeiganMotor|start playback motion"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        startPlaybackMotion() {
            this.write(CMD_ACT_START_PLAYBACK_MOTION_FROM_PREP)
        }

        /**
         * Stop Playback Motion at Index
         */
        //% blockId="stopPlaybackMotion" block="%KeiganMotor|stop playback motion"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        stopPlaybackMotion() {
            this.write(CMD_ACT_STOP_PLAYBACK_MOTION)
        }

        /**
         * Set LED state to led_state and colors
         * @param led_state
         * @param red value between 0 and 255. eg: 255
         * @param green value between 0 and 255. eg: 255
         * @param blue value between 0 and 255. eg: 255
         */
        //% blockId="KeiganMotor_led" block="%KeiganMotor|state %led_state|red %red|green %green|blue %blue"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        led(state: led_state, red: number, green: number, blue: number) {
            let s: number = state
            this.writeUInt8Array(CMD_LED_SET, [s, red, green, blue])
        }



    }



}
