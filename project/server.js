const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

// 정적 파일 제공
app.use(express.static(path.join(__dirname)));


app.get('/', (req, res) => {
    res.redirect('/shopRegister.html');
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
});
