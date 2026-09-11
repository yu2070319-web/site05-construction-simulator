import * as THREE from 'three';
import {LoadSystem} from './LoadSystem.js';
import {AudioManager} from './AudioManager.js';
import {MobileControls} from './MobileControls.js';

export class CraneController {
  constructor({rig,cargo,physics,onStatus=()=>{}}){this.rig=rig;this.mesh=cargo;this.physics=physics;this.loads=new LoadSystem();this.audio=new AudioManager();this.onStatus=onStatus;this.slewVelocity=0;this.trolleyVelocity=0;this.hoistVelocity=0;this.joint=null;this.attached=false;this.cargo=physics.createCargo(cargo,{mass:this.loads.weight('rebar')});const hookPos=rig.block.getWorldPosition(new THREE.Vector3());this.hookBody=physics.createKinematic(hookPos);this.sling=null;this.lastHook=hookPos.clone();}
  smooth(current,target,response,dt){return THREE.MathUtils.lerp(current,target,1-Math.exp(-response*dt));}
  capacity(){return this.loads.canLift('rebar',this.rig.trolleyX);}
  hookPoint(){return this.rig.block.getWorldPosition(new THREE.Vector3());}
  cargoPoint(){const p=this.cargo.body.translation();return new THREE.Vector3(p.x,p.y+.18,p.z);}
  riggingDistance(){return this.hookPoint().distanceTo(this.cargoPoint());}
  canConnect(){return !this.attached&&this.riggingDistance()<.3;}
  connect(){if(!this.canConnect())return false;const load=this.capacity();if(!load.ok){this.onStatus('⚠ 超出允许载荷');MobileControls.vibrate([35,40,35]);return false;}this.joint=this.physics.createRope(this.hookBody,this.cargo.body,.68);this.attached=true;this.rig.cargo=this.mesh;this.createSling();MobileControls.vibrate(18);return true;}
  disconnect(){if(!this.attached)return false;this.physics.removeJoint(this.joint);this.joint=null;this.attached=false;this.rig.cargo=null;if(this.sling){this.sling.removeFromParent();this.sling.geometry.dispose();this.sling.material.dispose();this.sling=null;}MobileControls.vibrate(16);return true;}
  createSling(){const geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,-.7,0)]);this.sling=new THREE.Line(geometry,new THREE.LineBasicMaterial({color:'#313837'}));this.rig.block.add(this.sling);}
  updateVisualCable(){const L=this.rig.cableLength;for(const cable of this.rig.cables){cable.scale.y=L/4.7;cable.position.y=-L/2;}this.rig.block.position.y=-L;}
  update(input,dt){const loadFactor=this.attached?Math.max(.38,1-this.cargo.mass/6500):1;this.slewVelocity=this.smooth(this.slewVelocity,input.slew*.42*loadFactor,2.1*loadFactor,dt);this.trolleyVelocity=this.smooth(this.trolleyVelocity,input.trolley*1.65*loadFactor,3.2,dt);const lift=this.capacity();const requested=input.hoist>0&&this.attached&&!lift.ok?0:input.hoist;this.hoistVelocity=this.smooth(this.hoistVelocity,requested*1.7*loadFactor,3.4,dt);this.rig.rotor.rotation.y+=this.slewVelocity*dt;this.rig.trolleyX=THREE.MathUtils.clamp(this.rig.trolleyX+this.trolleyVelocity*dt,1.25,8.1);if(this.rig.trolleyX===1.25||this.rig.trolleyX===8.1)this.trolleyVelocity=0;this.rig.trolley.position.x=this.rig.trolleyX;this.rig.cableLength=THREE.MathUtils.clamp(this.rig.cableLength-this.hoistVelocity*dt,1.1,this.rig.height-1);if(this.rig.cableLength===1.1||this.rig.cableLength===this.rig.height-1)this.hoistVelocity=0;this.updateVisualCable();this.rig.root.updateMatrixWorld(true);const hook=this.hookPoint();this.hookBody.setNextKinematicTranslation(hook);this.physics.step(dt);if(this.sling){const cargo=this.cargoPoint(),local=this.rig.block.worldToLocal(cargo.clone());this.sling.geometry.setFromPoints([new THREE.Vector3(),local]);}this.audio.motor('crane',Math.max(Math.abs(this.slewVelocity),Math.abs(this.hoistVelocity)*.2,Math.abs(this.trolleyVelocity)*.3));this.lastHook.copy(hook);}
  swingDeg(){if(!this.attached)return 0;const delta=this.cargoPoint().sub(this.hookPoint()),vertical=Math.abs(delta.y)||.001;return THREE.MathUtils.radToDeg(Math.atan2(Math.hypot(delta.x,delta.z),vertical));}
  snapshot(){const cap=this.capacity();return {physics:true,slewVelocity:this.slewVelocity,trolleyVelocity:this.trolleyVelocity,hoistVelocity:this.hoistVelocity,loadKg:this.attached?this.cargo.mass:0,capacityKg:cap.capacity,swingDeg:this.swingDeg(),riggingDistance:this.riggingDistance()};}
  debugPlaceCargo(position){this.cargo.body.setTranslation({x:position[0],y:position[1],z:position[2]},true);this.cargo.body.setLinvel({x:0,y:0,z:0},true);}
  debugPlaceCargoAtHook(){const p=this.hookPoint();this.debugPlaceCargo([p.x,p.y-.18,p.z]);}
}
