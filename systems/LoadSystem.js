export class LoadSystem {
  constructor(){this.catalog={wood:500,rebar:1200,precast:3000,large:6000};}
  weight(type){return this.catalog[type]||1000;}
  capacityAt(radius){return Math.max(1200,7500-radius*650);}
  canLift(type,radius){const weight=this.weight(type);return {ok:weight<=this.capacityAt(radius),weight,capacity:this.capacityAt(radius)};}
}
