/** Studio Openings v0.6.1 — native employer submissions, review before publish.
 * Offline preview can prepare downloadable JSON but cannot send to Cloudflare.
 */
(function(){
 'use strict';
 function $(id){return document.getElementById(id);}
 var panel=$('submission-panel'), backdrop=$('submission-backdrop'),form=$('submission-form');
 if(!panel||!form)return;
 var mode='employer',lastFocus=null,configuration=null,widgetId=null,token='',lastPrepared=null;
 // Explicit required-field convention, including a non-color-only explanation.
 // The existing HTML already contains the visible required asterisks and required attributes.
 var legend=document.createElement('p');legend.className='so-required-legend';
 var legendStar=document.createElement('span');legendStar.setAttribute('aria-hidden','true');legendStar.textContent='*';
 legend.appendChild(legendStar);legend.appendChild(document.createTextNode(' Required fields'));
 form.insertBefore(legend,form.firstChild);
 var permissionLabel=form.querySelector('.submission-consent label');
 if(permissionLabel && !permissionLabel.querySelector('.so-permission-required')){
   var permissionStar=document.createElement('span');permissionStar.className='so-permission-required';
   permissionStar.setAttribute('aria-hidden','true');permissionStar.textContent='*';
   permissionLabel.appendChild(permissionStar);
 }
 // v0.11: optional employer-only inquiry. No payment, priority, or publication is granted here.
 var featuredChoice=document.createElement('div');
 featuredChoice.className='featured-inquiry';
 featuredChoice.id='featured-inquiry';
 var featuredLabel=document.createElement('label');
 featuredLabel.className='featured-inquiry-choice';
 var featuredInput=document.createElement('input');
 featuredInput.type='checkbox';featuredInput.name='featuredInterest';featuredInput.value='yes';
 featuredLabel.appendChild(featuredInput);
 var featuredHeading=document.createElement('span');
 featuredHeading.textContent='Make your job stand out ';
 var featuredStar=document.createElement('span');
 featuredStar.className='featured-inquiry-star';featuredStar.textContent='★';
 featuredStar.setAttribute('aria-label','Featured listing');
 featuredHeading.appendChild(featuredStar);featuredLabel.appendChild(featuredHeading);
 featuredChoice.appendChild(featuredLabel);
 var featuredExplain=document.createElement('p');
 featuredExplain.textContent='Give your opening a spotlight in the feed. Featured jobs get an exclusive baby-yellow highlight and a star beside the title. Request a spot now; we’ll confirm availability and pricing after review. No payment today.';
 featuredChoice.appendChild(featuredExplain);
 var beforeConsent=form.querySelector('.submission-consent');
 if(beforeConsent)form.insertBefore(featuredChoice,beforeConsent);
 else form.appendChild(featuredChoice);
 function syncFeaturedHighlight(){featuredChoice.classList.toggle('is-selected',mode==='employer' && featuredInput.checked);}
 featuredInput.addEventListener('change',syncFeaturedHighlight);

 // Release readiness: lightweight offline ISO country/state suggestions. No API or geolocation.
 var soPlaces=[{"label":"Andorra","countryCode":"AD","regionCode":"","kind":"country"},{"label":"United Arab Emirates","countryCode":"AE","regionCode":"","kind":"country"},{"label":"Afghanistan","countryCode":"AF","regionCode":"","kind":"country"},{"label":"Antigua and Barbuda","countryCode":"AG","regionCode":"","kind":"country"},{"label":"Anguilla","countryCode":"AI","regionCode":"","kind":"country"},{"label":"Albania","countryCode":"AL","regionCode":"","kind":"country"},{"label":"Armenia","countryCode":"AM","regionCode":"","kind":"country"},{"label":"Angola","countryCode":"AO","regionCode":"","kind":"country"},{"label":"Antarctica","countryCode":"AQ","regionCode":"","kind":"country"},{"label":"Argentina","countryCode":"AR","regionCode":"","kind":"country"},{"label":"American Samoa","countryCode":"AS","regionCode":"","kind":"country"},{"label":"Austria","countryCode":"AT","regionCode":"","kind":"country"},{"label":"Australia","countryCode":"AU","regionCode":"","kind":"country"},{"label":"Aruba","countryCode":"AW","regionCode":"","kind":"country"},{"label":"Åland Islands","countryCode":"AX","regionCode":"","kind":"country"},{"label":"Azerbaijan","countryCode":"AZ","regionCode":"","kind":"country"},{"label":"Bosnia and Herzegovina","countryCode":"BA","regionCode":"","kind":"country"},{"label":"Barbados","countryCode":"BB","regionCode":"","kind":"country"},{"label":"Bangladesh","countryCode":"BD","regionCode":"","kind":"country"},{"label":"Belgium","countryCode":"BE","regionCode":"","kind":"country"},{"label":"Burkina Faso","countryCode":"BF","regionCode":"","kind":"country"},{"label":"Bulgaria","countryCode":"BG","regionCode":"","kind":"country"},{"label":"Bahrain","countryCode":"BH","regionCode":"","kind":"country"},{"label":"Burundi","countryCode":"BI","regionCode":"","kind":"country"},{"label":"Benin","countryCode":"BJ","regionCode":"","kind":"country"},{"label":"Saint Barthélemy","countryCode":"BL","regionCode":"","kind":"country"},{"label":"Bermuda","countryCode":"BM","regionCode":"","kind":"country"},{"label":"Brunei Darussalam","countryCode":"BN","regionCode":"","kind":"country"},{"label":"Bolivia","countryCode":"BO","regionCode":"","kind":"country"},{"label":"Bonaire, Sint Eustatius and Saba","countryCode":"BQ","regionCode":"","kind":"country"},{"label":"Brazil","countryCode":"BR","regionCode":"","kind":"country"},{"label":"Bahamas","countryCode":"BS","regionCode":"","kind":"country"},{"label":"Bhutan","countryCode":"BT","regionCode":"","kind":"country"},{"label":"Bouvet Island","countryCode":"BV","regionCode":"","kind":"country"},{"label":"Botswana","countryCode":"BW","regionCode":"","kind":"country"},{"label":"Belarus","countryCode":"BY","regionCode":"","kind":"country"},{"label":"Belize","countryCode":"BZ","regionCode":"","kind":"country"},{"label":"Canada","countryCode":"CA","regionCode":"","kind":"country"},{"label":"Cocos (Keeling) Islands","countryCode":"CC","regionCode":"","kind":"country"},{"label":"Congo, The Democratic Republic of the","countryCode":"CD","regionCode":"","kind":"country"},{"label":"Central African Republic","countryCode":"CF","regionCode":"","kind":"country"},{"label":"Congo","countryCode":"CG","regionCode":"","kind":"country"},{"label":"Switzerland","countryCode":"CH","regionCode":"","kind":"country"},{"label":"Côte d'Ivoire","countryCode":"CI","regionCode":"","kind":"country"},{"label":"Cook Islands","countryCode":"CK","regionCode":"","kind":"country"},{"label":"Chile","countryCode":"CL","regionCode":"","kind":"country"},{"label":"Cameroon","countryCode":"CM","regionCode":"","kind":"country"},{"label":"China","countryCode":"CN","regionCode":"","kind":"country"},{"label":"Colombia","countryCode":"CO","regionCode":"","kind":"country"},{"label":"Costa Rica","countryCode":"CR","regionCode":"","kind":"country"},{"label":"Cuba","countryCode":"CU","regionCode":"","kind":"country"},{"label":"Cabo Verde","countryCode":"CV","regionCode":"","kind":"country"},{"label":"Curaçao","countryCode":"CW","regionCode":"","kind":"country"},{"label":"Christmas Island","countryCode":"CX","regionCode":"","kind":"country"},{"label":"Cyprus","countryCode":"CY","regionCode":"","kind":"country"},{"label":"Czechia","countryCode":"CZ","regionCode":"","kind":"country"},{"label":"Germany","countryCode":"DE","regionCode":"","kind":"country"},{"label":"Djibouti","countryCode":"DJ","regionCode":"","kind":"country"},{"label":"Denmark","countryCode":"DK","regionCode":"","kind":"country"},{"label":"Dominica","countryCode":"DM","regionCode":"","kind":"country"},{"label":"Dominican Republic","countryCode":"DO","regionCode":"","kind":"country"},{"label":"Algeria","countryCode":"DZ","regionCode":"","kind":"country"},{"label":"Ecuador","countryCode":"EC","regionCode":"","kind":"country"},{"label":"Estonia","countryCode":"EE","regionCode":"","kind":"country"},{"label":"Egypt","countryCode":"EG","regionCode":"","kind":"country"},{"label":"Western Sahara","countryCode":"EH","regionCode":"","kind":"country"},{"label":"Eritrea","countryCode":"ER","regionCode":"","kind":"country"},{"label":"Spain","countryCode":"ES","regionCode":"","kind":"country"},{"label":"Ethiopia","countryCode":"ET","regionCode":"","kind":"country"},{"label":"Finland","countryCode":"FI","regionCode":"","kind":"country"},{"label":"Fiji","countryCode":"FJ","regionCode":"","kind":"country"},{"label":"Falkland Islands (Malvinas)","countryCode":"FK","regionCode":"","kind":"country"},{"label":"Micronesia, Federated States of","countryCode":"FM","regionCode":"","kind":"country"},{"label":"Faroe Islands","countryCode":"FO","regionCode":"","kind":"country"},{"label":"France","countryCode":"FR","regionCode":"","kind":"country"},{"label":"Gabon","countryCode":"GA","regionCode":"","kind":"country"},{"label":"United Kingdom","countryCode":"GB","regionCode":"","kind":"country"},{"label":"Grenada","countryCode":"GD","regionCode":"","kind":"country"},{"label":"Georgia","countryCode":"GE","regionCode":"","kind":"country"},{"label":"French Guiana","countryCode":"GF","regionCode":"","kind":"country"},{"label":"Guernsey","countryCode":"GG","regionCode":"","kind":"country"},{"label":"Ghana","countryCode":"GH","regionCode":"","kind":"country"},{"label":"Gibraltar","countryCode":"GI","regionCode":"","kind":"country"},{"label":"Greenland","countryCode":"GL","regionCode":"","kind":"country"},{"label":"Gambia","countryCode":"GM","regionCode":"","kind":"country"},{"label":"Guinea","countryCode":"GN","regionCode":"","kind":"country"},{"label":"Guadeloupe","countryCode":"GP","regionCode":"","kind":"country"},{"label":"Equatorial Guinea","countryCode":"GQ","regionCode":"","kind":"country"},{"label":"Greece","countryCode":"GR","regionCode":"","kind":"country"},{"label":"South Georgia and the South Sandwich Islands","countryCode":"GS","regionCode":"","kind":"country"},{"label":"Guatemala","countryCode":"GT","regionCode":"","kind":"country"},{"label":"Guam","countryCode":"GU","regionCode":"","kind":"country"},{"label":"Guinea-Bissau","countryCode":"GW","regionCode":"","kind":"country"},{"label":"Guyana","countryCode":"GY","regionCode":"","kind":"country"},{"label":"Hong Kong","countryCode":"HK","regionCode":"","kind":"country"},{"label":"Heard Island and McDonald Islands","countryCode":"HM","regionCode":"","kind":"country"},{"label":"Honduras","countryCode":"HN","regionCode":"","kind":"country"},{"label":"Croatia","countryCode":"HR","regionCode":"","kind":"country"},{"label":"Haiti","countryCode":"HT","regionCode":"","kind":"country"},{"label":"Hungary","countryCode":"HU","regionCode":"","kind":"country"},{"label":"Indonesia","countryCode":"ID","regionCode":"","kind":"country"},{"label":"Ireland","countryCode":"IE","regionCode":"","kind":"country"},{"label":"Israel","countryCode":"IL","regionCode":"","kind":"country"},{"label":"Isle of Man","countryCode":"IM","regionCode":"","kind":"country"},{"label":"India","countryCode":"IN","regionCode":"","kind":"country"},{"label":"British Indian Ocean Territory","countryCode":"IO","regionCode":"","kind":"country"},{"label":"Iraq","countryCode":"IQ","regionCode":"","kind":"country"},{"label":"Iran","countryCode":"IR","regionCode":"","kind":"country"},{"label":"Iceland","countryCode":"IS","regionCode":"","kind":"country"},{"label":"Italy","countryCode":"IT","regionCode":"","kind":"country"},{"label":"Jersey","countryCode":"JE","regionCode":"","kind":"country"},{"label":"Jamaica","countryCode":"JM","regionCode":"","kind":"country"},{"label":"Jordan","countryCode":"JO","regionCode":"","kind":"country"},{"label":"Japan","countryCode":"JP","regionCode":"","kind":"country"},{"label":"Kenya","countryCode":"KE","regionCode":"","kind":"country"},{"label":"Kyrgyzstan","countryCode":"KG","regionCode":"","kind":"country"},{"label":"Cambodia","countryCode":"KH","regionCode":"","kind":"country"},{"label":"Kiribati","countryCode":"KI","regionCode":"","kind":"country"},{"label":"Comoros","countryCode":"KM","regionCode":"","kind":"country"},{"label":"Saint Kitts and Nevis","countryCode":"KN","regionCode":"","kind":"country"},{"label":"North Korea","countryCode":"KP","regionCode":"","kind":"country"},{"label":"South Korea","countryCode":"KR","regionCode":"","kind":"country"},{"label":"Kuwait","countryCode":"KW","regionCode":"","kind":"country"},{"label":"Cayman Islands","countryCode":"KY","regionCode":"","kind":"country"},{"label":"Kazakhstan","countryCode":"KZ","regionCode":"","kind":"country"},{"label":"Lao People's Democratic Republic","countryCode":"LA","regionCode":"","kind":"country"},{"label":"Lebanon","countryCode":"LB","regionCode":"","kind":"country"},{"label":"Saint Lucia","countryCode":"LC","regionCode":"","kind":"country"},{"label":"Liechtenstein","countryCode":"LI","regionCode":"","kind":"country"},{"label":"Sri Lanka","countryCode":"LK","regionCode":"","kind":"country"},{"label":"Liberia","countryCode":"LR","regionCode":"","kind":"country"},{"label":"Lesotho","countryCode":"LS","regionCode":"","kind":"country"},{"label":"Lithuania","countryCode":"LT","regionCode":"","kind":"country"},{"label":"Luxembourg","countryCode":"LU","regionCode":"","kind":"country"},{"label":"Latvia","countryCode":"LV","regionCode":"","kind":"country"},{"label":"Libya","countryCode":"LY","regionCode":"","kind":"country"},{"label":"Morocco","countryCode":"MA","regionCode":"","kind":"country"},{"label":"Monaco","countryCode":"MC","regionCode":"","kind":"country"},{"label":"Moldova","countryCode":"MD","regionCode":"","kind":"country"},{"label":"Montenegro","countryCode":"ME","regionCode":"","kind":"country"},{"label":"Saint Martin (French part)","countryCode":"MF","regionCode":"","kind":"country"},{"label":"Madagascar","countryCode":"MG","regionCode":"","kind":"country"},{"label":"Marshall Islands","countryCode":"MH","regionCode":"","kind":"country"},{"label":"North Macedonia","countryCode":"MK","regionCode":"","kind":"country"},{"label":"Mali","countryCode":"ML","regionCode":"","kind":"country"},{"label":"Myanmar","countryCode":"MM","regionCode":"","kind":"country"},{"label":"Mongolia","countryCode":"MN","regionCode":"","kind":"country"},{"label":"Macao","countryCode":"MO","regionCode":"","kind":"country"},{"label":"Northern Mariana Islands","countryCode":"MP","regionCode":"","kind":"country"},{"label":"Martinique","countryCode":"MQ","regionCode":"","kind":"country"},{"label":"Mauritania","countryCode":"MR","regionCode":"","kind":"country"},{"label":"Montserrat","countryCode":"MS","regionCode":"","kind":"country"},{"label":"Malta","countryCode":"MT","regionCode":"","kind":"country"},{"label":"Mauritius","countryCode":"MU","regionCode":"","kind":"country"},{"label":"Maldives","countryCode":"MV","regionCode":"","kind":"country"},{"label":"Malawi","countryCode":"MW","regionCode":"","kind":"country"},{"label":"Mexico","countryCode":"MX","regionCode":"","kind":"country"},{"label":"Malaysia","countryCode":"MY","regionCode":"","kind":"country"},{"label":"Mozambique","countryCode":"MZ","regionCode":"","kind":"country"},{"label":"Namibia","countryCode":"NA","regionCode":"","kind":"country"},{"label":"New Caledonia","countryCode":"NC","regionCode":"","kind":"country"},{"label":"Niger","countryCode":"NE","regionCode":"","kind":"country"},{"label":"Norfolk Island","countryCode":"NF","regionCode":"","kind":"country"},{"label":"Nigeria","countryCode":"NG","regionCode":"","kind":"country"},{"label":"Nicaragua","countryCode":"NI","regionCode":"","kind":"country"},{"label":"Netherlands","countryCode":"NL","regionCode":"","kind":"country"},{"label":"Norway","countryCode":"NO","regionCode":"","kind":"country"},{"label":"Nepal","countryCode":"NP","regionCode":"","kind":"country"},{"label":"Nauru","countryCode":"NR","regionCode":"","kind":"country"},{"label":"Niue","countryCode":"NU","regionCode":"","kind":"country"},{"label":"New Zealand","countryCode":"NZ","regionCode":"","kind":"country"},{"label":"Oman","countryCode":"OM","regionCode":"","kind":"country"},{"label":"Panama","countryCode":"PA","regionCode":"","kind":"country"},{"label":"Peru","countryCode":"PE","regionCode":"","kind":"country"},{"label":"French Polynesia","countryCode":"PF","regionCode":"","kind":"country"},{"label":"Papua New Guinea","countryCode":"PG","regionCode":"","kind":"country"},{"label":"Philippines","countryCode":"PH","regionCode":"","kind":"country"},{"label":"Pakistan","countryCode":"PK","regionCode":"","kind":"country"},{"label":"Poland","countryCode":"PL","regionCode":"","kind":"country"},{"label":"Saint Pierre and Miquelon","countryCode":"PM","regionCode":"","kind":"country"},{"label":"Pitcairn","countryCode":"PN","regionCode":"","kind":"country"},{"label":"Puerto Rico","countryCode":"PR","regionCode":"","kind":"country"},{"label":"Palestine","countryCode":"PS","regionCode":"","kind":"country"},{"label":"Portugal","countryCode":"PT","regionCode":"","kind":"country"},{"label":"Palau","countryCode":"PW","regionCode":"","kind":"country"},{"label":"Paraguay","countryCode":"PY","regionCode":"","kind":"country"},{"label":"Qatar","countryCode":"QA","regionCode":"","kind":"country"},{"label":"Réunion","countryCode":"RE","regionCode":"","kind":"country"},{"label":"Romania","countryCode":"RO","regionCode":"","kind":"country"},{"label":"Serbia","countryCode":"RS","regionCode":"","kind":"country"},{"label":"Russia","countryCode":"RU","regionCode":"","kind":"country"},{"label":"Rwanda","countryCode":"RW","regionCode":"","kind":"country"},{"label":"Saudi Arabia","countryCode":"SA","regionCode":"","kind":"country"},{"label":"Solomon Islands","countryCode":"SB","regionCode":"","kind":"country"},{"label":"Seychelles","countryCode":"SC","regionCode":"","kind":"country"},{"label":"Sudan","countryCode":"SD","regionCode":"","kind":"country"},{"label":"Sweden","countryCode":"SE","regionCode":"","kind":"country"},{"label":"Singapore","countryCode":"SG","regionCode":"","kind":"country"},{"label":"Saint Helena, Ascension and Tristan da Cunha","countryCode":"SH","regionCode":"","kind":"country"},{"label":"Slovenia","countryCode":"SI","regionCode":"","kind":"country"},{"label":"Svalbard and Jan Mayen","countryCode":"SJ","regionCode":"","kind":"country"},{"label":"Slovakia","countryCode":"SK","regionCode":"","kind":"country"},{"label":"Sierra Leone","countryCode":"SL","regionCode":"","kind":"country"},{"label":"San Marino","countryCode":"SM","regionCode":"","kind":"country"},{"label":"Senegal","countryCode":"SN","regionCode":"","kind":"country"},{"label":"Somalia","countryCode":"SO","regionCode":"","kind":"country"},{"label":"Suriname","countryCode":"SR","regionCode":"","kind":"country"},{"label":"South Sudan","countryCode":"SS","regionCode":"","kind":"country"},{"label":"Sao Tome and Principe","countryCode":"ST","regionCode":"","kind":"country"},{"label":"El Salvador","countryCode":"SV","regionCode":"","kind":"country"},{"label":"Sint Maarten (Dutch part)","countryCode":"SX","regionCode":"","kind":"country"},{"label":"Syrian Arab Republic","countryCode":"SY","regionCode":"","kind":"country"},{"label":"Eswatini","countryCode":"SZ","regionCode":"","kind":"country"},{"label":"Turks and Caicos Islands","countryCode":"TC","regionCode":"","kind":"country"},{"label":"Chad","countryCode":"TD","regionCode":"","kind":"country"},{"label":"French Southern Territories","countryCode":"TF","regionCode":"","kind":"country"},{"label":"Togo","countryCode":"TG","regionCode":"","kind":"country"},{"label":"Thailand","countryCode":"TH","regionCode":"","kind":"country"},{"label":"Tajikistan","countryCode":"TJ","regionCode":"","kind":"country"},{"label":"Tokelau","countryCode":"TK","regionCode":"","kind":"country"},{"label":"Timor-Leste","countryCode":"TL","regionCode":"","kind":"country"},{"label":"Turkmenistan","countryCode":"TM","regionCode":"","kind":"country"},{"label":"Tunisia","countryCode":"TN","regionCode":"","kind":"country"},{"label":"Tonga","countryCode":"TO","regionCode":"","kind":"country"},{"label":"Türkiye","countryCode":"TR","regionCode":"","kind":"country"},{"label":"Trinidad and Tobago","countryCode":"TT","regionCode":"","kind":"country"},{"label":"Tuvalu","countryCode":"TV","regionCode":"","kind":"country"},{"label":"Taiwan","countryCode":"TW","regionCode":"","kind":"country"},{"label":"Tanzania","countryCode":"TZ","regionCode":"","kind":"country"},{"label":"Ukraine","countryCode":"UA","regionCode":"","kind":"country"},{"label":"Uganda","countryCode":"UG","regionCode":"","kind":"country"},{"label":"United States Minor Outlying Islands","countryCode":"UM","regionCode":"","kind":"country"},{"label":"United States","countryCode":"US","regionCode":"","kind":"country"},{"label":"Uruguay","countryCode":"UY","regionCode":"","kind":"country"},{"label":"Uzbekistan","countryCode":"UZ","regionCode":"","kind":"country"},{"label":"Holy See (Vatican City State)","countryCode":"VA","regionCode":"","kind":"country"},{"label":"Saint Vincent and the Grenadines","countryCode":"VC","regionCode":"","kind":"country"},{"label":"Venezuela","countryCode":"VE","regionCode":"","kind":"country"},{"label":"Virgin Islands, British","countryCode":"VG","regionCode":"","kind":"country"},{"label":"Virgin Islands, U.S.","countryCode":"VI","regionCode":"","kind":"country"},{"label":"Vietnam","countryCode":"VN","regionCode":"","kind":"country"},{"label":"Vanuatu","countryCode":"VU","regionCode":"","kind":"country"},{"label":"Wallis and Futuna","countryCode":"WF","regionCode":"","kind":"country"},{"label":"Samoa","countryCode":"WS","regionCode":"","kind":"country"},{"label":"Yemen","countryCode":"YE","regionCode":"","kind":"country"},{"label":"Mayotte","countryCode":"YT","regionCode":"","kind":"country"},{"label":"South Africa","countryCode":"ZA","regionCode":"","kind":"country"},{"label":"Zambia","countryCode":"ZM","regionCode":"","kind":"country"},{"label":"Zimbabwe","countryCode":"ZW","regionCode":"","kind":"country"},{"label":"Australian Capital Territory, Australia","countryCode":"AU","regionCode":"ACT","kind":"region"},{"label":"New South Wales, Australia","countryCode":"AU","regionCode":"NSW","kind":"region"},{"label":"Northern Territory, Australia","countryCode":"AU","regionCode":"NT","kind":"region"},{"label":"Queensland, Australia","countryCode":"AU","regionCode":"QLD","kind":"region"},{"label":"South Australia, Australia","countryCode":"AU","regionCode":"SA","kind":"region"},{"label":"Tasmania, Australia","countryCode":"AU","regionCode":"TAS","kind":"region"},{"label":"Victoria, Australia","countryCode":"AU","regionCode":"VIC","kind":"region"},{"label":"Western Australia, Australia","countryCode":"AU","regionCode":"WA","kind":"region"},{"label":"Alberta, Canada","countryCode":"CA","regionCode":"AB","kind":"region"},{"label":"British Columbia, Canada","countryCode":"CA","regionCode":"BC","kind":"region"},{"label":"Manitoba, Canada","countryCode":"CA","regionCode":"MB","kind":"region"},{"label":"New Brunswick, Canada","countryCode":"CA","regionCode":"NB","kind":"region"},{"label":"Newfoundland and Labrador, Canada","countryCode":"CA","regionCode":"NL","kind":"region"},{"label":"Northwest Territories, Canada","countryCode":"CA","regionCode":"NT","kind":"region"},{"label":"Nova Scotia, Canada","countryCode":"CA","regionCode":"NS","kind":"region"},{"label":"Nunavut, Canada","countryCode":"CA","regionCode":"NU","kind":"region"},{"label":"Ontario, Canada","countryCode":"CA","regionCode":"ON","kind":"region"},{"label":"Prince Edward Island, Canada","countryCode":"CA","regionCode":"PE","kind":"region"},{"label":"Quebec, Canada","countryCode":"CA","regionCode":"QC","kind":"region"},{"label":"Saskatchewan, Canada","countryCode":"CA","regionCode":"SK","kind":"region"},{"label":"Yukon, Canada","countryCode":"CA","regionCode":"YT","kind":"region"},{"label":"Alabama, United States","countryCode":"US","regionCode":"AL","kind":"region"},{"label":"Alaska, United States","countryCode":"US","regionCode":"AK","kind":"region"},{"label":"Arizona, United States","countryCode":"US","regionCode":"AZ","kind":"region"},{"label":"Arkansas, United States","countryCode":"US","regionCode":"AR","kind":"region"},{"label":"California, United States","countryCode":"US","regionCode":"CA","kind":"region"},{"label":"Colorado, United States","countryCode":"US","regionCode":"CO","kind":"region"},{"label":"Connecticut, United States","countryCode":"US","regionCode":"CT","kind":"region"},{"label":"Delaware, United States","countryCode":"US","regionCode":"DE","kind":"region"},{"label":"District of Columbia, United States","countryCode":"US","regionCode":"DC","kind":"region"},{"label":"Florida, United States","countryCode":"US","regionCode":"FL","kind":"region"},{"label":"Georgia, United States","countryCode":"US","regionCode":"GA","kind":"region"},{"label":"Hawaii, United States","countryCode":"US","regionCode":"HI","kind":"region"},{"label":"Idaho, United States","countryCode":"US","regionCode":"ID","kind":"region"},{"label":"Illinois, United States","countryCode":"US","regionCode":"IL","kind":"region"},{"label":"Indiana, United States","countryCode":"US","regionCode":"IN","kind":"region"},{"label":"Iowa, United States","countryCode":"US","regionCode":"IA","kind":"region"},{"label":"Kansas, United States","countryCode":"US","regionCode":"KS","kind":"region"},{"label":"Kentucky, United States","countryCode":"US","regionCode":"KY","kind":"region"},{"label":"Louisiana, United States","countryCode":"US","regionCode":"LA","kind":"region"},{"label":"Maine, United States","countryCode":"US","regionCode":"ME","kind":"region"},{"label":"Maryland, United States","countryCode":"US","regionCode":"MD","kind":"region"},{"label":"Massachusetts, United States","countryCode":"US","regionCode":"MA","kind":"region"},{"label":"Michigan, United States","countryCode":"US","regionCode":"MI","kind":"region"},{"label":"Minnesota, United States","countryCode":"US","regionCode":"MN","kind":"region"},{"label":"Mississippi, United States","countryCode":"US","regionCode":"MS","kind":"region"},{"label":"Missouri, United States","countryCode":"US","regionCode":"MO","kind":"region"},{"label":"Montana, United States","countryCode":"US","regionCode":"MT","kind":"region"},{"label":"Nebraska, United States","countryCode":"US","regionCode":"NE","kind":"region"},{"label":"Nevada, United States","countryCode":"US","regionCode":"NV","kind":"region"},{"label":"New Hampshire, United States","countryCode":"US","regionCode":"NH","kind":"region"},{"label":"New Jersey, United States","countryCode":"US","regionCode":"NJ","kind":"region"},{"label":"New Mexico, United States","countryCode":"US","regionCode":"NM","kind":"region"},{"label":"New York, United States","countryCode":"US","regionCode":"NY","kind":"region"},{"label":"North Carolina, United States","countryCode":"US","regionCode":"NC","kind":"region"},{"label":"North Dakota, United States","countryCode":"US","regionCode":"ND","kind":"region"},{"label":"Ohio, United States","countryCode":"US","regionCode":"OH","kind":"region"},{"label":"Oklahoma, United States","countryCode":"US","regionCode":"OK","kind":"region"},{"label":"Oregon, United States","countryCode":"US","regionCode":"OR","kind":"region"},{"label":"Pennsylvania, United States","countryCode":"US","regionCode":"PA","kind":"region"},{"label":"Rhode Island, United States","countryCode":"US","regionCode":"RI","kind":"region"},{"label":"South Carolina, United States","countryCode":"US","regionCode":"SC","kind":"region"},{"label":"South Dakota, United States","countryCode":"US","regionCode":"SD","kind":"region"},{"label":"Tennessee, United States","countryCode":"US","regionCode":"TN","kind":"region"},{"label":"Texas, United States","countryCode":"US","regionCode":"TX","kind":"region"},{"label":"Utah, United States","countryCode":"US","regionCode":"UT","kind":"region"},{"label":"Vermont, United States","countryCode":"US","regionCode":"VT","kind":"region"},{"label":"Virginia, United States","countryCode":"US","regionCode":"VA","kind":"region"},{"label":"Washington, United States","countryCode":"US","regionCode":"WA","kind":"region"},{"label":"West Virginia, United States","countryCode":"US","regionCode":"WV","kind":"region"},{"label":"Wisconsin, United States","countryCode":"US","regionCode":"WI","kind":"region"},{"label":"Wyoming, United States","countryCode":"US","regionCode":"WY","kind":"region"}];
 soPlaces.unshift({label:'Worldwide',countryCode:'',regionCode:'',kind:'worldwide'});
 var soAliases={'usa':'United States','us':'United States','united states of america':'United States','uk':'United Kingdom','great britain':'United Kingdom','global':'Worldwide','anywhere':'Worldwide'};
 function soSimplify(s){return String(s||'').toLowerCase().replace(/[,.]/g,' ').replace(/\s+/g,' ').trim();}
 function soEdit(a,b){if(Math.abs(a.length-b.length)>2)return 9;var row=[];for(var j=0;j<=b.length;j++)row[j]=j;for(var i=1;i<=a.length;i++){var next=[i];for(j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a.charAt(i-1)===b.charAt(j-1)?0:1));row=next;}return row[b.length];}
 function soMatches(q,entry){var label=soSimplify(entry.label);var query=soSimplify(q);if(!query)return 20;if(soAliases[query]===entry.label)return -1;if(label===query)return 0;if(label.indexOf(query)===0)return 1;if(label.indexOf(query)>0)return 3;var name=label.split(' ')[0];if(query.length>=4&&soEdit(query,name)<=2)return 5;return 100;}
 function soPlaceField(element, required){
   if(!element)return {get:function(){return null;}};
   var chosen=null, holder=document.createElement('div');holder.className='so-place-results';holder.hidden=true;
   holder.setAttribute('role','listbox');var baseId='so-places-'+(element.name||'location');holder.id=baseId;
   element.setAttribute('autocomplete','off');element.setAttribute('aria-autocomplete','list');element.setAttribute('aria-controls',baseId);
   element.insertAdjacentElement('afterend',holder);
   var help=document.createElement('small');help.className='so-place-help';help.textContent=required?'Select a suggested country or region; add a city below.':'Choose a country or state where applicants may live.';
   if(required)holder.insertAdjacentElement('afterend',help);else holder.insertAdjacentElement('afterend',help);
   function candidates(){var q=element.value.trim();if(!q)return [];
     return soPlaces.map(function(p){return {place:p,rank:soMatches(q,p)}}).filter(function(x){return x.rank<100;}).sort(function(a,b){return a.rank-b.rank||a.place.label.length-b.place.label.length;}).slice(0,7);
   }
   function hide(){holder.hidden=true;holder.textContent='';element.setAttribute('aria-expanded','false');}
   function choose(p){chosen={kind:p.kind,countryCode:p.countryCode,regionCode:p.regionCode};element.value=p.label;hide();element.dispatchEvent(new Event('change',{bubbles:true}));}
   function draw(){chosen=null;holder.textContent='';var list=candidates();if(!list.length){hide();return;}
     list.forEach(function(x){var btn=document.createElement('button');btn.type='button';btn.className='so-place-choice';btn.textContent=x.place.label;
       btn.setAttribute('role','option');btn.addEventListener('mousedown',function(e){e.preventDefault();});btn.addEventListener('click',function(e){e.preventDefault();choose(x.place);});holder.appendChild(btn);});
     holder.hidden=false;element.setAttribute('aria-expanded','true');
   }
   element.addEventListener('input',draw);element.addEventListener('focus',function(){if(element.value&& !chosen)draw();});
   element.addEventListener('blur',function(){setTimeout(hide,160);});
   element.addEventListener('keydown',function(e){if(e.key==='Escape'){hide();return;}if(e.key==='Enter'&&!holder.hidden){var first=holder.querySelector('button');if(first){e.preventDefault();first.click();}}});
   return {get:function(){
     var entered=soSimplify(element.value),alias=soAliases[entered];
     if(!entered)return null;
     for(var i=0;i<soPlaces.length;i++){
       var p=soPlaces[i];
       if((soSimplify(p.label)===entered)||(alias && p.label===alias)){
         return {kind:p.kind,countryCode:p.countryCode,regionCode:p.regionCode};
       }
     }
     return null;
   },clear:function(){chosen=null;hide();},pick:choose};
 }
 var soLocationInput=form.querySelector('input[name="location"]');
 var soLocationLabel=soLocationInput&&soLocationInput.closest('label');
 if(soLocationInput){soLocationInput.placeholder='Type Louisiana, Canada, Worldwide…';}
 var soLocationEntry=soPlaceField(soLocationInput,true);
 var soCityLabel=document.createElement('label');soCityLabel.className='so-location-city';soCityLabel.textContent='City (optional)';
 var soCity=document.createElement('input');soCity.type='text';soCity.name='locationCity';soCity.maxLength=70;soCity.placeholder='e.g. New Orleans';soCityLabel.appendChild(soCity);
 if(soLocationLabel&&soLocationLabel.parentNode){soLocationLabel.parentNode.insertAdjacentElement('afterend',soCityLabel);}
 var soEligibilityInput=form.querySelector('input[name="eligibility"]');var soEligibilityLabel=soEligibilityInput&&soEligibilityInput.closest('label');
 var soExtras=document.createElement('div');soExtras.className='so-eligibility-extras';
 var soEligibleLabel=document.createElement('label');soEligibleLabel.textContent='Eligible applicant region (optional)';
 var soEligible=document.createElement('input');soEligible.name='applicantLocation';soEligible.type='text';soEligible.maxLength=100;soEligible.placeholder='e.g. United States';soEligibleLabel.appendChild(soEligible);soExtras.appendChild(soEligibleLabel);
 function soChoice(label,name,items){var wrap=document.createElement('label');wrap.textContent=label;var select=document.createElement('select');select.name=name;
  items.forEach(function(x){var option=document.createElement('option');option.value=x[0];option.textContent=x[1];select.appendChild(option);});wrap.appendChild(select);soExtras.appendChild(wrap);return select;}
 soChoice('Work authorization','workAuthorization',[['unspecified','Not specified'],['required','Required'],['not_required','Not required']]);
 soChoice('Visa sponsorship','visaSponsorship',[['unspecified','Not specified'],['available','Available'],['unavailable','Not available']]);
 if(soEligibilityLabel)soEligibilityLabel.insertAdjacentElement('afterend',soExtras);
 var soApplicantEntry=soPlaceField(soEligible,false);
 var soDescriptionInput=form.querySelector('textarea[name="description"]');
 if(soDescriptionInput){
   soDescriptionInput.placeholder='Responsibilities, qualifications, experience, hours and other details';
   var soDescriptionLabel=soDescriptionInput.closest('label');
   if(soDescriptionLabel && soDescriptionLabel.firstChild && soDescriptionLabel.firstChild.nodeType===3){
     soDescriptionLabel.firstChild.nodeValue='Job description (recommended for search visibility)';
   }
 }

 soCity.addEventListener('input',function(){if(soLocationEntry.get()&&soLocationEntry.get().kind==='worldwide')soCity.value='';});

 var draftKey='studio-openings.drafts.v061',preview=window.STUDIO_OPENINGS_PREVIEW_MODE===true||location.protocol==='file:'||location.protocol==='about:';
 var turnstileScript;
 function message(s,error){var el=$('submission-error');el.textContent=s;el.className='submission-error'+(error?'':' submission-ok');el.hidden=!s;}
 function setMode(next){
   mode=next==='suggest'?'suggest':'employer';
   ['employer','suggest'].forEach(function(k){$('mode-'+k).classList.toggle('active',mode===k);$('mode-'+k).setAttribute('aria-pressed',String(mode===k));});
   if(mode==='suggest'){var radio=form.querySelector('input[name=applicationMethod][value=external]');if(radio)radio.checked=true;}
   updateApplicationMethod();
   featuredChoice.hidden=mode!=='employer';
   featuredInput.disabled=mode!=='employer';
   if(mode!=='employer')featuredInput.checked=false;
   syncFeaturedHighlight();
   $('submission-permission-text').textContent=mode==='employer'?'I represent the hiring organization, or have permission to submit this vacancy for review.':'This is a public vacancy and I have permission to suggest its original application link for review.';
 }
 function setSending(enabled){$('submission-send').disabled=!enabled;$('submission-send').textContent=(preview||!configuration?.enabled)?'Prepare offline request':'Send for review';}
 function loadTurnstile(){
   if(window.turnstile)return Promise.resolve(window.turnstile);
   if(turnstileScript)return turnstileScript;
   turnstileScript=new Promise(function(resolve,reject){
     var script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
     script.onload=function(){if(window.turnstile)resolve(window.turnstile);else reject(Error('Turnstile did not load'));};
     script.onerror=function(){reject(Error('Turnstile could not load. Check your connection.'));};
     document.head.appendChild(script);
   });return turnstileScript;
 }
 async function initializeConfig(){
   setSending(false);
   if(preview){$('submission-connection').textContent='Offline review — form data stays on your device. No request is sent.';setSending(true);return;}
   $('submission-connection').textContent='Checking secure submissions…';
   try {
     var response=await fetch('/api/submission-config',{credentials:'omit',cache:'no-store'});
     if(!response.ok)throw Error('Endpoint not available');
     configuration=await response.json();
     if(!configuration.enabled||!configuration.siteKey)throw Error('Cloudflare submission settings are not yet active.');
     if(!configuration.nativeApplyEnabled){var nativeChoice=form.querySelector('input[name=applicationMethod][value=native]');if(nativeChoice)nativeChoice.disabled=true;var externalChoice=form.querySelector('input[name=applicationMethod][value=external]');if(externalChoice)externalChoice.checked=true;updateApplicationMethod();}
     await loadTurnstile();
     token='';
     if(widgetId!==null){window.turnstile.remove(widgetId);widgetId=null;}
     widgetId=window.turnstile.render('#turnstile-container',{
       sitekey:configuration.siteKey,action:'submit_job',theme:'light',appearance:'interaction-only',
       callback:function(t){token=t;message('');},'expired-callback':function(){token='';},
       'error-callback':function(){token='';message('Verification could not complete. Try again.',true);}
     });
     $('submission-connection').textContent='Secure submission is available. Verification is required before sending.';
     setSending(true);
   }catch(e){configuration=null;$('submission-connection').textContent='Online submissions are not ready: '+(e.message||'configuration unavailable')+'. You can download a request instead.';setSending(true);}
 }
 function open(){
   if(!panel.hidden)return;
   if(!$('job-drawer').hidden)$('drawer-close').click();
   lastFocus=document.activeElement;
   panel.hidden=false;backdrop.hidden=false;document.body.classList.add('submission-open');
   form.hidden=false;$('submission-result').hidden=true;resetValidation();message('');$('submission-close').focus();
   initializeConfig();
 }
 function close(){
   panel.hidden=true;backdrop.hidden=true;document.body.classList.remove('submission-open');
   if(lastFocus&&document.contains(lastFocus))lastFocus.focus();
 }
 function urlHttps(v){
   try{var u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.includes('.')&&!/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.)/.test(u.hostname)?u.href:'';}
   catch{return '';}
 }
 function updateApplicationMethod(){
   var selected=form.querySelector('input[name=applicationMethod]:checked');
   var method=mode==='suggest'?'external':(selected?selected.value:'native');
   if(mode==='suggest')form.querySelectorAll('input[name=applicationMethod]').forEach(function(el){el.disabled=true;});
   else form.querySelectorAll('input[name=applicationMethod]').forEach(function(el){el.disabled=(el.value==='native'&&!preview&&configuration&&configuration.nativeApplyEnabled===false);});
   $('method-native').hidden=method!=='native';
   $('method-email').hidden=method!=='email';
   $('method-external').hidden=method!=='external';
   return method;
 }
 function collect(){
   var f=new FormData(form),v=function(k){return String(f.get(k)||'').trim();};
   return {schema:'studio-openings-submission-v1',kind:mode,applicationMethod:updateApplicationMethod(),applicationEmail:v('applicationEmail'),title:v('title'),company:v('company'),location:v('location'),locationReference:soLocationEntry.get(),locationCity:v('locationCity'),applicantLocation:v('applicantLocation'),applicantLocationReference:soApplicantEntry.get(),workAuthorization:v('workAuthorization'),visaSponsorship:v('visaSponsorship'),mode:v('mode'),type:v('type'),role:v('role'),url:urlHttps(v('url')),companyWebsite:v('companyWebsite')?urlHttps(v('companyWebsite')):'',contactEmail:v('contactEmail'),salary:v('salary'),closesOn:v('closesOn'),eligibility:v('eligibility'),description:v('description'),permissionChecked:f.get('permission')==='on',featuredInterest:mode==='employer'&&f.get('featuredInterest')==='yes'};
 }
 // Inline, accessible validation. The form uses novalidate intentionally so we can
 // show every issue at once and focus the first affected field.
 var validationAttempted=false;
 function inputFor(name){return form.elements.namedItem(name);}
 function emailValid(value){return /^[^\s@]+@[^\s@]+\.[a-z]{2,24}$/i.test(value||'');}
 function fieldErrors(data){
   var issues=[];
   function add(name,text){issues.push({name:name,text:text});}
   if(data.title.length<3)add('title',data.title?'Enter at least 3 characters.':'Job title is required.');
   if(data.company.length<2)add('company',data.company?'Enter at least 2 characters.':'Company / studio is required.');
   if(!data.location)add('location','Choose a country, state or Worldwide.');
   else if(!data.locationReference)add('location','Select a standardized location from the suggestions.');
   if(data.applicantLocation&&!data.applicantLocationReference)add('applicantLocation','Select a standardized eligible region from the suggestions.');
   if(!data.mode)add('mode','Select a work arrangement.');
   if(!data.role)add('role','Select a discipline.');
   if(data.applicationMethod==='external'&&!data.url)add('url','Enter a valid HTTPS application link (https://…).');
   if(data.applicationMethod==='email'&&!emailValid(data.applicationEmail))add('applicationEmail','Enter a valid application email address.');
   if(!emailValid(data.contactEmail))add('contactEmail',data.contactEmail?'Enter a valid contact email address.':'Contact email is required.');
   var site=inputFor('companyWebsite');
   if(site&&site.value.trim()&&!urlHttps(site.value.trim()))add('companyWebsite','Enter a valid HTTPS website address, or leave this blank.');
   var closes=inputFor('closesOn');
   if(closes&&closes.value&&closes.value<new Date().toISOString().slice(0,10))add('closesOn','The closing date cannot be in the past.');
   if(!data.permissionChecked)add('permission','Please confirm that you have permission to submit this vacancy.');
   return issues;
 }
 function clearFieldErrors(){
   form.querySelectorAll('[aria-invalid="true"]').forEach(function(el){
     el.removeAttribute('aria-invalid');
     var previous=el.getAttribute('data-so-original-describedby');
     if(previous){el.setAttribute('aria-describedby',previous);}else{el.removeAttribute('aria-describedby');}
     el.removeAttribute('data-so-original-describedby');
   });
   form.querySelectorAll('.so-invalid-field').forEach(function(el){el.classList.remove('so-invalid-field');});
   form.querySelectorAll('.so-field-error').forEach(function(el){el.remove();});
 }
 function showFieldError(issue){
   var input=inputFor(issue.name);
   if(!input)return;
   var outer=issue.name==='permission'?form.querySelector('.submission-consent'):input.closest('label');
   if(!outer)return;
   outer.classList.add('so-invalid-field');
   input.setAttribute('aria-invalid','true');
   var id='so-error-'+issue.name;
   input.setAttribute('data-so-original-describedby',input.getAttribute('aria-describedby')||'');
   input.setAttribute('aria-describedby',((input.getAttribute('data-so-original-describedby')||'')+' '+id).trim());
   var note=document.createElement('span');note.className='so-field-error';note.id=id;
   note.textContent=issue.text;
   outer.appendChild(note);
 }
 function showValidation(data,focusFirst){
   var issues=fieldErrors(data);
   clearFieldErrors();
   issues.forEach(showFieldError);
   if(issues.length){
     message('Please correct the '+issues.length+' highlighted field'+(issues.length===1?'':'s')+' before sending.',true);
     if(focusFirst){
       var first=inputFor(issues[0].name);
       if(first){
         try{first.scrollIntoView({block:'center',behavior:'smooth'});}catch(e){first.scrollIntoView();}
         try{first.focus({preventScroll:true});}catch(e){first.focus();}
       }
     }
     return false;
   }
   message('');return true;
 }
 function resetValidation(){validationAttempted=false;clearFieldErrors();}
 function liveValidation(){if(validationAttempted)showValidation(collect(),false);}
 form.addEventListener('input',liveValidation);
 form.addEventListener('change',liveValidation);
 function download(data){
   if(!data)return;
   var copy=Object.assign({},data);delete copy.turnstileToken;
   var url=URL.createObjectURL(new Blob([JSON.stringify(copy,null,2)+'\n'],{type:'application/json'}));
   var a=document.createElement('a');a.href=url;a.download='studio-openings-submission.json';document.body.appendChild(a);a.click();a.remove();
   setTimeout(function(){URL.revokeObjectURL(url);},1200);
 }
 function localSave(record){
   try{var arr=JSON.parse(localStorage.getItem(draftKey)||'[]');if(!Array.isArray(arr))arr=[];arr.push(record);localStorage.setItem(draftKey,JSON.stringify(arr.slice(-10)));return true;}
   catch{return false;}
 }
 function result(heading,description,offline,reference){
   $('submission-result').hidden=false;form.hidden=true;
   $('submission-result-heading').textContent=heading;
   $('submission-result-copy').textContent=description;
   $('submission-result-reference').textContent=reference?'Reference '+reference:'';
   $('submission-download').hidden=!offline;
 }
 async function send(e){
   e.preventDefault();
   var data=collect();validationAttempted=true;if(!showValidation(data,true))return;
   lastPrepared=data;
   if(preview||!configuration?.enabled){
     localSave(data);
     result('Offline request prepared — not sent','This is a local review. Download the request JSON; your information has not reached Studio Openings.',true,'');
     return;
   }
   if(!token){message('Complete the Turnstile verification before sending.',true);return;}
   $('submission-send').disabled=true;$('submission-send').textContent='Sending…';message('');
   try {
     var response=await fetch('/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',body:JSON.stringify(Object.assign({},data,{turnstileToken:token}))});
     var payload=await response.json();
     if(!response.ok||!payload.ok)throw Error(payload.message||'Submission failed');
     result('Submitted for review',data.featuredInterest?'Your listing was received for editorial review. Your featured-placement request was recorded. This is not a payment or a promise of promotion.':'Your listing was received. It is pending manual approval and is not public yet.',false,payload.reference);
   }catch(err){
     message((err.message||'Could not submit')+' — nothing was published. You can retry or save a local draft.',true);
     if(widgetId!==null&&window.turnstile){window.turnstile.reset(widgetId);token='';}
   }finally{setSending(true);}
 }
 function newSubmission(){soLocationEntry.clear();soApplicantEntry.clear();form.reset();form.hidden=false;lastPrepared=null;token='';$('submission-result').hidden=true;setMode('employer');resetValidation();message('');if(widgetId!==null&&window.turnstile)window.turnstile.reset(widgetId);}
 $('nav-submit').addEventListener('click',function(e){e.preventDefault();open();});
 $('mode-employer').addEventListener('click',function(){setMode('employer');});
 $('mode-suggest').addEventListener('click',function(){setMode('suggest');});
 form.querySelectorAll('input[name=applicationMethod]').forEach(function(r){r.addEventListener('change',updateApplicationMethod);});
 updateApplicationMethod();
 setMode('employer');
 $('submission-close').addEventListener('click',close);
 backdrop.addEventListener('click',close);
 form.addEventListener('submit',send);
 $('submission-save').addEventListener('click',function(){
   var data=collect(),ok=localSave(data);
   message(ok?'Draft saved in this browser only. Not submitted.':'Browser storage is unavailable. Use Prepare offline request instead.',!ok);
 });
 $('submission-download').addEventListener('click',function(){download(lastPrepared);});
 $('submission-new').addEventListener('click',newSubmission);
 document.addEventListener('keydown',function(e){
   if(panel.hidden)return;
   if(e.key==='Escape'){e.preventDefault();close();return;}
   if(e.key==='Tab'){
     var items=Array.from(panel.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])')).filter(function(el){return el.getClientRects().length>0;});
     if(!items.length)return;
     if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items[items.length-1].focus();}
     if(!e.shiftKey&&document.activeElement===items[items.length-1]){e.preventDefault();items[0].focus();}
   }
 });
 if(location.hash==='#submit')open();
})();
