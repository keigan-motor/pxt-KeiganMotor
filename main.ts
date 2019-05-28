/**
 * This extension enables to control KeiganMotor via "RADIO"
 * 
 * Refer to https://ukbaz.github.io/howto/ubit_radio.html
 * to know RADIO Packet data structure
 * 
 * Packet Spec:
 * 0  1  2     | 3              | 4 ... 7       | 8 ... 11          | 12 ... 31
 * --------------------------------------------------------------------------
 * dal header  | packet type    | system time   | serial number     | payload
 *
 * --- DAL HEADER
    01                      raw payload
    00                      group number
    01                      version 1
 * 
 * Packet from KeiganMotor also meets this packet structure.
 * The serial number is KeiganMotor's serial number.
 */

/**
 * LED state
 */
enum LedState {
    //% block="OFF"
    OFF = 0,
    //% block="SOLID"
    ON_SOLID = 1,
    //% block="FLASH"
    ON_FLASH = 2,
    //% block="DIM"
    ON_DIM = 3
}

/**
 * Playback motion start option
 */
enum PlaybackOption {
    //% block="RAW"
    START_FROM_RAW = 0, // Start from the raw position.
    //% block="CURRENT"
    START_FROM_CURRENT = 1, // Start from the current position.
}

/**
 * Curve type of Motion Control
 */
enum CurveType {
    //% block="NONE"
    CURVE_TYPE_NONE = 0,
    //% block="TRAPEZOID"
    CURVE_TYPE_TRAPEZOID = 1
}

/**
 * Functions to operate KeiganMotor
 */
//% weight=5 color=#D82317 icon="\uf110"  block="KeiganMotor"
namespace keiganmotor {

    const RPM_TO_RADIANPERSEC = 0.10471975511965977
    const RADIANPERSEC_TO_RPM = 9.54929658551
    const DEGREE_TO_RADIAN = 0.017453292519943295
    const RADIAN_TO_DEGREE = 57.2957795131

    const CMD_REG_MAX_SPEED = 0x02
    const CMD_REG_ACC = 0x07
    const CMD_TEG_DEC = 0x08
    const CMD_REG_CURVE_TYPE = 0x05
    const CMD_REG_MAX_TORQUE = 0x0E

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
    const CMD_ACT_PRESET_POSITION = 0x5A

    const CMD_ACT_PREPARE_PLAYBACK_MOTION = 0x86
    const CMD_ACT_START_PLAYBACK_MOTION_FROM_PREP = 0x87
    const CMD_ACT_STOP_PLAYBACK_MOTION = 0x88

    const CMD_DT_START_TEACH_MOTION = 0xA9
    const CMD_DT_STOP_TEACH_MOTION = 0xAC
    const CMD_DT_ERASE_MOTION = 0xAD

    const CMD_READ_STATUS = 0x9A
    const CMD_READ_MOTOR_MEASUREMENT = 0xB4
    // TODO const CMD_READ_IMU_MEASUREMENT = 0xB5

    const CMD_UBIT_GROUPID = 0xCA

    const CMD_LED_SET = 0xE0

    const CMD_OTHERS_REBOOT = 0xF0

    const RECEIVE_TYPE_READ = 0x40
    const RECEIVE_TYPE_ERROR = 0xBE
    const RECEIVE_TYPE_MOTOR_MEASUREMENT = CMD_READ_MOTOR_MEASUREMENT
    // TODO const RECEIVE_TYPE_IMU_MEASUREMENT = CMD_READ_IMU_MEASUREMENT

    let motorArray: KeiganMotor[] = [] // Array to put KeiganMotor
    let serialNumberArray: number[] = [] // Array to put Number array from KeiganMotor's device name

    let mIndex: number = 0

    let initialized = false
    let motorReceived: KeiganMotor


    /**
     * Create a new KeiganMotor by specifying its 4 digit of device name .
     * @param group RADIO group ID
     * @param name the 4 digit name included by KeiganMotor's device name
     */
    //% blockId="KeiganMotor_create" block="KeiganMotor RADIO group %group| name %name "
    //% weight=90 blockGap=8
    //% parts="KeiganMotor"
    //% trackArgs=0,2
    //% blockSetVariable=m
    //% group.min=0 group.max=255 group.defl=1
    export function create(group: number, name: string): KeiganMotor {
        let m = new KeiganMotor(group, name)
        addKeiganMotor(m)
        return m
    }


    /*
     * Add KeiganMotor to mArray
     */


