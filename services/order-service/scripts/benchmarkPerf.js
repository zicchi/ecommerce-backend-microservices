
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
        // Register/Login a temp user
        const email = `bench_${Date.now()}@test.com`;
        const password = 'password123';

        console.log(`Creating test user: ${email}`);
        const regRes = await fetch(`${USER_SERVICE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Bench User', email, password })
        });

        await regRes.json();

        // Login
        const loginRes = await fetch(`${USER_SERVICE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        token = loginData.data?.token || loginData.token;

        if (!token) throw new Error('Failed to get token');
        console.log('Got Token.');

        // Get a product
        const prodRes = await fetch(`${PRODUCT_SERVICE}/products?limit=1`);
        const prodData = await prodRes.json();
        productId = prodData.data?.products?.[0]?.id;

        if (!productId) {
            const newProdRes = await fetch(`${PRODUCT_SERVICE}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: 'Bench Prod', description: 'desc', price: 100, stock_quantity: 10000 })
            });
            const newProdData = await newProdRes.json();
            productId = newProdData.data?.product?.id;
        }

        if (!productId) throw new Error('Failed to get productId');
        console.log(`Using Product ID: ${productId}`);

    } catch (err) {
        console.error('Setup Failed:', err);
        return;
    }

    const orderPayload = {
        items: [{ productId, quantity: 1 }]
    };

    const ITERATIONS = 100; // Increased to get measurable CPU diff

    async function getMetrics() {
        const res = await fetch(`${ORDER_SERVICE}/orders/metrics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await res.json();
    }

    // 2. Measure Logic Separated (Current)
    console.log(`\nTesting Current Architecture (Separated Service)... ${ITERATIONS} reqs`);

    // Warmup
    await fetch(`${ORDER_SERVICE}/orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(orderPayload)
    });

    const cpuNewStart = await getMetrics();
    const startNew = performance.now();
    let errorsNew = 0;

    for (let i = 0; i < ITERATIONS; i++) {
        try {
            const res = await fetch(`${ORDER_SERVICE}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderPayload)
            });
            if (!res.ok) errorsNew++;
        } catch (e) { errorsNew++; }
    }
    const endNew = performance.now();
    const cpuNewEnd = await getMetrics();

    const timeNew = endNew - startNew;
    const cpuNewUsed = (cpuNewEnd.user + cpuNewEnd.system) - (cpuNewStart.user + cpuNewStart.system);

    console.log(`Current: Time ${timeNew.toFixed(2)}ms, CPU Used: ${cpuNewUsed}µs. Errors: ${errorsNew}`);


    // 3. Measure Legacy (Controller Monolith)
    console.log(`\nTesting Legacy Architecture (Controller Monolith)... ${ITERATIONS} reqs`);
    await new Promise(r => setTimeout(r, 2000)); // Cool down

    // Warmup
    await fetch(`${ORDER_SERVICE}/orders/legacy`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(orderPayload)
    });

    const cpuOldStart = await getMetrics();
    const startOld = performance.now();
    let errorsOld = 0;
    for (let i = 0; i < ITERATIONS; i++) {
        try {
            const res = await fetch(`${ORDER_SERVICE}/orders/legacy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderPayload)
            });
            if (!res.ok) errorsOld++;
        } catch (e) { errorsOld++; }
    }
    const endOld = performance.now();
    const cpuOldEnd = await getMetrics();

    const timeOld = endOld - startOld;
    const cpuOldUsed = (cpuOldEnd.user + cpuOldEnd.system) - (cpuOldStart.user + cpuOldStart.system);

    console.log(`Legacy:  Time ${timeOld.toFixed(2)}ms, CPU Used: ${cpuOldUsed}µs. Errors: ${errorsOld}`);

    console.log('\n--- Energy Efficiency Result ---');
    console.log(`CPU Delta (Legacy - Current): ${cpuOldUsed - cpuNewUsed}µs`);
    if (cpuNewUsed > cpuOldUsed) {
        console.log(`Legacy is ${(cpuNewUsed / cpuOldUsed).toFixed(2)}x more CPU efficient.`);
    } else {
        console.log(`Current is ${(cpuOldUsed / cpuNewUsed).toFixed(2)}x more CPU efficient.`);
    }
}

runBenchmark();
