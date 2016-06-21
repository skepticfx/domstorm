/**
 * TestRunner.js
 *
 * injectIframe(dataArray, userScript, iframeInjected);
 *
 * 1. Spawn TESTRUNNER_MAXIMUM_IFRAMES number of IFrames.
 * 2. For each data, 'i' document.write the data with the userScript to the new IFrame.
 * 3. If no IFrame is available, we need to setTimeout wait until one is available.
 * 4. Once an IFrame has done its job, return the test results and call a certain callback - testDone(iframeID).
 * 5. This makes the iframe with the iframeID as free and now the new tests can be done using these freed IFrames.
 * 6.
 *
 */


/*


 var TESTRUNNER_MAXIMUM_TASKS = 30;
 var ua = detect.parse(navigator.userAgent);

 var userScript = document.getElementById('user_script').textContent;
 var currentTasks = 0;
 var totalTests = 0;
 var testCounter = 0;

 function injectScript(iframe, inject) {
 var script = iframe.contentWindow.document.createElement('script');
 script.type = 'text/javascript';
 script.innerHTML = inject;
 iframe.contentWindow.document.body.appendChild(script);
 }

 function injectIframe(list, src, callback) {
 if (list.length === 0) {
 endTest();
 return;
 }
 if (currentTasks <= TESTRUNNER_MAXIMUM_TASKS) {
 console.log(currentTasks);
 var data = list.shift();
 document.getElementById('enum_status').textContent = data.toString() + ' -- (' + testCounter++ + '/' + totalTests + ' )';
 currentTasks++;
 injectIframe(list, src, callback);
 var iframe = document.createElement('iframe');
 iframe.sandbox = "allow-forms allow-modals allow-same-origin allow-scripts allow-top-navigation";

 iframe.src = '';
 document.body.appendChild(iframe);
 iframe.onload = function() {
 console.log('onload');
 injectScript(this, src);
 iframe.contentWindow.callTest.call(undefined, data, function() {
 callback(iframe);
 currentTasks--;
 injectIframe(list, src, callback);
 });
 };
 } else {
 console.log('not 10: ' + currentTasks);
 setTimeout(function() {
 injectIframe(list, src, callback);
 }, 100);
 }
 }

 function iframeInjected(iframeNode) {
 console.log(iframeNode);
 document.body.removeChild(iframeNode);
 }

 function runTests(dataArray) {
 totalTests = dataArray.length;
 if (dataArray.length === 0) {
 addResult(['No Data enumerated. The Data Array was empty.'], 'INFO');
 endTest();
 return;
 }
 injectIframe(dataArray, userScript, iframeInjected);
 }

 */