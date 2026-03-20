package com.example.java_api;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Component
public class MetricsFilter extends OncePerRequestFilter {

    private final MeterRegistry meterRegistry;

    private final ConcurrentHashMap<String, Counter> counterCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Timer> timerCache = new ConcurrentHashMap<>();

    public MetricsFilter(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        long startNs = System.nanoTime();

        filterChain.doFilter(request, response);

        long durationNs = System.nanoTime() - startNs;

        String method = request.getMethod();
        String path = request.getRequestURI();
        String status = String.valueOf(response.getStatus());

        String counterKey = method + "|" + path + "|" + status;
        String timerKey = method + "|" + path;

        Counter counter = counterCache.computeIfAbsent(counterKey, key ->
                Counter.builder("app_http_requests_total")
                        .description("Total number of HTTP requests")
                        .tag("method", method)
                        .tag("path", path)
                        .tag("status", status)
                        .register(meterRegistry)
        );

        Timer timer = timerCache.computeIfAbsent(timerKey, key ->
                Timer.builder("app_http_request_duration_seconds")
                        .description("HTTP request duration in seconds")
                        .publishPercentileHistogram(false)
                        .serviceLevelObjectives(
                                Duration.ofNanos(100_000),       // 0.0001s
                                Duration.ofNanos(200_000),       // 0.0002s
                                Duration.ofNanos(500_000),       // 0.0005s
                                Duration.ofMillis(1),            // 0.001s
                                Duration.ofMillis(2),            // 0.002s
                                Duration.ofMillis(5),            // 0.005s
                                Duration.ofMillis(10),           // 0.01s
                                Duration.ofMillis(20),           // 0.02s
                                Duration.ofMillis(50),           // 0.05s
                                Duration.ofMillis(100)           // 0.1s
                        )
                        .tag("method", method)
                        .tag("path", path)
                        .register(meterRegistry)
        );

        counter.increment();
        timer.record(durationNs, TimeUnit.NANOSECONDS);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return false;
    }
}