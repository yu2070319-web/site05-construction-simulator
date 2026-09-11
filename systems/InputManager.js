export class InputManager {
  constructor(){this.slew=0;this.hoist=0;this.trolley=0;}
  read(joystick,actions){this.slew=joystick.x;this.hoist=(actions.has('hookUp')?1:0)-(actions.has('hookDown')?1:0);this.trolley=(actions.has('trolleyOut')?1:0)-(actions.has('trolleyIn')?1:0);return this;}
  clear(){this.slew=this.hoist=this.trolley=0;}
}
