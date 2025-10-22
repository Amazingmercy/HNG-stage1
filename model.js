const mongoose = require("mongoose");

const StringPropertiesSchema = new mongoose.Schema({
    length: {
        type: Number,
        required: true
    },
    is_palindrome: {
        type: Boolean,
        required: true
    },
    unique_characters: {
        type: Number,
        required: true
    },
    word_count: {
        type: Number,
        required: true
    },
    sha256_hash: {
        type: String,
        required: true
    },
    character_frequency_map: {
        type: Map,
        of: Number,
        required: true
    }
}, { _id: false }
);

const StringAnalysisSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    value: {
        type: String,
        required: true
    },
    properties: {
        type: StringPropertiesSchema,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("StringAnalysis", StringAnalysisSchema);
