use crate::error::AppError;
use crate::models::UpdateSettingsRequest;

#[tauri::command]
pub fn validate_settings(request: UpdateSettingsRequest) -> Result<(), AppError> {
    if let Some(start) = request.reading_start_hour {
        if start < 0 || start > 23 {
            return Err(AppError::from("Reading start hour must be between 0 and 23"));
        }
    }
    if let Some(end) = request.reading_end_hour {
        if end < 0 || end > 23 {
            return Err(AppError::from("Reading end hour must be between 0 and 23"));
        }
    }
    if let (Some(start), Some(end)) = (request.reading_start_hour, request.reading_end_hour) {
        if start >= end {
            return Err(AppError::from(
                "Reading start hour must be less than end hour",
            ));
        }
    }
    Ok(())
}
