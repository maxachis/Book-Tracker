# Migrations tests

- **TestRun_AddsLocationStepToLegacySettings**: A database whose `user_settings` table predates the `location_step` column (existing users' databases) gains the column with value 100 on the existing row while keeping its other settings, and running the migration twice is safe; runs against both `:memory:` and a file-backed DB.
