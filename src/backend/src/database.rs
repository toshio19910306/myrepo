use sqlx::{PgPool, postgres::PgPoolOptions, Row};
use anyhow::Result;

pub async fn create_pool(database_url: &str) -> Result<PgPool> {
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(database_url)
        .await?;
    
    Ok(pool)
}

pub async fn run_migrations(pool: &PgPool) -> Result<()> {
    let table_exists = sqlx::query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')")
        .fetch_one(pool)
        .await?
        .get::<bool, _>(0);
    
    if !table_exists {
        sqlx::migrate!("./migrations").run(pool).await?;
    } else {
        tracing::info!("Database tables already exist, skipping migrations");
    }
    
    Ok(())
}
