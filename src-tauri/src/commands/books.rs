use crate::error::AppError;
use crate::models::CreateBookRequest;
use chrono::Utc;
use uuid::Uuid;

#[tauri::command]
pub fn generate_book_id() -> String {
    Uuid::new_v4().to_string()
}

#[tauri::command]
pub fn get_current_timestamp() -> String {
    Utc::now().to_rfc3339()
}

#[tauri::command]
pub fn validate_book_request(request: CreateBookRequest) -> Result<(), AppError> {
    if request.title.trim().is_empty() {
        return Err(AppError::from("Title cannot be empty"));
    }
    if request.total_progress <= 0 {
        return Err(AppError::from("Total progress must be greater than 0"));
    }
    let valid_types = ["page", "location", "percentage"];
    if !valid_types.contains(&request.progress_type.as_str()) {
        return Err(AppError::from(
            "Progress type must be 'page', 'location', or 'percentage'",
        ));
    }
    Ok(())
}

#[tauri::command]
pub fn validate_progress_update(
    current: i32,
    total: i32,
    progress_type: String,
) -> Result<(), AppError> {
    if current < 0 {
        return Err(AppError::from("Progress cannot be negative"));
    }
    if current > total {
        return Err(AppError::from("Progress cannot exceed total"));
    }
    Ok(())
}