    function addKeiganMotor(m: KeiganMotor) {
        motorArray[mIndex] = m
        serialNumberArray[mIndex] = m.serialNumber
        mIndex++
    }



    /**
     * A KeiganMotor
     */
    export class KeiganMotor {

        groupId: number
        name: string
        nameBuffer: Buffer
        serialNumber: number

        packetId: number

        public velocity: number // [radians per second] 
        public position: number // [radians]
        public torque: number // [N*m]

        public rpm: number // [rotation per minute] velocity's another expression 
        public degree: number // [degree] position's another expression

        constructor(group: number, name: string) {
            this.name = name
            if (group >= 0 && group <= 255) {
                this.groupId = group
            } else {
                this.groupId = 0 // Default RADIO group is 0
            }

            //radio.setGroup(this.groupId)
            this.makeNameBuffer()
            this.packetId = 0
            radio.setTransmitSerialNumber(true) // Include micro:bit serial number to packet
        }

        private makeNameBuffer() {
            let buf = pins.createBuffer(4)
            for (let index = 0; index < 4; index++) {
                buf.setNumber(NumberFormat.UInt8BE, index, this.name.charCodeAt(index))
            }
            this.nameBuffer = buf
            this.serialNumber = buf.getNumber(NumberFormat.UInt32LE, 0)
        }

        /**
         * Set RADIO Group ID
         */
        setGroup(group: number) {
            if (group >= 0 && group <= 255) {
                this.groupId = group
            }
        }


        /**
         * Send Buffer by RADIO
         */
        send(buf: Buffer) {
            radio.setGroup(this.groupId)
            //console.logValue("id", this.groupId)
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
            buf.write(0, this.nameBuffer)
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
            buf.write(0, this.nameBuffer)
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
            buf.write(0, this.nameBuffer)
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
            buf.write(0, this.nameBuffer)
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
            buf.write(0, this.nameBuffer)
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
            buf.write(0, this.nameBuffer)
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
            buf.write(0, this.nameBuffer)
            buf.setNumber(NumberFormat.UInt8BE, 4, command)
            buf.setNumber(NumberFormat.UInt16BE, 5, this.packetId)
            for (let i = 0; i < values.length; i++) {
                buf.setNumber(NumberFormat.UInt8BE, 7 + i, values[i])
            }

            this.send(buf)
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
         * Set speed [radians/sec]
         * @param speed [radians/sec]
         */
        speed(value: number) {
            this.writeFloat32(CMD_ACT_SPEED, value)
        }



        /**
         * Set speed [rotation/minute]
         * @param speed [rotation/minute]
         */
        //% blockId="speedRpm" block="%KeiganMotor|set speed [rpm] %value"
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
         * Run At Velocity [radian/sec]
         * @param velocity [radian/sec]
         */
        run(velocity: number) {
            this.writeFloat32(CMD_ACT_RUN_AT_VELOCITY, velocity)
        }

        /**
         * Run At Velocity [rotation/minute]
         * @param velocity [rotation/minute]
         */
        //% blockId="runRpm" block="%KeiganMotor|run at velocity [rpm] %velocity"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        runRpm(velocity: number) {
            this.run(RPM_TO_RADIANPERSEC * velocity)
        }

        /**
        * Move To Position [radian]
        * @param position [radian]
        */
        moveTo(position: number) {
            this.writeFloat32(CMD_ACT_MOVE_TO_POSITION, position)
        }

        /**
         * Move To Position [degree]
         * @param position [degree]
         */
        //% blockId="moveToDeg" block="%KeiganMotor|move to position [degree] %position"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        moveToDeg(position: number) {
            this.moveTo(DEGREE_TO_RADIAN * position)
        }

        /**
        * Move By Distance [radian]
        * @param distance [radian]
        */
        moveBy(distance: number) {
            this.writeFloat32(CMD_ACT_MOVE_BY_DISTANCE, distance)
        }

