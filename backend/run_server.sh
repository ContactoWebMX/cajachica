node server.js &
SERVER_PID=$!
sleep 2
curl -s http://localhost:3000/api/finance/stats?user_id=27
curl -s http://localhost:3000/api/settings
kill $SERVER_PID
