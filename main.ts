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

        id: string;

        public velocity: number; // [radians per second] 
        public position: number; // [radians]
        public torque: number; // [N*m]

        public rpm: number; // [rotation per minute] velocity's another expression 
        public degree: number; // [degree] position's another expression

        constructor(id: string) {
            this.id = id;
        }

        /**
         * Send raw bytes array
         */
        sendRaw(bytes: number[]) {
            let buf = pins.createBufferFromArray(bytes);
            radio.sendBuffer(buf);
        }


        /**
         * Send data after prepending id 
         */
        send(data: number[]) {
            let len = this.id.length;
            let array: number[] = [];

            for (let index = 0; index < len; index++) {
                array.insertAt(index, this.id.charCodeAt(index));
            }

            for (let index = array.length; index < data.length; index++) {
                array.insertAt(index, data[index]);
            }
            let buf = array;
            this.sendRaw(buf);

        }

        /**
         * Disable action 
         */
        //% blockId="disable" block="%KeiganMotor|disable" 
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        disable() {
            this.send([CMD_ACT_DISABLE])
        }

        /**
         * Enable action 
         */
        //% blockId="enable" block="%KeiganMotor|enable" 
        //% weight=85 blockGap=8
        //% parts="KeiganMotor"
        enable() {
            this.send([CMD_ACT_ENABLE])
        }


    }

    /**
     * Convert string to char (UInt8) array
     */



    /**
     * Create a new KeiganMotor.
     * @param name included by KeiganMotor's device name
     */
    //% blockId="KeiganMotor_create" block="KeiganMotor as name %name|with %groupeId"
    //% weight=90 blockGap=8
    //% parts="KeiganMotor"
    //% trackArgs=0,2
    //% blockSetVariable=strip
    export function create(id: string): KeiganMotor {
        let m = new KeiganMotor(id);
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
