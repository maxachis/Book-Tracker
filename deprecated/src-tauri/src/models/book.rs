use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Book {
    pub id: String,
    pub title: String,
    pub author: Option<String>,
    pub current_progress: i32,
    pub total_progress: i32,
    pub progress_type: String,
    pub target_date: Option<String>,
    pub completed_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateBookRequest {
    pub title: String,
    pub author: Option<String>,
    pub total_progress: i32,
    pub progress_type: String,
    pub target_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateBookRequest {
    pub id: String,
    pub title: Option<String>,
    pub author: Option<String>,
    pub current_progress: Option<i32>,
    pub total_progress: Option<i32>,
    pub progress_type: Option<String>,
    pub target_date: Option<String>,
}
