import RAPIER from '../vendor/rapier.js';
import * as THREE from 'three';

export class PhysicsWorld {
  static async create(){await RAPIER.init();return new PhysicsWorld();}
  constructor(){this.RAPIER=RAPIER;this.world=new RAPIER.World({x:0,y:-9.81,z:0});this.world.timestep=1/60;this.dynamic=[];this.addFixedBox({x:0,y:.35,z:0},{x:13.2,y:.2,z:10.2},.9);for(let floor=0;floor<5;floor++)this.addFixedBox({x:-2,y:.78+floor*1.8,z:-1.6},{x:4.15,y:.12,z:3.15},.82);for(const x of [-5.7,-3.24,-.78,1.7])for(const z of [-4.3,-1.6,1.1])this.addFixedBox({x,y:4.8,z},{x:.16,y:4.1,z:.16},.8);for(const z of [-9.7,9.7])this.addFixedBox({x:0,y:1,z},{x:13,y:.6,z:.12});for(const x of [-13,13])this.addFixedBox({x,y:1,z:0},{x:.12,y:.6,z:9.7});for(const [x,z,hx,hz] of [[4.1,-5.9,1,1],[-9.3,1.3,1,1],[-8.8,-7.4,1.8,1.3],[6.2,-6.3,.8,.55]])this.addFixedBox({x,y:.95,z},{x:hx,y:.6,z:hz},.9);}
  addFixedBox(position,half,friction=.8){const body=this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(position.x,position.y,position.z));this.world.createCollider(RAPIER.ColliderDesc.cuboid(half.x,half.y,half.z).setFriction(friction),body);return body;}
  createKinematic(position){return this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(position.x,position.y,position.z));}
  createTrackedBody(mesh,mass=7200){mesh.updateMatrixWorld(true);const p=mesh.position,q=mesh.quaternion;const body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(p.x,p.y,p.z).setRotation(q).setLinearDamping(1.35).setAngularDamping(2.2).setCanSleep(false));body.setEnabledRotations(false,true,false,true);this.world.createCollider(RAPIER.ColliderDesc.cuboid(.95,.3,.72).setTranslation(0,.28,0).setMass(mass).setFriction(1.25),body);return body;}
  createCargo(mesh,{mass=1200,half={x:1.08,y:.2,z:.26}}={}){mesh.updateMatrixWorld(true);const p=mesh.getWorldPosition(new THREE.Vector3()),q=mesh.getWorldQuaternion(new THREE.Quaternion());const body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(p.x,p.y,p.z).setRotation(q).setLinearDamping(.18).setAngularDamping(.35).setCcdEnabled(true));const collider=this.world.createCollider(RAPIER.ColliderDesc.cuboid(half.x,half.y,half.z).setMass(mass).setFriction(.78).setRestitution(.04),body);const item={mesh,body,collider,mass};this.dynamic.push(item);return item;}
  createRope(hookBody,cargoBody,length=.68){return this.world.createImpulseJoint(RAPIER.JointData.rope(length,{x:0,y:0,z:0},{x:0,y:.18,z:0}),hookBody,cargoBody,true);}
  removeJoint(joint){if(joint)this.world.removeImpulseJoint(joint,true);}
  step(dt){this.world.timestep=Math.min(1/30,Math.max(1/120,dt));this.world.step();for(const {mesh,body} of this.dynamic){const p=body.translation(),q=body.rotation();mesh.position.set(p.x,p.y,p.z);mesh.quaternion.set(q.x,q.y,q.z,q.w);}}
}


