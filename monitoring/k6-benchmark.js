// k6 run k6-benchmark.js

import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
    scenarios: {
        go_gin_test: {
            executor: "constant-vus",
            exec: "testGo",
            vus: 50,
            duration: "24h",
        },
        js_express_test: {
            executor: "constant-vus",
            exec: "testJs",
            vus: 50,
            duration: "24h",
        },
        csharp_test: {
            executor: "constant-vus",
            exec: "testCsharp",
            vus: 50,
            duration: "24h",
        },
        java_test: {
            executor: "constant-vus",
            exec: "testJava",
            vus: 50,
            duration: "24h",
        },
        rust_test: {
            executor: "constant-vus",
            exec: "testRust",
            vus: 50,
            duration: "24h",
        },
    },
    thresholds: {
        http_req_failed: ["rate<0.01"],
        http_req_duration: ["p(95)<1000"],
    },
};

const domainGo = "http://54.179.157.206";
const domainJs = "http://13.212.74.107";
const domainCsharp = "http://52.77.210.38";
const domainJava = "http://13.212.236.217";
const domainRust = "http://13.212.187.248";

function randomSleep(min, max) {
    return Math.random() * (max - min) + min;
}

export function testGo() {
    const res = http.get(`${domainGo}:8081/benchmark`);
    check(res, {
        "go status is 200": (r) => r.status === 200,
    });
    //   sleep(randomSleep(0.05, 0.5));
}

export function testJs() {
    const res = http.get(`${domainJs}:8082/benchmark`);
    check(res, {
        "js status is 200": (r) => r.status === 200,
    });
    //   sleep(randomSleep(0.05, 0.5));
}

export function testCsharp() {
    const res = http.get(`${domainCsharp}:8083/benchmark`);
    check(res, {
        "csharp status is 200": (r) => r.status === 200,
    });
}

export function testJava() {
    const res = http.get(`${domainJava}:8084/benchmark`);
    check(res, {
        "java status is 200": (r) => r.status === 200,
    });
}

export function testRust() {
    const res = http.get(`${domainRust}:8085/benchmark`);
    check(res, {
        "rust status is 200": (r) => r.status === 200,
    });
}
