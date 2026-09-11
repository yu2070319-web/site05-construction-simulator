export class MissionSystem { constructor(target){this.target=target;} isDelivered(p){return Math.abs(p.x-this.target.x)<1.4&&Math.abs(p.z-this.target.z)<1.2&&p.y>2.2&&p.y<4.2;} }
