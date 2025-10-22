const express = require("express")
const nlp = require("compromise");
const router = express.Router()
const { getLength, isDistinct, is_palindrome, sha256_hash, char_freq, word_count } = require("./controller")
const stringAnalyser = require("./model")
const {interpretQuery} = require("./ai")


router.post("", async (req, res) => {
    try {
        const string = req.body.value
        const cleanedValue = string.trim().toLowerCase()
        if (typeof (cleanedValue) !== "string") {
            return res.status(422).json({ error: "Unprocessable Entity: Invalid data type for \"value\" (must be string" })
        }
        if (!cleanedValue.trim()) {
            return res.status(400).json({ error: "Bad Request: Invalid request body or missing \"value\" field" })
        }
        const existingString = await stringAnalyser.findOne({ value: cleanedValue })
        if (existingString) {
            return res.status(409).json({ error: "Conflict: String already exists in the system" })
        }


        // Compute properties using helper functions
        const length = getLength(cleanedValue);
        const palindrome = is_palindrome(cleanedValue);
        const unique = isDistinct(cleanedValue);
        const words = word_count(cleanedValue);
        const hash = sha256_hash(cleanedValue);
        const frequencyMap = char_freq(cleanedValue);

        // Create new record
        const newString = new stringAnalyser({
            id: hash,
            value: cleanedValue,
            properties: {
                length,
                is_palindrome: palindrome,
                unique_characters: unique,
                word_count: words,
                sha256_hash: hash,
                character_frequency_map: frequencyMap,
            },
            created_at: new Date(),
        });

        // Save to DB
        await newString.save();

        res.status(201).json({data: newString});
    } catch (error) {
        console.error("Error analyzing string:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }

})

router.get("/strings/filter-by-natural-language", async (req, res) => {
  try {
    const query = req.query.query?.toLowerCase();
    if (!query) return res.status(400).json({ error: "Missing query parameter" });

    const aiResponse = await interpretQuery(query);
    if (!aiResponse) return res.status(400).json({ error: "Unable to interpret query" });
    const filters = {};

    if (aiResponse.is_palindrome !== undefined)
      filters["properties.is_palindrome"] = aiResponse.is_palindrome;

    if (aiResponse.word_count !== undefined)
      filters["properties.word_count"] = aiResponse.word_count;

    if (aiResponse.min_length)
      filters["properties.length"] = { ...filters["properties.length"], $gte: aiResponse.min_length };

    if (aiResponse.max_length)
      filters["properties.length"] = { ...filters["properties.length"], $lte: aiResponse.max_length };

    if (aiResponse.contains_character)
      filters["value"] = { $regex: aiResponse.contains_character};

    const data = await stringAnalyser.find(filters).select("-_id -__v");

    res.status(200).json({data, count: data.length, interpreted_query: { original: query, parsed_filters: filters }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


router.get("/strings", async (req, res) => {
  try {
    const {is_palindrome, min_length, max_length, word_count, contains_character} = req.query;

    // Validate query parameter types
    if (
      (is_palindrome && !["true", "false"].includes(is_palindrome)) ||
      (min_length && isNaN(Number(min_length))) ||
      (max_length && isNaN(Number(max_length))) ||
      (word_count && isNaN(Number(word_count))) ||
      (contains_character && contains_character.length !== 1)
    ) {
      return res.status(400).json({ error: "Bad Request: Invalid query parameter values or types" });
    }

    // Build dynamic filter
    const filter = {};

    if (is_palindrome !== undefined) {
      filter["properties.is_palindrome"] = is_palindrome === "true";
    }

    if (min_length !== undefined || max_length !== undefined) {
      filter["properties.length"] = {};
      if (min_length) filter["properties.length"].$gte = Number(min_length);
      if (max_length) filter["properties.length"].$lte = Number(max_length);
    }

    if (word_count !== undefined) {
      filter["properties.word_count"] = Number(word_count);
    }

    if (contains_character !== undefined) {
      filter.value = { $regex: contains_character, $options: "i" };
    }

    // Fetch from DB
    const data = await stringAnalyser.find(filter).select("-_id -__v");
    const count = data.length;

    res.status(200).json({
      data,
      count,
      filters_applied: {
        ...(is_palindrome && { is_palindrome: is_palindrome === "true" }),
        ...(min_length && { min_length: Number(min_length) }),
        ...(max_length && { max_length: Number(max_length) }),
        ...(word_count && { word_count: Number(word_count) }),
        ...(contains_character && { contains_character }),
      },
    });
  } catch (error) {
    console.error("Error fetching strings:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/strings/:string_value", async (req, res) => {
    try {
    const {string_value} = req.params
    const cleanedValue = string_value.trim().toLowerCase()
    const existingString = await stringAnalyser.findOne({value: cleanedValue}).select("-_id -__v");;
    if (!existingString) {
        return res.status(404).json({ error: "Not Found: String does not exist in the system"})
    }
    res.status(200).json(existingString)
    } catch (error) {
        console.error("Error getting string:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }

})

router.delete("/strings/:string_value", async (req, res) => {
  try {
    const { string_value } = req.params;
    const cleanedValue = string_value.trim().toLowerCase()

    // Find and delete by value
    const deleted = await stringAnalyser.findOneAndDelete({ value: cleanedValue });

    if (!deleted) {
      return res.status(404).json({ error: "Not Found: String does not exist in the system" });
    }

    // Success: no content
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




module.exports = router