// Handles authentication and routing for the application

const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {    // Send a login page
    res.send('Welcome')
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});