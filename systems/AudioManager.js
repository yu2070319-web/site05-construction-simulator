export class AudioManager {
  constructor(){this.context=null;this.nodes=new Map();}
  unlock(){if(!this.context)this.context=new (window.AudioContext||window.webkitAudioContext)();this.context.resume?.();}
  motor(name,amount){if(!this.context)return;let n=this.nodes.get(name);if(!n){const osc=this.context.createOscillator(),gain=this.context.createGain();osc.type='sawtooth';gain.gain.value=0;osc.connect(gain).connect(this.context.destination);osc.start();n={osc,gain};this.nodes.set(name,n);}const t=this.context.currentTime;n.osc.frequency.setTargetAtTime(58+Math.abs(amount)*34,t,.08);n.gain.gain.setTargetAtTime(Math.abs(amount)*.018,t,.1);}
  stop(name){const n=this.nodes.get(name);if(n)n.gain.gain.setTargetAtTime(0,this.context.currentTime,.08);}
}
