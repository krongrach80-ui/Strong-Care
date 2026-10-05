const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const targetViewports = [
  { name: 'mobile_320x568', width: 320, height: 568, mobile: true },
  { name: 'mobile_375x667', width: 375, height: 667, mobile: true },
  { name: 'mobile_390x844', width: 390, height: 844, mobile: true },
  { name: 'mobile_414x896', width: 414, height: 896, mobile: true },
  { name: 'tablet_768x1024', width: 768, height: 1024, mobile: true },
  { name: 'tablet_1024x768', width: 1024, height: 768, mobile: false },
  { name: 'laptop_1280x720', width: 1280, height: 720, mobile: false },
  { name: 'laptop_1366x768', width: 1366, height: 768, mobile: false },
  { name: 'desktop_1440x900', width: 1440, height: 900, mobile: false },
  { name: 'desktop_1920x1080', width: 1920, height: 1080, mobile: false },
  { name: 'desktop_2560x1440', width: 2560, height: 1440, mobile: false },
  { name: 'ultrawide_3840x2160', width: 3840, height: 2160, mobile: false },
];

const outputDir = path.resolve(__dirname, '../../../../brain/9cd15725-4ea0-47a0-96d3-3f56be412ab8/screenshots');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function run() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--ignore-certificate-errors',
    '--window-size=1920,1080',
    'https://127.0.0.1:4173/'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const res = await fetch('http://127.0.0.1:9222/json');
    const tabs = await res.json();
    const targetTab = tabs.find(t => t.url.includes('4173')) || tabs[0];
    const ws = new WebSocket(targetTab.webSocketDebuggerUrl);

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let msgId = 1;
    function sendCommand(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === id) {
            ws.removeEventListener('message', handler);
            resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    // Enable Page
    await sendCommand('Page.enable');

    const results = [];

    for (const vp of targetViewports) {
      // 1. Set emulation metrics
      await sendCommand('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.mobile
      });

      await new Promise(r => setTimeout(r, 600));

      // 2. Check for overflow
      const overflowCheck = await sendCommand('Runtime.evaluate', {
        expression: `
          (() => {
            const w = window.innerWidth;
            const overflowing = [];
            document.querySelectorAll('*').forEach(el => {
              const r = el.getBoundingClientRect();
              if (r.right > w + 1 || el.scrollWidth > w + 1) {
                overflowing.push({
                  tag: el.tagName,
                  cls: (el.className || '').toString().slice(0, 50),
                  rectRight: Math.round(r.right),
                  scrollWidth: el.scrollWidth,
                  text: (el.innerText || '').slice(0, 30).replace(/\\s+/g, ' ')
                });
              }
            });
            return {
              viewport: { width: w, height: window.innerHeight },
              scrollWidth: document.documentElement.scrollWidth,
              clientWidth: document.documentElement.clientWidth,
              hasHorizontalOverflow: document.documentElement.scrollWidth > w,
              overflowingCount: overflowing.length,
              sampleOverflows: overflowing.slice(0, 3)
            };
          })()
        `,
        returnByValue: true
      });

      const report = overflowCheck.result.value;

      // 3. Take screenshot for key viewports
      if (['mobile_320x568', 'mobile_390x844', 'tablet_768x1024', 'laptop_1280x720', 'laptop_1366x768', 'desktop_1920x1080'].includes(vp.name)) {
        const screenshotResult = await sendCommand('Page.captureScreenshot', {
          format: 'png'
        });
        if (screenshotResult && screenshotResult.data) {
          const filePath = path.join(outputDir, `${vp.name}.png`);
          fs.writeFileSync(filePath, Buffer.from(screenshotResult.data, 'base64'));
        }
      }

      results.push({
        viewport: `${vp.width}x${vp.height}`,
        name: vp.name,
        hasHorizontalOverflow: report.hasHorizontalOverflow,
        scrollWidth: report.scrollWidth,
        clientWidth: report.clientWidth,
        overflowingCount: report.overflowingCount,
        sampleOverflows: report.sampleOverflows
      });
    }

    // Now test training page on mobile and desktop
    // Navigate to training
    await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('เริ่มกายภาพทันที'));
          if (btn) btn.click();
        })()
      `
    });

    await new Promise(r => setTimeout(r, 1000));

    // Capture training at 1366x768
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 600));
    const trainDesk = await sendCommand('Page.captureScreenshot', { format: 'png' });
    if (trainDesk && trainDesk.data) {
      fs.writeFileSync(path.join(outputDir, 'training_desktop_1366x768.png'), Buffer.from(trainDesk.data, 'base64'));
    }

    // Capture training at 390x844 (Mobile)
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 600));
    const trainMob = await sendCommand('Page.captureScreenshot', { format: 'png' });
    if (trainMob && trainMob.data) {
      fs.writeFileSync(path.join(outputDir, 'training_mobile_390x844.png'), Buffer.from(trainMob.data, 'base64'));
    }

    console.log('VIEWPORT_VALIDATION_RESULTS:', JSON.stringify(results, null, 2));
    ws.close();
    chrome.kill();
  } catch (err) {
    console.error('Validation error:', err);
    chrome.kill();
  }
}

run();
