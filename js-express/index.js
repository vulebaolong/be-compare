const express = require("express");
const client = require("prom-client");

const app = express();
const port = 8082;
const benchmarkIterations = 1000000;

const register = new client.Registry();

const httpRequestsTotal = new client.Counter({
    name: "app_http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "path", "status"],
    registers: [register],
});

const httpRequestDuration = new client.Histogram({
    name: "app_http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "path"],
    buckets: [0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1],
    registers: [register],
});

app.use((req, res, next) => {
    const start = process.hrtime.bigint();

    res.on("finish", () => {
        const durationNs = process.hrtime.bigint() - start;
        const durationSeconds = Number(durationNs) / 1e9;

        const path = req.route?.path || req.path;
        const status = String(res.statusCode);

        httpRequestsTotal.inc({
            method: req.method,
            path,
            status,
        });

        httpRequestDuration.observe(
            {
                method: req.method,
                path,
            },
            durationSeconds,
        );
    });

    next();
});

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
    });
});

app.get("/benchmark", (req, res) => {
    let sum = 0;
    for (let i = 0; i < benchmarkIterations; i++) {
        sum += i;
    }

    res.json({
        result: sum,
        iterations: benchmarkIterations,
    });
});

app.get("/metrics", async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
});

app.listen(port, "0.0.0.0", () => {
    console.log(`Node.js Express server running at http://0.0.0.0:${port}`);
});