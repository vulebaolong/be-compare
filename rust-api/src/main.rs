use axum::{
    extract::State,
    http::{header, HeaderValue, Request, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::get,
    Json, Router,
};
use prometheus::{
    CounterVec, Encoder, HistogramOpts, HistogramVec, Opts, TextEncoder,
};
use serde::Serialize;
use std::{net::SocketAddr, sync::Arc, time::Instant};
use tokio::net::TcpListener;

const BENCHMARK_ITERATIONS: i64 = 1_000_000;

#[derive(Clone)]
struct AppState {
    http_requests_total: CounterVec,
    http_request_duration: HistogramVec,
}

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
}

#[derive(Serialize)]
struct BenchmarkResponse {
    result: i64,
    iterations: i64,
}

async fn metrics_middleware(
    State(state): State<Arc<AppState>>,
    req: Request<axum::body::Body>,
    next: Next,
) -> Response {
    let start = Instant::now();

    let method = req.method().as_str().to_string();
    let path = req.uri().path().to_string();

    let response = next.run(req).await;

    let status = response.status().as_u16().to_string();
    let duration_seconds = start.elapsed().as_secs_f64();

    state
        .http_requests_total
        .with_label_values(&[&method, &path, &status])
        .inc();

    state
        .http_request_duration
        .with_label_values(&[&method, &path])
        .observe(duration_seconds);

    response
}

async fn health_handler() -> Json<HealthResponse> {
    Json(HealthResponse { status: "ok" })
}

async fn benchmark_handler() -> Json<BenchmarkResponse> {
    let mut sum: i64 = 0;
    for i in 0..BENCHMARK_ITERATIONS {
        sum += i;
    }

    Json(BenchmarkResponse {
        result: sum,
        iterations: BENCHMARK_ITERATIONS,
    })
}

async fn metrics_handler() -> impl IntoResponse {
    let metric_families = prometheus::gather();

    let mut buffer = Vec::new();
    let encoder = TextEncoder::new();
    encoder.encode(&metric_families, &mut buffer).unwrap();

    let body = String::from_utf8(buffer).unwrap();

    (
        [(
            header::CONTENT_TYPE,
            HeaderValue::from_str(encoder.format_type()).unwrap(),
        )],
        body,
    )
}

fn create_metrics() -> AppState {
    let http_requests_total = CounterVec::new(
        Opts::new(
            "app_http_requests_total",
            "Total number of HTTP requests",
        ),
        &["method", "path", "status"],
    )
    .unwrap();

    let http_request_duration = HistogramVec::new(
        HistogramOpts {
            common_opts: Opts::new(
                "app_http_request_duration_seconds",
                "HTTP request duration in seconds",
            ),
            buckets: vec![
                0.0001, 0.0002, 0.0005,
                0.001, 0.002, 0.005,
                0.01, 0.02, 0.05, 0.1,
            ],
        },
        &["method", "path"],
    )
    .unwrap();

    prometheus::default_registry()
        .register(Box::new(http_requests_total.clone()))
        .unwrap();

    prometheus::default_registry()
        .register(Box::new(http_request_duration.clone()))
        .unwrap();

    AppState {
        http_requests_total,
        http_request_duration,
    }
}

#[tokio::main]
async fn main() {
    let state = Arc::new(create_metrics());

    let app = Router::new()
        .route("/health", get(health_handler))
        .route("/benchmark", get(benchmark_handler))
        .route("/metrics", get(metrics_handler))
        .layer(middleware::from_fn_with_state(
            state.clone(),
            metrics_middleware,
        ))
        .with_state(state);

    let addr: SocketAddr = "0.0.0.0:8085".parse().unwrap();
    let listener = TcpListener::bind(addr).await.unwrap();

    println!("Rust Axum server running at http://{}", addr);

    axum::serve(listener, app).await.unwrap();
}