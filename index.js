const puppeteer = require('puppeteer');
const { getPHash } = require('./phash');
const urls = require('./urls.json').urls;
const { Client, createAccount, argString } = require('orbs-client-sdk');

const { publicKey } = createAccount();
const orbsClient = new Client('https://validator.orbs-test.com/vchains/6666', 6666, 'TEST_NET');

const getImagesFromPage = async (browser, url) => {
  const page = await browser.newPage();
  await page.goto(url);
  await page.waitFor(2 * 1000);
  await page.evaluate(() => window.scrollBy(0, 1000));
  await page.waitFor(2 * 1000);
  await page.evaluate(() => window.scrollBy(0, 1000));
  await page.waitFor(2 * 1000);
  await page.evaluate(() => window.scrollBy(0, 1000));
  await page.waitFor(5 * 1000);
  const imageSources = await page.evaluate(() =>
    Array
      .from(document.querySelectorAll('img'), (node) => node.src)
      .filter(url => url.startsWith('http'))
      .filter(url => url.indexOf('.png') > -1 || url.indexOf('.jpg') > -1)
      .map(url => url.indexOf('?') > -1 ? url.substring(0, url.indexOf('?')) : url)
  );
  return imageSources;
};

const verifyImage = async (hash) => {
  const query = orbsClient.createQuery(
    publicKey,
    'registry',
    'verify',
    [argString(hash)]
  );
  const { executionResult } = await orbsClient.sendQuery(query);
  return executionResult === 'SUCCESS';
};

puppeteer.launch().then(async browser => {
  const sources = await Promise.all(urls.map((url) => getImagesFromPage(browser, url)));
  await browser.close();

  const hashes = await Promise.all(sources[0].map(getPHash));
  const verified = await Promise.all(hashes.map(verifyImage));
  const res = {
    [urls[0]]: verified.reduce((acc, curr, idx) => {
      acc[sources[0][idx]] = curr;
      return acc;
    }, {})
  };
  console.log(res);
});
