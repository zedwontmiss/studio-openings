const assert=require('assert'),match=require('../assets/studio-unified-search.js');const offices='US|California|Los Angeles;GB|England|London';assert(match('Framestore',offices,'united states'));assert(match('Framestore',offices,'calif'));assert(match('Framestore',offices,'London'));assert(match('Framestore',offices,'US, California, Los'));assert(match('Framestore',offices,'California, Los Angeles'));assert(!match('Framestore',offices,'US, England'));assert(!match('Framestore',offices,'London, California'));assert(match('Framestore',offices,'frame'));assert(match('Further DesignStudio','GB|England|London','designstudio'));assert(match('Framestore',offices,''));assert(match('Framestore',offices,'UK'));
const locationMatch=require('../assets/studio-unified-search.js');for(const [key,query] of [['JP|Tokyo|Tokyo','Japan'],['KR|Seoul|Seoul','South Korea'],['NL|South Holland|Rotterdam','Netherlands'],['SG|Singapore|Singapore','Singapore'],['FR|Île-de-France|Paris','France'],['DE|Berlin|Berlin','Germany']])require('node:assert').strictEqual(locationMatch('Fixture',key,query),true,query);

// Exercise the real Category initialization and click handlers without a browser.
{
  const {readFileSync} = require('node:fs');
  const {runInNewContext} = require('node:vm');
  const buttons = [];
  const select = {
    value: '',
    options: [{value: '', textContent: 'All disciplines'}, {value: 'product', textContent: 'Product / UX / UI'}],
    get selectedIndex() { return this.options.findIndex(option => option.value === this.value); },
  };
  const details = {open: false};
  const current = {};
  const controls = {
    'studio-discipline': select,
    'studio-category': details,
    'studio-category-options': {
      querySelectorAll: () => buttons,
      appendChild: button => buttons.push(button),
    },
    'studio-category-current': current,
    'studio-category-fallback': {},
  };
  let refreshed = 0;
  const window = {
    document: {
      getElementById: id => controls[id],
      createElement() {
        const attributes = new Map();
        return {
          setAttribute: (name, value) => attributes.set(name, value),
          getAttribute: name => attributes.get(name),
          addEventListener(event, handler) { this[event] = handler; },
        };
      },
    },
    SOAPPGlobalSearch: {refresh() { refreshed++; }},
  };
  runInNewContext(readFileSync(require.resolve('../assets/studio-unified-search.js'), 'utf8'), {window});

  assert.equal(details.open, false, 'Category starts collapsed');
  details.open = true;
  buttons[1].click();
  assert.equal(details.open, true, 'Selecting a category keeps the panel open');
  assert.equal(select.value, 'product');
  assert.equal(current.textContent, ' / Product / UX / UI');
  assert.deepEqual(buttons.map(button => button.getAttribute('aria-pressed')), ['false', 'true']);

  buttons[0].click();
  assert.equal(details.open, true, 'Selecting All keeps the panel open');
  assert.equal(select.value, '');
  assert.equal(current.textContent, '');
  assert.deepEqual(buttons.map(button => button.getAttribute('aria-pressed')), ['true', 'false']);
  assert.equal(refreshed, 3, 'Refresh the results on initialization and each selection');
}
