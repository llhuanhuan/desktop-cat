/**
 * HTTP 请求体大小限制测试
 * 验证 POST /state 接口拒绝超过 64KB 的请求体，防止内存泄露
 */

const http = require('http');

// 提取服务器创建逻辑进行测试
function createTestServer() {
  let dndMode = false;

  function notifyStateChange() {}

  const server = http.createServer((req, res) => {
    const origin = req.headers.origin || '';
    const isLocal = !origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || origin === 'null';
    if (isLocal) {
      res.setHeader('Access-Control-Allow-Origin', origin || 'http://localhost');
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', dnd: dndMode }));
      return;
    }

    if (req.method === 'POST' && req.url === '/state') {
      let body = '';
      let aborted = false;
      const MAX_BODY_SIZE = 64 * 1024;
      req.on('data', chunk => {
        if (aborted) return;
        body += chunk.toString();
        if (body.length > MAX_BODY_SIZE) {
          aborted = true;
          req.pause();
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Payload too large' }));
        }
      });
      req.on('end', () => {
        if (aborted) return;
        try {
          const data = JSON.parse(body);
          const { state } = data;
          const VALID_STATES = ['idle','happy','sleeping','thinking','working','error','notification','waking'];
          if (state && VALID_STATES.includes(state)) {
            notifyStateChange(state);
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    } else {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Desktop Cat Notification Server');
    }
  });

  return server;
}

function makeRequest(port, options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, ...options }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

describe('HTTP Body Size Limit', () => {
  let server;
  let port;

  beforeAll((done) => {
    server = createTestServer();
    server.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  test('正常大小的请求应该成功处理', async () => {
    const body = JSON.stringify({ state: 'happy', event: 'test', detail: 'ok' });
    const res = await makeRequest(port, {
      method: 'POST',
      path: '/state',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, body);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('超过 64KB 的请求体应该返回 413', async () => {
    // 构造一个超过 64KB 的请求体
    const largeDetail = 'x'.repeat(65 * 1024);
    const body = JSON.stringify({ state: 'happy', event: 'test', detail: largeDetail });
    const res = await makeRequest(port, {
      method: 'POST',
      path: '/state',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, body);
    expect(res.status).toBe(413);
    expect(res.body.error).toBe('Payload too large');
  });

  test('恰好 64KB 的请求体应该成功处理', async () => {
    // 构造一个接近 64KB 但不超标的请求体
    // JSON overhead: {"state":"happy","event":"test","detail":""} ≈ 42 bytes
    const detailLen = 64 * 1024 - 50; // 留出 JSON 结构的空间
    const detail = 'a'.repeat(detailLen);
    const body = JSON.stringify({ state: 'happy', event: 'test', detail });
    expect(body.length).toBeLessThanOrEqual(64 * 1024);
    const res = await makeRequest(port, {
      method: 'POST',
      path: '/state',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, body);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('无效 JSON 应该返回 400', async () => {
    const body = 'not json at all';
    const res = await makeRequest(port, {
      method: 'POST',
      path: '/state',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid JSON');
  });

  test('健康检查端点正常工作', async () => {
    const res = await makeRequest(port, {
      method: 'GET',
      path: '/health'
    });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
