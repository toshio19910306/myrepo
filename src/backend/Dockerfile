FROM rust:1.82 as builder

# Install system dependencies for PostgreSQL and SSL
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libpq-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && update-ca-certificates

WORKDIR /app
COPY Cargo.toml ./
COPY src ./src
COPY migrations ./migrations

# Configure Cargo to use Git CLI for better SSL handling
ENV CARGO_NET_GIT_FETCH_WITH_CLI=true

RUN cargo build --release

FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/estimate-request-backend /app/

EXPOSE 8000

CMD ["./estimate-request-backend"]
