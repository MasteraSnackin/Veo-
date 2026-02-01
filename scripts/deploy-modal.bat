@echo off
REM Modal Deployment Script for Veo Housing Platform (Windows)
REM This script handles the complete deployment of serverless functions to Modal

setlocal enabledelayedexpansion

echo ==================================
echo Modal Deployment Script
echo Veo Housing Platform
echo ==================================
echo.

REM Check if Modal CLI is installed
where modal >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Modal CLI not found
    echo Installing Modal CLI...
    pip install modal
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install Modal CLI
        exit /b 1
    )
)

REM Check if authenticated
echo [INFO] Checking Modal authentication...
modal token check >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Not authenticated. Please authenticate with Modal:
    modal token new
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Authentication failed
        exit /b 1
    )
)

echo [OK] Modal CLI authenticated
echo.

REM Check for .env file
echo [INFO] Checking environment variables...
if not exist .env (
    echo [ERROR] .env file not found
    echo Please create .env file with required API keys:
    echo   - SCANSAN_API_KEY
    echo   - TFL_API_KEY
    echo   - OPENAI_API_KEY
    exit /b 1
)

REM Load .env and check for required keys
set "MISSING_KEYS="
for /f "tokens=1,2 delims==" %%a in (.env) do (
    set "%%a=%%b"
)

if not defined SCANSAN_API_KEY set "MISSING_KEYS=!MISSING_KEYS! SCANSAN_API_KEY"
if not defined TFL_API_KEY set "MISSING_KEYS=!MISSING_KEYS! TFL_API_KEY"
if not defined OPENAI_API_KEY set "MISSING_KEYS=!MISSING_KEYS! OPENAI_API_KEY"

if defined MISSING_KEYS (
    echo [ERROR] Missing required API keys in .env:
    echo !MISSING_KEYS!
    exit /b 1
)

echo [OK] All required API keys found
echo.

REM Create or update Modal secrets
echo [INFO] Setting up Modal secrets...
modal secret create veo-api-keys SCANSAN_API_KEY="%SCANSAN_API_KEY%" TFL_API_KEY="%TFL_API_KEY%" OPENAI_API_KEY="%OPENAI_API_KEY%" --force >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    modal secret update veo-api-keys SCANSAN_API_KEY="%SCANSAN_API_KEY%" TFL_API_KEY="%TFL_API_KEY%" OPENAI_API_KEY="%OPENAI_API_KEY%"
)

echo [OK] Modal secrets configured
echo.

REM Deploy Modal application
echo [INFO] Deploying Modal functions...
modal deploy modal_config.py
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Deployment failed
    exit /b 1
)

echo.
echo [OK] Modal deployment complete
echo.

REM Get deployment URLs
echo [INFO] Fetching deployment URLs...
modal app list | findstr "veo-housing"

echo.
echo ==================================
echo Deployment Summary
echo ==================================
echo.
echo Functions deployed:
echo   1. fetch_recommendations (5min timeout, 2 retries)
echo   2. fetch_area_data (1min timeout, 2 retries)
echo   3. calculate_commute (30s timeout, 2 retries)
echo   4. cache_warmer (scheduled daily)
echo.
echo Next steps:
echo   1. Test functions: modal run modal_config.py
echo   2. Update NEXT_PUBLIC_USE_MODAL=true in .env
echo   3. Update python-bridge.ts with Modal endpoints
echo   4. Deploy frontend to Vercel
echo.
echo [SUCCESS] Deployment successful!

endlocal
