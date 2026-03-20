using Prometheus;
using System.Diagnostics;

const int benchmarkIterations = 1000000;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var httpRequestsTotal = Metrics.CreateCounter(
    "app_http_requests_total",
    "Total number of HTTP requests",
    new CounterConfiguration
    {
        LabelNames = new[] { "method", "path", "status" }
    });

var httpRequestDuration = Metrics.CreateHistogram(
    "app_http_request_duration_seconds",
    "HTTP request duration in seconds",
    new HistogramConfiguration
    {
        LabelNames = new[] { "method", "path" },
        Buckets = new double[]
        {
            0.0001, 0.0002, 0.0005,
            0.001, 0.002, 0.005,
            0.01, 0.02, 0.05, 0.1
        }
    });

app.Use(async (context, next) =>
{
    var stopwatch = Stopwatch.StartNew();

    await next();

    stopwatch.Stop();

    var method = context.Request.Method;
    var path = context.Request.Path.HasValue ? context.Request.Path.Value! : "/";
    var status = context.Response.StatusCode.ToString();

    httpRequestsTotal
        .WithLabels(method, path, status)
        .Inc();

    httpRequestDuration
        .WithLabels(method, path)
        .Observe(stopwatch.Elapsed.TotalSeconds);
});

app.MapGet("/health", () =>
{
    return Results.Json(new
    {
        status = "ok"
    });
});

app.MapGet("/benchmark", () =>
{
    long sum = 0;
    for (int i = 0; i < benchmarkIterations; i++)
    {
        sum += i;
    }

    return Results.Json(new
    {
        result = sum,
        iterations = benchmarkIterations
    });
});

app.MapMetrics("/metrics");

app.Run("http://0.0.0.0:8083");