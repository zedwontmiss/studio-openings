import assert from 'node:assert/strict';
import search from '../assets/search-topics.js';

const byId=new Map(search.topics.map(topic=>[topic.id,topic]));

export function studioTopicIds(studio){
 return search.topics.filter(topic=>topic.cityId
  ?studio.offices.some(office=>office.cityId===topic.cityId&&office.kind==='office')
  :search.matchesDiscipline(topic,studio.disciplines,studio.summary+' '+studio.overview)
 ).map(topic=>topic.id);
}

export function topicAttributes(ids=[]){
 assert.ok(Array.isArray(ids),'Search topics must be a list');
 if(!ids.length)return '';
 assert.ok(ids.every(id=>byId.has(id))&&new Set(ids).size===ids.length,'Invalid or duplicate search topic');
 return ' data-topics="'+ids.join(' ')+'"';
}

export function renderTopicPills(ids=[]){
 if(!topicAttributes(ids))return '';
 return '<nav class="so-topic-pills" aria-label="Search by topic">'+ids.map(id=>{
  const {label}=byId.get(id);
  return '<a href="/?q='+encodeURIComponent(label)+'">'+label+'</a>';
 }).join('')+'</nav>';
}
