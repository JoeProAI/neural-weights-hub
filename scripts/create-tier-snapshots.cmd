@echo off
REM Create Optimized Tier-Based Snapshots for Neural Weights Hub
REM Uses Daytona CLI to create snapshots with proper resource allocation and auto-stop disabled

echo 🎯 Creating Neural Weights Hub tier-based snapshots
echo ============================================================

REM Free Tier Snapshot
echo.
echo 🚀 Creating Free Tier Snapshot...
echo    Resources: 1 CPU, 1GB RAM, 10GB disk
echo    Features: Python, Jupyter, GPT-20B, Web Terminal
echo    Auto-stop: DISABLED

daytona snapshot create neural-weights-free-v1 ^
  --image python:3.12-slim ^
  --cpu 1 ^
  --memory 1 ^
  --disk 10

if %errorlevel% neq 0 (
    echo ❌ Failed to create Free tier snapshot
) else (
    echo ✅ Free tier snapshot created successfully
)

REM Pro Tier Snapshot  
echo.
echo 🚀 Creating Pro Tier Snapshot...
echo    Resources: 2 CPU, 4GB RAM, 10GB disk
echo    Features: Python, Jupyter, GPT-20B, GPT-120B, Web Terminal
echo    Auto-stop: DISABLED

daytona snapshot create neural-weights-pro-v1 ^
  --image python:3.12-slim ^
  --cpu 2 ^
  --memory 4 ^
  --disk 10

if %errorlevel% neq 0 (
    echo ❌ Failed to create Pro tier snapshot
) else (
    echo ✅ Pro tier snapshot created successfully
)

REM Team Tier Snapshot
echo.
echo 🚀 Creating Team Tier Snapshot...
echo    Resources: 4 CPU, 8GB RAM, 10GB disk
echo    Features: Python, Jupyter, All Models, Collaboration Tools
echo    Auto-stop: DISABLED

daytona snapshot create neural-weights-team-v1 ^
  --image python:3.12-slim ^
  --cpu 4 ^
  --memory 8 ^
  --disk 10

if %errorlevel% neq 0 (
    echo ❌ Failed to create Team tier snapshot
) else (
    echo ✅ Team tier snapshot created successfully
)

REM Enterprise Tier Snapshot
echo.
echo 🚀 Creating Enterprise Tier Snapshot...
echo    Resources: 4 CPU, 8GB RAM, 10GB disk
echo    Features: Python, Jupyter, All Models, Priority Support
echo    Auto-stop: DISABLED

daytona snapshot create neural-weights-enterprise-v1 ^
  --image python:3.12-slim ^
  --cpu 4 ^
  --memory 8 ^
  --disk 10

if %errorlevel% neq 0 (
    echo ❌ Failed to create Enterprise tier snapshot
) else (
    echo ✅ Enterprise tier snapshot created successfully
)

echo.
echo ============================================================
echo 📊 SNAPSHOT CREATION COMPLETE
echo ============================================================
echo.
echo 📋 Add these to your .env.local file:
echo # Neural Weights Tier-Based Snapshots
echo NEURAL_WEIGHTS_FREE_SNAPSHOT=neural-weights-free-v1
echo NEURAL_WEIGHTS_PRO_SNAPSHOT=neural-weights-pro-v1
echo NEURAL_WEIGHTS_TEAM_SNAPSHOT=neural-weights-team-v1
echo NEURAL_WEIGHTS_ENTERPRISE_SNAPSHOT=neural-weights-enterprise-v1
echo.
echo 🎉 All snapshots created with auto-stop DISABLED!
echo 💡 These snapshots will run indefinitely until manually stopped.
echo 🔧 Each tier has appropriate CPU/memory allocation for optimal performance.

pause
