export function translations(name) {
  // eslint-disable-next-line global-require,import/extensions
  const englishDictionary = require('./englishDictionary.json');
  // eslint-disable-next-line global-require,import/extensions
  const metricDictionary = require('./englishMeDictionary.json');
  // eslint-disable-next-line global-require,import/extensions
  const frenchDictionary = require('./frenchDictionary.json');
  // eslint-disable-next-line react-hooks/rules-of-hooks

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
  // eslint-disable-next-line no-param-reassign
  if (name !== undefined && name !== null && typeof name === 'string') {
    const stringArray = name.split('{{');
    let substringArray;
    let replaceString;
    let replacedString;
    if (stringArray.length > 0) {
      // eslint-disable-next-line no-plusplus
      for (let o = 1; o < stringArray.length; o++) {
        substringArray = stringArray[o].trim().split('}}');
        replaceString = `{{${substringArray[0]}}}`;
        replacedString = selectedTranslation[substringArray[0]];
        // eslint-disable-next-line no-param-reassign
        name = name.replace(replaceString, replacedString);
      }
    }
  }
  return name;
}
