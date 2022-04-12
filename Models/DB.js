const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    PrivateKey: { type: String, required: true },
    User: { type: String, required: true },
    Points: { type: Number, required: true },
});

module.exports = mongoose.model('Data', userSchema);