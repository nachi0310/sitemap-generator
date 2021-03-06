const { join } = require('path');
const { SitemapStream, streamToPromise } = require('sitemap');
const puppeteer = require('puppeteer');
const fs = require('fs');
const format = require('xml-formatter');
const { Readable } = require( 'stream' )
const link = process.argv[2];
if(!link) {
  console.log("please provide a valid link")
}
if(link) {
 try {
  (async () => { 
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 })
    await page.goto(link);
    const pageContent = await page.content();
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.evaluate(() => history.pushState(null, null, null)),
    ]);
    const result = await page.evaluateHandle(() => {
      const hrefLink = []
      document.querySelectorAll('a').forEach(selector => {
        if(selector.hasAttribute("href")) {
          hrefLink.push(selector)
        }
      })
      let urlString = "";
      hrefLink.forEach(href => {  
        urlString = urlString + " " + href.getAttribute("href");
      })
      return urlString;
    })
    let modifiedResult = "";
    result.toString().split(" ").forEach(resultLink => {
      if(resultLink !== "undefined") {  
        modifiedResult = modifiedResult + " " + resultLink;
      }  
    })
    let resultList = modifiedResult.toString().split(" ");
    resultList = resultList.slice(2);
    const updatedList = [];
    resultList.forEach(result => {
      if((result.indexOf('http') > -1 || result.indexOf("https") > -1)&& result !== "/") {
        updatedList.push(result);
      } else if(result !== '/') {
        updatedList.push(link + result);
      } 
    })
    const streamLinks = [];
      updatedList.forEach(result => {
      const newStream = {
        url: result,
        changeFreq: 'daily',
        priority: 0.8
      }
      streamLinks.push(newStream)
    })
    const stream = new SitemapStream({ hostname: link })
    streamToPromise(Readable.from(streamLinks).pipe(stream)).then((data) => {
      fs.appendFile('sitemap.xml', format(data.toString()), (err) => {
        if (err) throw err;
          // file saved
          console.log('xml saved!');
        });
      })
    })();
  } catch (e) {
    console.error(e);
  }
} 