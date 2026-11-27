import {cleanPlacement} from './commercial-placements.js';
export function cleanBundle(x){const terms=cleanPlacement(x);if(!terms||!['sponsored-article','premium-coverage'].includes(x.product)||typeof x.brief!=='string'||x.brief.trim().length<10||x.brief.length>2000)return null;return {...terms,product:x.product,brief:x.brief.trim()};}
export function deliverables(product){return product==='premium-coverage'?['featured-job','sponsored-studio','sponsored-article']:product==='sponsored-article'?['sponsored-article']:[];}
