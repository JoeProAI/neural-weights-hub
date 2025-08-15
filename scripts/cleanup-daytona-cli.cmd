@echo off
REM Clean up old Daytona snapshots and sandboxes using CLI
echo 🧹 Cleaning up old Daytona snapshots and sandboxes...
echo ============================================================

echo.
echo 📋 Listing all sandboxes...
daytona sandbox list

echo.
echo 📋 Listing all snapshots...
daytona snapshot list

echo.
echo 🗑️ Cleaning up old sandboxes (stopped, >3 days old)...
echo.
echo ⚠️  MANUAL REVIEW REQUIRED ⚠️
echo Please review the above lists and manually delete old items:
echo.
echo To delete a sandbox:
echo   daytona sandbox delete [SANDBOX_ID]
echo.
echo To delete a snapshot:
echo   daytona snapshot delete [SNAPSHOT_ID]
echo.
echo 🔒 DO NOT DELETE these production items:
echo   - Any snapshot with "production" in the name
echo   - Any snapshot with "neural-weights" in the name
echo   - Any snapshot with "gpt-" in the name
echo   - Any currently running sandboxes
echo.
echo 💡 Safe to delete:
echo   - Stopped sandboxes older than 3 days
echo   - Test snapshots without "production" in name
echo   - Temporary or experimental snapshots
echo.

pause
