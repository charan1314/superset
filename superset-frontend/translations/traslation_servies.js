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
  const selectedDegreeScenarios = queryParams.get('degreeScenarios');
  const selectedTargetYear = queryParams.get('targetYear');

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
    '{{sf_m2_unit}}': queryParams.get('units') === 'me' ? 'm2' : 'SF',
    '{{kbtu_kwh_unit}}': queryParams.get('units') === 'me' ? 'kWh/m2' : 'kBtu/SF',
    '{{MBtu_Mwh_unit}}': queryParams.get('units') === 'me' ? 'MWh' : 'MBtu',
    '{{MtCo2e_unit}}': 'MtCO2e',
    '{{SF_M2_header_unit}}': queryParams.get('units') === 'me' ? 'Square Meter' : 'Square',
    '{{SquareFeet_M2_header_unit}}': queryParams.get('units') === 'me' ? 'Square Meter' : 'Square Feet',
    '{{first_degree_scenarios_intensity}}': "null",
    '{{second_degree_scenarios_intensity}}': "null",
    '{{third_degree_scenarios_intensity}}': "null",
    '{{first_target_year_intensity}}': "null",
    '{{second_target_year_intensity}}': "null",
    '{{third_target_year_intensity}}': "null",
  };

  if (selectedDegreeScenarios !== null) {
    const selectedScenarios = selectedDegreeScenarios.split(',');
    placeholders['{{first_degree_scenarios_intensity}}'] = selectedScenarios[0];
    placeholders['{{second_degree_scenarios_intensity}}'] = selectedScenarios[1];
    placeholders['{{third_degree_scenarios_intensity}}'] = selectedScenarios[2];
  }

  if (selectedTargetYear !== null) {
    const selectedYear = selectedTargetYear.split(',');
    placeholders['{{first_target_year_intensity}}'] = selectedYear[0];
    placeholders['{{second_target_year_intensity}}'] = selectedYear[1];
    placeholders['{{third_target_year_intensity}}'] = selectedYear[2];
  }
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
