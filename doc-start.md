# setting địa chỉ server trong file docker-compose.yml
- targets: ["54.179.157.206:8081"]

# setting địa chỉ server trong file k6-benchmark.js
const domainGo = "http://54.179.157.206";

# chạy prometheus và grafana
cd monitoring
docker compose up -d
docker compose restart prometheus

# kiểm tra kết nối prometheus với các server BE
http://localhost:9090/targets

# Truy cập UI grafana và đăng nhập
http://localhost:3000
username: admin
password: admin

# add Prometheus data source vào Grafana
Bên trái bấm: Connections
Chọn Add new connection: Prometheus
Chọn URL của Prometheus: http://localhost:9090

# tạo dashboard và thêm dashboaả-setting.json

# UI grafana để xem chart so sánh
http://localhost:3000/d/adhpmjg/be-compare?orgId=1&from=now-5m&to=now&timezone=browser&refresh=1s