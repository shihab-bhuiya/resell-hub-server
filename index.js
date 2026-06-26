const express = require('express');
const app = express();
const PORT = 5000 || process.env.PORT;

app.get('/', (req, res) => {
    res.send("Server Running fine")
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})