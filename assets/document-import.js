/** Browser-only job description reader. Original files NEVER leave the browser.
 * TXT/MD and DOCX are self-contained. For selectable-text PDF, the open-source
 * PDF.js library is loaded from cdnjs only when a PDF is chosen.
 */
(function(){
 'use strict';
 function byId(id){return document.getElementById(id);}
 var MAX_FILE=4*1024*1024, MAX_TEXT=18000;
 function info(message,error){var el=byId('import-status');if(!el)return;el.textContent=message;el.hidden=false;el.className='import-status'+(error?' import-error':'');}
 function decodeZipEntry(buffer,path){
   var view=new DataView(buffer),u8=new Uint8Array(buffer),decoder=new TextDecoder();
   var offset=-1,end=Math.max(0,buffer.byteLength-66000);
   for(var i=buffer.byteLength-22;i>=end;i--){if(view.getUint32(i,true)===0x06054b50){offset=i;break;}}
   if(offset<0)throw Error('This DOCX has no valid ZIP directory.');
   var count=view.getUint16(offset+10,true),ptr=view.getUint32(offset+16,true);
   if(count>3000)throw Error('Document contains too many components.');
   for(var n=0;n<count;n++){
     if(view.getUint32(ptr,true)!==0x02014b50)throw Error('Invalid DOCX directory.');
     var method=view.getUint16(ptr+10,true),csize=view.getUint32(ptr+20,true),usize=view.getUint32(ptr+24,true),fn=view.getUint16(ptr+28,true),ex=view.getUint16(ptr+30,true),com=view.getUint16(ptr+32,true),local=view.getUint32(ptr+42,true);
     var name=decoder.decode(u8.subarray(ptr+46,ptr+46+fn));ptr+=46+fn+ex+com;
     if(name!==path)continue;
     if(usize>2000000||csize>MAX_FILE)throw Error('Document text is too large.');
     if(view.getUint32(local,true)!==0x04034b50)throw Error('Corrupted DOCX file.');
     var start=local+30+view.getUint16(local+26,true)+view.getUint16(local+28,true);
     if(start+csize>buffer.byteLength)throw Error('Truncated DOCX file.');
     return {method,compressed:u8.slice(start,start+csize),usize};
   }
   throw Error('No Word document text was found.');
 }
 async function docxText(file){
   var doc=decodeZipEntry(await file.arrayBuffer(),'word/document.xml');
   var bytes;
   if(doc.method===0){bytes=doc.compressed;}
   else if(doc.method===8){
     if(!window.DecompressionStream)throw Error('DOCX extraction requires a newer browser. Paste the description instead.');
     try{bytes=new Uint8Array(await new Response(new Blob([doc.compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());}
     catch(e){throw Error('DOCX extraction unavailable in this browser. Paste the description instead.');}
   } else throw Error('Unsupported DOCX compression method.');
   if(bytes.length>2000000)throw Error('Document text is too large.');
   var dom=new DOMParser().parseFromString(new TextDecoder().decode(bytes),'application/xml');
   if(dom.querySelector('parsererror'))throw Error('Unable to read Word document XML.');
   var w='http://schemas.openxmlformats.org/wordprocessingml/2006/main', paragraphs=Array.from(dom.getElementsByTagNameNS(w,'p'));
   var text=paragraphs.map(function(p){
     return Array.from(p.getElementsByTagNameNS(w,'t')).map(function(t){return t.textContent;}).join('');
   }).filter(Boolean).join('\n');
   if(!text.trim())throw Error('No selectable text was found in this DOCX.');
   return text;
 }
 var pdfjsPromise;
 async function loadPdfjs(){
   if(window.pdfjsLib)return window.pdfjsLib;
   if(pdfjsPromise)return pdfjsPromise;
   pdfjsPromise=new Promise(function(resolve,reject){
     var sc=document.createElement('script');
     sc.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
     sc.onload=function(){if(window.pdfjsLib)resolve(window.pdfjsLib);else reject(Error('PDF.js did not initialize.'));};
     sc.onerror=function(){reject(Error('PDF reader cannot load. Check your connection or paste text.'));};
     document.head.appendChild(sc);
   });
   return pdfjsPromise;
 }
 async function pdfText(file){
   var lib=await loadPdfjs();
   lib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
   var task=lib.getDocument({data:new Uint8Array(await file.arrayBuffer())});
   var pdf=await task.promise;
   var pieces=[];
   for(var i=1;i<=Math.min(pdf.numPages,12);i++){
     var page=await pdf.getPage(i),content=await page.getTextContent();
     pieces.push(content.items.map(function(item){return item.str||'';}).join(' '));
     if(pieces.join('').length>MAX_TEXT)break;
   }
   if(pdf.destroy)await pdf.destroy();
   var text=pieces.join('\n').trim();
   if(text.length<25)throw Error('This PDF appears scanned or has no selectable text. Please paste the description.');
   return text;
 }
 async function readFile(file){
   if(!file)throw Error('Choose a document first.');
   if(file.size>MAX_FILE)throw Error('Maximum file size is 4 MB. Paste the description instead.');
   var ext=file.name.split('.').pop().toLowerCase();
   if(['txt','md'].includes(ext))return file.text();
   if(ext==='docx')return docxText(file);
   if(ext==='pdf')return pdfText(file);
   throw Error('Supported formats: PDF, DOCX, TXT, MD.');
 }
 function labelled(lines,pattern){for(var i=0;i<lines.length;i++){var m=lines[i].match(pattern);if(m&&m[1]&&m[1].trim())return m[1].trim();}return '';}
 function classifyRole(text){
   var str=text.toLowerCase();
   if(/(?:museum|exhibi|curat)/.test(str))return 'museum';
   if(/(?:architecture|architect|urban plan|landscape architect)/.test(str))return 'architecture';
   if(/(?:interior|spatial|furniture)/.test(str))return 'interior';
   if(/(?:industrial design|product manufactur)/.test(str))return 'industrial';
   if(/(?:graphic|brand design|illustrat)/.test(str))return 'visual';
   if(/(?:motion|animation|video edit|vfx|3d art)/.test(str))return 'motion';
   if(/(?:fashion|photograph|textile)/.test(str))return 'fashion';
   if(/(?:web design|creative technol)/.test(str))return 'web';
   if(/(?:ux|ui|product design|user experience)/.test(str))return 'product';
   if(/(?:arts coordinat|cultural producer)/.test(str))return 'culture';
   return '';
 }
 function parse(text){
   var cleaned=String(text||'').replace(/\r/g,'').replace(/\u0000/g,'').trim().slice(0,MAX_TEXT),lines=cleaned.split('\n').map(s=>s.trim()).filter(Boolean);
   var title=labelled(lines,/^(?:job title|position|role|vacancy|title)\s*[:\-]\s*(.+)$/i);
   if(!title&&lines[0]&&lines[0].length<=95&&!/^(?:job description|about us|we are hiring|position summary)$/i.test(lines[0]))title=lines[0];
   var salary=labelled(lines,/^(?:salary|compensation|pay range|remuneration)\s*[:\-]\s*(.+)$/i);
   var modeText=labelled(lines,/^(?:work arrangement|working mode|work location type|arrangement|work mode)\s*[:\-]\s*(.+)$/i);
   var typeText=labelled(lines,/^(?:employment|employment type|job type|contract type)\s*[:\-]\s*(.+)$/i);
   var output={
     title:title.slice(0,120),company:labelled(lines,/^(?:company|employer|organization|organisation|studio)\s*[:\-]\s*(.+)$/i).slice(0,100),
     location:labelled(lines,/^(?:location|based in|work location)\s*[:\-]\s*(.+)$/i).slice(0,90),
     salary:salary.slice(0,75),eligibility:labelled(lines,/^(?:eligibility|work authorization|work authorisation|eligible applicants)\s*[:\-]\s*(.+)$/i).slice(0,170),
     description:cleaned.slice(0,4800),mode:'',type:'',role:''
   };
   if(/hybrid/i.test(modeText))output.mode='hybrid';else if(/on[- ]site|in[- ]office/i.test(modeText))output.mode='onsite';else if(/remote/i.test(modeText))output.mode='remote';
   if(/full[- ]time/i.test(typeText))output.type='Full-time';else if(/part[- ]time/i.test(typeText))output.type='Part-time';else if(/contract|freelance/i.test(typeText))output.type='Contract';else if(/intern/i.test(typeText))output.type='Internship';
   output.role=classifyRole((title+' '+cleaned.slice(0,600)));
   return output;
 }
 function apply(parsed){
   var form=byId('submission-form'),changed=0;
   if(!form)return;
   Object.keys(parsed).forEach(function(key){
     var el=form.elements.namedItem(key);
     if(el&&parsed[key]){el.value=parsed[key];changed++;}
   });
   info('Extracted '+changed+' field'+(changed===1?'':'s')+'. Review every field and correct anything missing before submitting.');
 }
 document.addEventListener('DOMContentLoaded',function(){
   var file=byId('job-document'),paste=byId('job-paste'),button=byId('import-document');
   if(!button)return;
   button.addEventListener('click',async function(){
     button.disabled=true;info('Reading document locally…');
     try {
       var text=paste.value.trim();
       if(!text){if(!file.files.length)throw Error('Choose a document or paste a job description.');text=await readFile(file.files[0]);}
       if(text.trim().length<20)throw Error('Not enough readable text. Paste a fuller job description.');
       apply(parse(text));
     }catch(e){info(e.message||'Could not extract document. Paste the text instead.',true);}
     finally{button.disabled=false;}
   });
 });
 window.StudioOpeningDocumentImport={readFile:readFile,parse:parse};
})();
