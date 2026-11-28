import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet as renderSitemap} from '../functions/sitemap.xml.js';
import {DISCIPLINE_GUIDES} from '../lib/discipline-guides.js';
import {STUDIO_PATHS} from '../lib/studio-routes.js';
import {ARTICLE_PATHS} from '../lib/editorial-routes.js';

const data=readFileSync('lib/discipline-pages.js','utf8');
const {DISCIPLINES,DISCIPLINE_SLUGS}=await import('data:text/javascript;base64,'+Buffer.from(data).toString('base64'));
const {onRequestGet:handler}=await import('../functions/disciplines/[slug].js');

assert.equal(DISCIPLINE_SLUGS.length,10);
assert.deepEqual(Object.keys(DISCIPLINE_GUIDES).sort(),['culture','motion']);
const home=readFileSync('index.html','utf8');
const app=readFileSync('assets/app.js','utf8');
const sitemap=await (await renderSitemap({env:{}})).text();
assert.match(app,/requestedDiscipline/,'category query filter must remain connected');

for(const slug of DISCIPLINE_SLUGS){
  const listing=DISCIPLINES[slug];
  assert.ok(listing?.intro?.length>120,'missing meaningful introduction: '+slug);
  assert.ok(listing?.focus?.length>=3,'missing discipline detail: '+slug);
  assert.ok(home.includes('href="/disciplines/'+slug+'"'),'homepage does not link to '+slug);
  assert.ok(sitemap.includes('<loc>https://s-o.app/disciplines/'+slug+'</loc>'),'sitemap does not include '+slug);
  const preview=await handler({params:{slug},request:{url:'https://development.studio-openings.pages.dev/disciplines/'+slug}});
  assert.equal(preview.status,200);
  assert.equal(preview.headers.get('x-robots-tag'),'noindex, nofollow');
  const html=await preview.text();
  assert.ok(html.includes('https://s-o.app/disciplines/'+slug));
  assert.ok(html.includes('/?discipline='+slug+'#jobs'));
  assert.ok(!html.includes('"@type":"JobPosting"'),'editorial pages are not vacancy pages');
  const guide=DISCIPLINE_GUIDES[slug];
  if(guide){
    assert.ok(html.includes('name="description" content="'+guide.description+'"'));
    for(const section of guide.sections){
      assert.ok(html.includes('<h2>'+section.title+'</h2>'),section.title);
      assert.ok(html.includes(section.text),section.title);
    }
    for(const [resources,allowedPaths] of [[guide.studios,STUDIO_PATHS],[guide.articles,ARTICLE_PATHS]]){
      for(const {path} of resources){
        assert.ok(allowedPaths.includes(path),path+' must point to a published page');
        assert.ok(html.includes('href="'+path+'"'),path+' must appear in the reader guide');
      }
    }
    const reciprocalArticle=readFileSync(guide.articles[0].path.slice(1)+'.html','utf8');
    assert.ok(reciprocalArticle.includes('href="/disciplines/'+slug+'"'));
  }else{
    assert.ok(!html.includes('<h2>Explore these practices</h2>'));
  }
}
const missing=await handler({params:{slug:'unknown'},request:{url:'https://s-o.app/disciplines/unknown'}});
assert.equal(missing.status,404);
console.log('All discipline SEO route checks passed.');
