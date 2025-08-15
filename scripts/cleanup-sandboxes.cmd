@echo off
REM Clean up ERROR and old STOPPED sandboxes automatically
echo 🧹 Cleaning up ERROR and old STOPPED sandboxes...
echo ============================================================

echo.
echo 🗑️ Deleting ERROR status sandboxes...

REM Delete all ERROR sandboxes (these are failed and safe to remove)
daytona sandbox delete 1fbfa0ee-ba7e-40ac-b267-afb5307939d5
daytona sandbox delete 80ebce4e-a734-4b84-bdf4-3301fd8e3aec
daytona sandbox delete 18a451e9-ac81-4400-b9b6-d8495322b257
daytona sandbox delete 75956543-5cf2-4fba-87f4-85d7eed3c50f
daytona sandbox delete 92e83ffc-399a-4eba-8315-bb96cc0ee9a4
daytona sandbox delete 65240691-475e-45d1-8867-c026ea51fa84
daytona sandbox delete 060cccdd-7cfc-4054-9995-911ccb7b00be
daytona sandbox delete aa8c12a4-b349-4556-b122-d86eb75262cc
daytona sandbox delete 48d172fd-cf48-4196-b54f-6e5f986e08ea
daytona sandbox delete d81d9845-39d6-44cb-abce-499319f70031
daytona sandbox delete 4552f4e0-bf2a-43a2-983f-9ebc83fd6987
daytona sandbox delete 9ae56769-3bcd-4687-9c7d-4343fd7abfbe

echo.
echo 🗑️ Deleting old STOPPED sandboxes (2+ days old)...

REM Delete STOPPED sandboxes that are 2+ days old
daytona sandbox delete 4ab6d76c-0a87-4b07-83c0-8fa27895b9f9
daytona sandbox delete 4bd01429-a92c-42cc-aab5-2e0f1c6ed814

echo.
echo ✅ Cleanup completed!
echo.
echo 📊 Summary:
echo   - Deleted 12 ERROR sandboxes
echo   - Deleted 2 old STOPPED sandboxes (2+ days)
echo   - Kept 6 STARTED sandboxes (active)
echo   - Kept recent STOPPED sandboxes (less than 2 days old)
echo.
echo 💾 Estimated space saved: ~14 sandbox instances
echo.

pause
