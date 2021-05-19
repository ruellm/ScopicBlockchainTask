const express = require('express');
const app = express();
const path = require('path');

const HTTP_PORT = process.env.HTTP_PORT || 3000;

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'index.html'));
});

app.use(express.static('public'));

app.listen(HTTP_PORT, () => console.log(`HTTP server listening at http://localhost:${HTTP_PORT}`));