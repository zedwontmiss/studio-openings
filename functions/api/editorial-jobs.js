/** Short-lived editorial pilot. Every item links directly to its verified original vacancy.
 * Recheck the URL and employer page before refreshing the expiry.
 * No automated scraping of employer websites or third-party boards.
 */
const REVIEWED='2026-11-19';
const EXPIRES='2026-11-26';
const OPENINGS=Object.freeze([
 {id:'editorial-hdm-interior-basel',title:'Interior Designer (100%)',company:'Herzog & de Meuron',
  location:'Basel, Switzerland',geoCountry:'CH',role:'interior',type:'Full-time',tags:['Interior'],
  url:'https://www.herzogdemeuron.com/practice/jobs/basel-experienced-interior-designer-100-2/',
  description:'Interior design vacancy with Herzog & de Meuron in Basel. The role focuses on interior concepts, project documentation, materials and interior details. Read the original employer job page for experience, language and software requirements.'},
 {id:'editorial-hdm-bim-basel',title:'Junior BIM Manager (100%)',company:'Herzog & de Meuron',
  location:'Basel, Switzerland',geoCountry:'CH',role:'architecture',type:'Full-time',tags:['Architecture','BIM'],
  url:'https://www.herzogdemeuron.com/practice/jobs/basel-junior-bim-manager-100/',
  description:'Design Technologies opening at Herzog & de Meuron in Basel. This BIM role supports architectural design workflows and coordination. Refer to the employer posting for the current BIM responsibilities and technical qualifications.'},
 {id:'editorial-hdm-architect-basel',title:'Architect — German-speaking (80–100%)',company:'Herzog & de Meuron',
  location:'Basel, Switzerland',geoCountry:'CH',role:'architecture',type:'Not specified',tags:['Architecture'],
  url:'https://www.herzogdemeuron.com/practice/jobs/basel-erfahrene-deutschsprachige-architekt-innen/',
  description:'Experienced German-speaking building architect for Herzog & de Meuron’s Basel office. The studio seeks experience with Swiss architectural projects, building-design delivery and professional practice. Listed workload is 80–100%; consult the original job page for full details.'},
 {id:'editorial-mvrdv-architect-ny',title:'Architect / Architectural Designer',company:'MVRDV',
  location:'New York, United States',geoCountry:'US',role:'architecture',type:'Not specified',tags:['Architecture','Revit','AutoCAD'],salary:'USD 82k–96k /yr',mode:'onsite',
  url:'https://jobs.mvrdv.com/o/architect-architectural-designer',
  description:'New York architectural design opening. Responsibilities include design layouts, technical drawings, renderings, consultant coordination and building-code research. MVRDV requests professional architecture experience and Revit proficiency. U.S. work authorization is required; read the original vacancy for details.'},
 {id:'editorial-mvrdv-paris-architect',title:'Designer / Architect — Fixed-term contract',company:'MVRDV',
  location:'Paris, France',geoCountry:'FR',role:'architecture',type:'Contract',tags:['Architecture','Revit','BIM'],mode:'onsite',
  url:'https://jobs.mvrdv.com/o/designer-architect-fixed-term-contract-cdd',
  description:'Paris-based architectural designer on a fixed-term contract (CDD). Work covers architectural project development, execution drawings, technical details, Revit BIM models and project-team coordination. Excellent French language skills and work authorization for France are required.'}
]);
const HEAD={'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=300','x-content-type-options':'nosniff'};
export async function onRequestGet(){
 const today=new Date().toISOString().slice(0,10),active=today>=REVIEWED&&today<=EXPIRES;
 const jobs=active?OPENINGS.map(o=>({...o,expiresAt:new Date(Date.parse(EXPIRES+'T00:00:00Z')+86400000).toISOString(),mode:o.mode||'',salary:o.salary||'',posted:'',dateKind:'added',
  verifiedAt:REVIEWED,descriptionKind:'editorial-summary',source:'Official careers · '+o.company,
  sourceUrl:o.url,applicationMethod:'external',locationKind:'office',relevance:93,qualityScore:94})):[];
 return new Response(JSON.stringify({jobs,checkedAt:REVIEWED,expiresAt:EXPIRES,status:active?'editorial-current':'editorial-expired'}),{headers:HEAD});
}
export {OPENINGS,REVIEWED,EXPIRES};