        /**
         * Move To Position [degree]
         * @param distance [degree]
         */
        //% blockId="moveByDeg" block="%KeiganMotor|move by distance [degree] %distance"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        moveByDeg(distance: number) {
            this.moveBy(DEGREE_TO_RADIAN * distance)
        }
        /**
        * Preset Position [radian]
        * @param position [radian]
        */
        presetPosition(position: number) {
            this.writeFloat32(CMD_ACT_PRESET_POSITION, position)
        }
        /**
         * Preset Position [degree]
         * @param position [degree]
         */
        //% blockId="presetPositionDeg" block="%KeiganMotor|Preset Position [degree] %position"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        presetPositionDeg(position: number) {
            this.presetPosition(DEGREE_TO_RADIAN * position)
        }

        /**
         * Free (de-energize Motor)
         */
        //% blockId="free" block="%KeiganMotor|free" 
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        free() {
            this.write(CMD_ACT_FREE)
        }

        /**
         * Stop (Set speed 0)
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
        //% advanced=true
        eraseMotion(index: number) {
            this.writeUInt16(CMD_DT_ERASE_MOTION, index)
        }

        /**
         * Start Teaching Motion at Index
         * @param index 
         * @param time [milliseconds]
         */
        //% blockId="startTeachingMotion" block="%KeiganMotor|start teaching motion at index %index for time %time"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        //% advanced=true
        startTeachingMotion(index: number, time: number) {
            this.writeUInt16UInt32(CMD_DT_START_TEACH_MOTION, index, time)
        }

        /**
         * Stop Teaching Motion
         */
        //% blockId="stopTeachingMotion" block="%KeiganMotor|stop teaching motion"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        //% advanced=true
        stopTeachingMotion() {
            this.write(CMD_DT_STOP_TEACH_MOTION)
        }



        /**
         * Prepare Playback Motion at Index
         * @param index 
         * @param repeating // times
         * @param option // playback start option 
         */
        //% blockId="preparePlaybackMotion" block="%KeiganMotor|prepare playback motion at index %index repeating %repeating option %option"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        //% advanced=true
        preparePlaybackMotion(index: number, repeating: number, option: PlaybackOption) {
            let start_op: number = option
            this.writeUInt16UInt32UInt8(CMD_ACT_PREPARE_PLAYBACK_MOTION, index, repeating, start_op)
        }


        /**
         * Start Playback Motion at Index
         */
        //% blockId="startPlaybackMotion" block="%KeiganMotor|start playback motion"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        //% advanced=true
        startPlaybackMotion() {
            this.write(CMD_ACT_START_PLAYBACK_MOTION_FROM_PREP)
        }

        /**
         * Stop Playback Motion at Index
         */
        //% blockId="stopPlaybackMotion" block="%KeiganMotor|stop playback motion"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        //% advanced=true
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
        //% blockId="KeiganMotor_led" block="%KeiganMotor|led state %led_state|red %red|green %green|blue %blue"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        led(state: LedState, red: number, green: number, blue: number) {
            let s: number = state
            this.writeUInt8Array(CMD_LED_SET, [s, red, green, blue])
        }

        /**
         * Reboot
         */
        //% blockId="reboot" block="%KeiganMotor|reboot"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        //% advanced=true
        reboot() {
            this.write(CMD_OTHERS_REBOOT)
        }


        /**
         * Get KeiganMotor parameters
         * @return position, velocity, torque
         */
        //% blockId="getPosition" block="%KeiganMotor|position [rad]"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        //% advanced=true
        getPosition(): number {
            return this.position
        }

        /**
         * Get the current position [degree]
         * @return the current degree
         */
        //% blockId="getDegree" block="%KeiganMotor|degree [deg]"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        getDegree(): number {
            let deg = Math.round(this.position * RADIAN_TO_DEGREE * 100) * 0.01 // TODO to long
            return deg
        }

        /**
         * Get the current velocity [rad/s]
         */
        //% blockId="getVelocity" block="%KeiganMotor|velocity [rad/s]"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        //% advanced=true
        getVelocity(): number {
            return this.velocity
        }

        /**
         * Get the current velocity [rotation/minute]
         */
        //% blockId="getRpm" block="%KeiganMotor|rotations per minute"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        getRpm(): number {
            let rpm = Math.roundWithPrecision(this.velocity * RADIANPERSEC_TO_RPM, 1)
            return rpm
        }

        /**
         * Get the current torque [Nm]
         */
        //% blockId="getTorque" block="%KeiganMotor|torque [Nm]"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        getTorque(): number {
            return this.torque
        }

        /**
         * Set Max Torque [Nm]
         * @param torque [N*m]
         */
        //% blockId="mxTorque" block="%KeiganMotor|set max torque [Nm] %value"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        maxTorque(value: number) {
            this.writeFloat32(CMD_REG_MAX_TORQUE, value)
        }

        /**
         * Set Curve Type of Motion Control
         * @param curve [CurveType]
         */
        //% blockId="curveType" block="%KeiganMotor|set curve type %type"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        //% advanced=true
        curveType(curve: CurveType) {
            this.writeUInt8Array(CMD_REG_CURVE_TYPE, [curve])
        }

        /**
         * Set RADIO group id of KeiganMotor
         * @param group:number (0-255) 
         */
        //% blockId="groupId" block="%KeiganMotor|set RADIO group for micro:bit %group"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        //% advanced=true
        ubitGroup(group:number) {
            this.writeUInt8Array(CMD_UBIT_GROUPID, [group])
        }

        /**
         * Read Motor Measurement (Position, Velocity and Torque) 
         */
        //% blockId="readMotor" block="%KeiganMotor|read motor measurement" 
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        readMotorMeasurement() {
            this.write(CMD_READ_MOTOR_MEASUREMENT)

        }


    }

    /*
      * Event handler when received packet from KeiganMotor
      */

    export const MAKECODE_RADIO_EVT_KEIGAN_READ = 0x140;
    export const MAKECODE_RADIO_EVT_KEIGAN_ERROR = 0x1BE;
    export const MAKECODE_RADIO_EVT_KEIGAN_MOTOR_MEAS = 0x1B4;
    export const MAKECODE_RADIO_EVT_KEIGAN_IMU_MEAS = 0x1B5;

    function init_DataReceived() {
        if (initialized) return;
        initialized = true;

        radio.onDataPacketReceived(function (packet: radio.Packet) {

            let s = packet.serial
            let b = packet.receivedBuffer

            let index = serialNumberArray.indexOf(s)

            // Returns if packet.serial not matched with any KeiganMotor
            if (index < 0) {
                console.log("Not found")
                return
            }

            let m = motorArray[index]

            let dataType = b.getNumber(NumberFormat.UInt8BE, 4)

            switch (dataType) {
                case RECEIVE_TYPE_READ:
                    control.raiseEvent(DAL.MICROBIT_ID_RADIO, MAKECODE_RADIO_EVT_KEIGAN_READ);
                    break;
                case RECEIVE_TYPE_ERROR:
                    // TODO
                    let cmd = b.getNumber(NumberFormat.UInt8BE, 7)
                    let errorCode = b.getNumber(NumberFormat.UInt8BE, 8)
                    console.logValue("Command", cmd)
                    console.logValue("Error Code:", errorCode)
                    control.raiseEvent(DAL.MICROBIT_ID_RADIO, MAKECODE_RADIO_EVT_KEIGAN_ERROR);
                    break;
                case CMD_READ_MOTOR_MEASUREMENT:
                    // Initialize 4 bytes buffer
                    // NOTE) getNumber(NumberFormat.Float32BE, 0) causes the following error without these initialize.
                    // error: "Floar32Array should be multiple of 4" 
                    let posBuffer = pins.createBuffer(4)
                    let velBuffer = pins.createBuffer(4)
                    let trqBuffer = pins.createBuffer(4)

                    let posSourceBuffer = b.slice(5, 4)
                    let velSourceBuffer = b.slice(9, 4)
                    let trqSourceBuffer = b.slice(13, 4)

                    posBuffer.write(0, posSourceBuffer)
                    velBuffer.write(0, velSourceBuffer)
                    trqBuffer.write(0, trqSourceBuffer)

                    let pos = posBuffer.getNumber(NumberFormat.Float32BE, 0)
                    let vel = velBuffer.getNumber(NumberFormat.Float32BE, 0)
                    let trq = trqBuffer.getNumber(NumberFormat.Float32BE, 0)

                    m.position = pos
                    m.velocity = vel
                    m.torque = trq

                    motorReceived = m

                    //console.logValue("pos", pos)
                    //console.logValue("vel", vel)
                    //console.logValue("trq", trq)

                    control.raiseEvent(DAL.MICROBIT_ID_RADIO, MAKECODE_RADIO_EVT_KEIGAN_MOTOR_MEAS);


                    break;
                default:
                    break;

            }
        })

    }

    /**
     * Event handler when received motor measurement from KeiganMotor
     */
    //% blockId="Received_Motor_Meas" block="on received motor measurement"
    //% weight=90 blockGap=8
    //% parts="KeiganMotor"
    export function onReceivedMotorMeasurement(cb: (motor: KeiganMotor) => void) {
        init_DataReceived();
        control.onEvent(DAL.MICROBIT_ID_RADIO, MAKECODE_RADIO_EVT_KEIGAN_MOTOR_MEAS, () => {
            cb(motorReceived)
        });
    }



}