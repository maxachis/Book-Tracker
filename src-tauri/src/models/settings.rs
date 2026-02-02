use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSettings {
    pub id: i32,
    pub reading_start_hour: i32,
    pub reading_end_hour: i32,
    pub stats_start_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateSettingsRequest {
    pub reading_start_hour: Option<i32>,
    pub reading_end_hour: Option<i32>,
    pub stats_start_date: Option<String>,
}

impl Default for UserSettings {
    fn default() -> Self {
        UserSettings {
            id: 1,
            reading_start_hour: 8,
            reading_end_hour: 22,
            stats_start_date: None,
        }
    }
}
