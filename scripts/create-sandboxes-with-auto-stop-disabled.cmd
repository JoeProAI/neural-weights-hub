@echo off
REM Create sandboxes from tier snapshots with auto-stop disabled
REM This ensures sandboxes run indefinitely until manually stopped

echo 🎯 Creating sandboxes with auto-stop disabled from tier snapshots
echo ============================================================

REM Free Tier Sandbox
echo.
echo 🚀 Creating Free Tier Sandbox (auto-stop disabled)...
daytona sandbox create --snapshot neural-weights-free-v1 --auto-stop 0 --auto-archive 0 --auto-delete -1
if %errorlevel% neq 0 (
    echo ❌ Failed to create Free tier sandbox
) else (
    echo ✅ Free tier sandbox created with auto-stop DISABLED
)

REM Pro Tier Sandbox
echo.
echo 🚀 Creating Pro Tier Sandbox (auto-stop disabled)...
daytona sandbox create --snapshot neural-weights-pro-v1 --auto-stop 0 --auto-archive 0 --auto-delete -1
if %errorlevel% neq 0 (
    echo ❌ Failed to create Pro tier sandbox
) else (
    echo ✅ Pro tier sandbox created with auto-stop DISABLED
)

REM Team Tier Sandbox
echo.
echo 🚀 Creating Team Tier Sandbox (auto-stop disabled)...
daytona sandbox create --snapshot neural-weights-team-v1 --auto-stop 0 --auto-archive 0 --auto-delete -1
if %errorlevel% neq 0 (
    echo ❌ Failed to create Team tier sandbox
) else (
    echo ✅ Team tier sandbox created with auto-stop DISABLED
)

REM Enterprise Tier Sandbox
echo.
echo 🚀 Creating Enterprise Tier Sandbox (auto-stop disabled)...
daytona sandbox create --snapshot neural-weights-enterprise-v1 --auto-stop 0 --auto-archive 0 --auto-delete -1
if %errorlevel% neq 0 (
    echo ❌ Failed to create Enterprise tier sandbox
) else (
    echo ✅ Enterprise tier sandbox created with auto-stop DISABLED
)

echo.
echo ============================================================
echo 📊 SANDBOX CREATION COMPLETE
echo ============================================================
echo.
echo 🎉 All tier-based sandboxes created with:
echo    • Auto-stop: DISABLED (runs indefinitely)
echo    • Auto-archive: DISABLED
echo    • Auto-delete: DISABLED
echo.
echo 💡 These sandboxes will provide optimal performance for each tier:
echo    • Free: 1 CPU, 1GB RAM, GPT-20B access
echo    • Pro: 2 CPU, 4GB RAM, GPT-20B + GPT-120B access
echo    • Team: 4 CPU, 8GB RAM, all models + collaboration
echo    • Enterprise: 4 CPU, 8GB RAM, all features + priority support

pause
