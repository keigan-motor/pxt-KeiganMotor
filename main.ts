/**
 * LED State for KeiganMotor
 */
enum led_state {
    OFF = 0,
    ON_SOLID = 1,
    ON_FLASH = 2,
    ON_DIM = 3
}

/**
 * Functions to operate KeiganMotor
 */
//% weight=5 color=#D82317 icon="\uf110"
namespace keiganmotor {

    /*
     * Set RADIO groupId 
     */
    export function setGroup(id: number) {
        if (0 <= id && id <= 255) radio.setGroup(id);
    }

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

    const CMD_OTHERS_REBOOT = 0xF0

    /**
     * A KeiganMotor
     */
    export class KeiganMotor {

        name: string
        nameArray: number[]
        group: number // radio group

        public velocity: number // [radians per second] 
        public position: number // [radians]
        public torque: number // [N*m]

        public rpm: number // [rotation per minute] velocity's another expression 
        public degree: number // [degree] position's another expression

        constructor(name: string) {
            this.name = name
            this.makeNameArray()
        }

        private makeNameArray() {
            let array = [0, 0, 0, 0];
            for (let index = 0; index < 4; index++) {
                array.insertAt(index, this.name.charCodeAt(index));
            }
            this.nameArray = array;
        }

        /**
         * Unit conversion　degree -> radian
         * @param {number} degree 
         * @returns {number} radian
         */
        private degreeToRadian(degree: number) {
            return degree * 0.017453292519943295;
        }

        /**
         * Unit conversion　radian -> degree
         * @param {number} radian 
         * @returns {number} degree
         */
        private radianToDegree(radian: number) {
            return radian / 0.017453292519943295;
        }

        /**
         * Unit conversion rpm -> radian/sec 
         * @param {number} rpm
         * @returns {number} radian/sec
         */
        private rpmToRadianSec(rpm: number) {
            //rpm ->radian/sec (Math.PI*2/60)
            return rpm * 0.10471975511965977;
        }

        /**
         * Send raw bytes array
         */
        sendRaw(bytes: number[]) {
            let buf = pins.createBufferFromArray(bytes)

            radio.sendBuffer(buf);
        }


        /**
         * Send command after prepending name = "XXXX" 
         * [ X X X X | CMD ]
         */
        write(command: number) {
            let buf = pins.createBuffer(5)
            buf.write(0, pins.createBufferFromArray(this.nameArray))
            buf.setNumber(NumberFormat.UInt8BE, 4, command)
            radio.sendBuffer(buf)

        }

        /**
         * Send command after prepending name = "XXXX"
         * [ X X X X | CMD | VALUES(BYTES) ]
         */
        writeSize4(command: number, value: number) {
            let buf = pins.createBuffer(5 + 4)
            buf.write(0, pins.createBufferFromArray(this.nameArray))
            buf.setNumber(NumberFormat.UInt8LE, 4, command)
            buf.setNumber(NumberFormat.UInt8LE, 5, value)
            radio.sendBuffer(buf)
        }

        /**
        * Send command after prepending name = "XXXX"
        * [ X X X X | CMD | VALUES(BYTES) ]
        */
        writeSize2(command: number, value: number) {
            let buf = pins.createBuffer(5 + 2)
            buf.write(0, pins.createBufferFromArray(this.nameArray))
            buf.setNumber(NumberFormat.UInt8LE, 4, command)
            buf.setNumber(NumberFormat.UInt8LE, 5, value)
            radio.sendBuffer(buf)
        }

        /**
         * Disable action 
         */
        //% blockId="disable" block="%KeiganMotor|disable" 
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        disable() {
            this.write(CMD_ACT_DISABLE)

        }

        /**
         * Enable action 
         */
        //% blockId="enable" block="%KeiganMotor|enable" 
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        enable() {
            this.write(CMD_ACT_ENABLE)
        }


        /**
         * Set speed
         * @param speed [radians/sec]
         */
        //% blockId="speed" block="%KeiganMotor|speed %value"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        speed(value: number) {
            this.writeSize4(CMD_ACT_SPEED, value)
        }

        /**
         * Set speed
         * @param speed [radians/sec]
         */
        //% blockId="speedRpm" block="%KeiganMotor|speed rpm %value"
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        speedRpm(value: number) {
            this.speed(this.rpmToRadianSec(value))
        }

        /**
         * Run forward
         */
        //% blockId="runForward" block="%KeiganMotor|runForward" 
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        runForward() {
            this.write(CMD_ACT_RUN_FORWARD)
        }

        /**
         * Run Reverse
         */
        //% blockId="runReverse" block="%KeiganMotor|runReverse" 
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        runReverse() {
            this.write(CMD_ACT_RUN_REVERSE)
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

    }

    /**
     * Convert string to char (UInt8) array
     */



    /**
     * Create a new KeiganMotor.
     * @param name included by KeiganMotor's device name
     */
    //% blockId="KeiganMotor_create" block="KeiganMotor as name %name"
    //% weight=90 blockGap=8
    //% parts="KeiganMotor"
    //% trackArgs=0,2
    //% blockSetVariable=m
    export function create(name: string): KeiganMotor {
        let m = new KeiganMotor(name);
        return m;
    }

    /**
     * Set LED state to led_state and colors
     * @param led_state
     * @param red value between 0 and 255. eg: 255
     * @param green value between 0 and 255. eg: 255
     * @param blue value between 0 and 255. eg: 255
     */
    //% weight=1
    //% blockId="KeiganMotor_led" block="red %red|green %green|blue %blue"
    //% advanced=true
    export function led(state: led_state, red: number, green: number, blue: number) {

    }






}
