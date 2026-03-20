package com.example.java_api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class BenchmarkController {

    private static final int BENCHMARK_ITERATIONS = 1000000;

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "ok"
        );
    }

    @GetMapping("/benchmark")
    public Map<String, Object> benchmark() {
        long sum = 0;
        for (int i = 0; i < BENCHMARK_ITERATIONS; i++) {
            sum += i;
        }

        return Map.of(
                "result", sum,
                "iterations", BENCHMARK_ITERATIONS
        );
    }
}