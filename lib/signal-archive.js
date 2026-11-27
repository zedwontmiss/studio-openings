// Approved editions only. Never place draft or illustrative content here.
export const SIGNAL_ARCHIVE=Object.freeze([]);
export function nextSignalNumber(archive=SIGNAL_ARCHIVE){return archive.reduce((max,d)=>Math.max(max,d.editionNumber),0)+1;}
export function validateArchive(archive){if(!Array.isArray(archive))throw Error('Invalid archive');let n=0;for(const d of archive){if(d.editionNumber!==++n||!['jobs','picks','reading'].every(k=>Array.isArray(d[k])&&d[k].length===2)||!/^\d{4}-\d{2}-\d{2}$/.test(d.publishedDate)||!Number.isFinite(Date.parse(d.publishedDate)))throw Error('Invalid approved edition');}return archive;}
