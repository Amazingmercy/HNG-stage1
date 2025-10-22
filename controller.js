const crypto = require("crypto");

exports.getLength = (string) => {
    return string.length
}

exports.is_palindrome = (string) => {
    const stringToLower = string.toLowerCase() 
    return stringToLower === stringToLower.split("").reverse().join("")
}

exports.isDistinct = (string) => {
    const distinct = [...new Set(string)]
    return distinct.length
}

exports.word_count = (string) => {
    return string.trim().split(" ").length
}

exports.sha256_hash = (string) => {
    return crypto.createHash("sha256").update(string).digest("hex");
}

exports.char_freq = (string) => {
    const charFreq = {}
    for (const char of string) {
      charFreq[char] = (charFreq[char] || 0) + 1;
    }

    return charFreq
}