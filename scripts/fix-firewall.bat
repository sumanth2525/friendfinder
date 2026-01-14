@echo off
echo Adding Windows Firewall rule for Vite Dev Server...
echo.
echo This requires Administrator privileges.
echo.

netsh advfirewall firewall add rule name="Vite Dev Server Port 5173" dir=in action=allow protocol=TCP localport=5173

echo.
echo Firewall rule added!
echo.
echo Your server URL: http://10.0.0.89:5173
echo.
echo Press any key to exit...
pause >nul
