export class CameraController { constructor(camera){this.camera=camera;} follow(position,target,alpha=.08){this.camera.position.lerp(position,alpha);this.camera.lookAt(target);} }
