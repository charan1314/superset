export function translations(name) {
  // eslint-disable-next-line global-require,import/extensions
  const englishDictionary = require('./englishDictionary.json');
  // eslint-disable-next-line global-require,import/extensions
  const metricDictionary = require('./englishMeDictionary.json');
  // eslint-disable-next-line global-require,import/extensions
  const frenchDictionary = require('./frenchDictionary.json');
  // eslint-disable-next-line react-hooks/rules-of-hooks

  const queryParams = new URLSearchParams(window.location.href);
  const paramsss = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  const lang = paramsss.lang ? paramsss.lang : 'en';
  let selectedTranslation = null;
  switch (lang) {
    case 'en':
      selectedTranslation = englishDictionary;
      break;
    case 'me':
      selectedTranslation = metricDictionary;
      break;
    case 'fr':
      selectedTranslation = frenchDictionary;
      break;
    default:
      break;
  }
  const placeholders = {
    '{{unit}}': queryParams.get('units'),
    '{{currencySymbol}}': queryParams.get('symbol'),
    '{{projectOne}}': queryParams.get('projectOne'),
    '{{projectTwo}}': queryParams.get('projectTwo'),
    '{{projectThree}}': queryParams.get('projectThree'),
    'custom_filter_1': queryParams.get('filter1'),
    'custom_filter_2': queryParams.get('filter2'),
    'custom_filter_3': queryParams.get('filter3'),
    'custom_filter_4': queryParams.get('filter4'),
    'custom_filter_5': queryParams.get('filter5'),
    '{{sf_m2_unit}}': queryParams.get('units') === 'm2' ? 'SF' : 'M2',
    '{{kbtu_kwh_unit}}': queryParams.get('units') === 'm2' ? 'kWh/m2' : 'kBtu/SF',
    '{{MBtu_Mwh_unit}}': queryParams.get('units') === 'm2' ? 'kWh/m2' : 'kBtu/SF',
    '{{MtCo2e_unit}}': 'MtCo2e',
    '{{SF_M2_header_unit}}': queryParams.get('units') === 'm2' ? 'M2' : 'Square',
  };

  let displayName = name;
  // eslint-disable-next-line no-param-reassign
  if (name !== undefined && name !== null && typeof name === 'string') {
    // eslint-disable-next-line no-restricted-syntax
    for (const placeholder in placeholders) {
      displayName = displayName.replace(placeholder, placeholders[placeholder]);
    }
    const stringArray = displayName.split('{{');
    let substringArray;
    let replaceString;
    let replacedString;
    if (stringArray.length > 0) {
      // eslint-disable-next-line no-plusplus
      for (let o = 1; o < stringArray.length; o++) {
        substringArray = stringArray[o].split('}}');
        replaceString = `{{${substringArray[0]}}}`;
        replacedString = selectedTranslation[substringArray[0]];
        displayName = displayName.replace(replaceString, replacedString);
      }
    }
  }
  return displayName;
}
