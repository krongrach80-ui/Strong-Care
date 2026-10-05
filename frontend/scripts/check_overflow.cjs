const { spawn } = require('child_process');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  '--no-sandbox',
  '--window-size=390,844',
  'http://127.0.0.1:4173/'
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9222/json');
    const tabs = await res.json();
    const targetTab = tabs.find(t => t.url.includes('4173')) || tabs[0];
    const ws = new WebSocket(targetTab.webSocketDebuggerUrl);
    ws.onopen = () => {
      const code = `
        (() => {
          const w = window.innerWidth;
          const list = [];
          document.querySelectorAll('*').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.right > w + 1 || el.scrollWidth > w + 1) {
              list.push({
                tag: el.tagName,
                cls: (el.className || '').toString().slice(0, 50),
                rectRight: Math.round(r.right),
                scrollWidth: el.scrollWidth,
                windowWidth: w,
                text: (el.innerText || '').slice(0, 30).replace(/\\s+/g, ' ')
              });
            }
          });
          return { windowWidth: w, list: list.slice(0, 20) };
        })()
      `;
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: code,
          returnByValue: true
        }
      }));
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === 1) {
        console.log('RESULT:', JSON.stringify(data.result.result.value, null, 2));
        chrome.kill();
        process.exit(0);
      }
    };
  } catch (e) {
    console.error('Error:', e.message);
    chrome.kill();
    process.exit(1);
  }
}, 3500);
