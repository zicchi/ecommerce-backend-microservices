
import fs from 'fs';

// Using native fetch in Node 18+

const USER_SERVICE = 'http://localhost:3001';
const PRODUCT_SERVICE = 'http://localhost:3002';
const ORDER_SERVICE = 'http://localhost:3003';

async function runBenchmark() {
    console.log('Starting Green Microservices Benchmark (Energy/CPU)...');

    // 1. Setup Data
    let token;
    let productId;

    try {
        const email = `bench_${Date.now()}@test.com`;
        const password = 'password123';

        console.log(`Creating test user: ${email}`);
        const regRes = await fetch(`${USER_SERVICE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Bench User', email, password })
        });
        await regRes.json();

        const loginRes = await fetch(`${USER_SERVICE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        token = loginData.data?.token || loginData.token;

        if (!token) throw new Error('Failed to get token');

        const prodRes = await fetch(`${PRODUCT_SERVICE}/products?limit=1`);
        const prodData = await prodRes.json();
        productId = prodData.data?.products?.[0]?.id;

        if (!productId) {
            const newProdRes = await fetch(`${PRODUCT_SERVICE}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: 'Bench Prod', description: 'desc', price: 100, stock_quantity: 10000 })
            });
            const newProdData = await newProdRes.json();
            productId = newProdData.data?.product?.id;
        }
        if (!productId) throw new Error('Failed to get productId');

    } catch (err) {
        console.error('Setup Failed:', err);
        return;
    }

    const orderPayload = { items: [{ productId, quantity: 1 }] };

    // Prepare CSV
    const csvHeader = 'Iterations,Architecture,AvgLatency(ms),CPUUsed(us),TotalTime(ms)\n';
    if (!fs.existsSync('benchmark_results.csv')) {
        fs.writeFileSync('benchmark_results.csv', csvHeader);
    }

    const loads = [20, 50, 100];

    async function getMetrics() {
        const res = await fetch(`${ORDER_SERVICE}/orders/metrics`, { headers: { 'Authorization': `Bearer ${token}` } });
        return await res.json();
    }

    for (const ITERATIONS of loads) {
        console.log(`\n--- Running Load: ${ITERATIONS} reqs ---`);

        // --- 1. Clean Architecture (Original) ---
        await fetch(`${ORDER_SERVICE}/orders`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(orderPayload)
        });

        const cpuNewStart = await getMetrics();
        const startNew = performance.now();
        for (let i = 0; i < ITERATIONS; i++) {
            try {
                await fetch(`${ORDER_SERVICE}/orders`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(orderPayload)
                });
            } catch (e) { }
        }
        const endNew = performance.now();
        const cpuNewEnd = await getMetrics();

        const timeNew = endNew - startNew;
        const cpuNewUsed = (cpuNewEnd.user + cpuNewEnd.system) - (cpuNewStart.user + cpuNewStart.system);
        const avgNew = timeNew / ITERATIONS;

        fs.appendFileSync('benchmark_results.csv', `${ITERATIONS},CleanArch,${avgNew.toFixed(2)},${cpuNewUsed},${timeNew.toFixed(2)}\n`);
        console.log(`CleanArch:     ${avgNew.toFixed(2)}ms, CPU: ${cpuNewUsed}us`);


        // --- 2. Optimized Architecture (Parallel) ---
        await new Promise(r => setTimeout(r, 1000));
        await fetch(`${ORDER_SERVICE}/orders/optimized`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(orderPayload)
        });

        const cpuOptStart = await getMetrics();
        const startOpt = performance.now();
        for (let i = 0; i < ITERATIONS; i++) {
            try {
                await fetch(`${ORDER_SERVICE}/orders/optimized`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(orderPayload)
                });
            } catch (e) { }
        }
        const endOpt = performance.now();
        const cpuOptEnd = await getMetrics();

        const timeOpt = endOpt - startOpt;
        const cpuOptUsed = (cpuOptEnd.user + cpuOptEnd.system) - (cpuOptStart.user + cpuOptStart.system);
        const avgOpt = timeOpt / ITERATIONS;

        fs.appendFileSync('benchmark_results.csv', `${ITERATIONS},OptimizedArch,${avgOpt.toFixed(2)},${cpuOptUsed},${timeOpt.toFixed(2)}\n`);
        console.log(`OptimizedArch: ${avgOpt.toFixed(2)}ms, CPU: ${cpuOptUsed}us`);


        // --- 3. Legacy Architecture (Baseline) ---
        await new Promise(r => setTimeout(r, 1000));
        await fetch(`${ORDER_SERVICE}/orders/legacy`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(orderPayload)
        });

        const cpuOldStart = await getMetrics();
        const startOld = performance.now();
        for (let i = 0; i < ITERATIONS; i++) {
            try {
                await fetch(`${ORDER_SERVICE}/orders/legacy`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(orderPayload)
                });
            } catch (e) { }
        }
        const endOld = performance.now();
        const cpuOldEnd = await getMetrics();

        const timeOld = endOld - startOld;
        const cpuOldUsed = (cpuOldEnd.user + cpuOldEnd.system) - (cpuOldStart.user + cpuOldStart.system);
        const avgOld = timeOld / ITERATIONS;

        fs.appendFileSync('benchmark_results.csv', `${ITERATIONS},Legacy,${avgOld.toFixed(2)},${cpuOldUsed},${timeOld.toFixed(2)}\n`);
        console.log(`Legacy:        ${avgOld.toFixed(2)}ms, CPU: ${cpuOldUsed}us`);
    }

    console.log('\nBenchmark Complete. Results saved to benchmark_results.csv');
}

runBenchmark();
