const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const EMAIL = process.env.OFFICIAL_EMAIL;

function isPrime(n) {
    if (n < 2) return false;
    for (let i = 2; i * i <= n; i++) {
        if (n % i === 0) return false;
    }
    return true;
}

function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}

function lcm(a, b) {
    return Math.abs(a * b) / gcd(a, b);
}

app.get("/health", (req, res) => {
    return res.status(200).json({
        is_success: true,
        official_email: EMAIL,
    });
});

app.post("/bfhl", async (req, res) => {
    try {
        if (!req.body || typeof req.body !== "object") {
            return res.status(400).json({
                is_success: false,
                error: "Invalid JSON body",
            });
        }

        const keys = Object.keys(req.body);

        if (keys.length !== 1) {
            return res.status(400).json({
                is_success: false,
                error: "Request must contain exactly one key",
            });
        }

        const key = keys[0];
        const value = req.body[key];
        let data;

        if (key === "fibonacci") {
            if (!Number.isInteger(value) || value < 0 || value > 1000) {
                return res.status(400).json({
                    is_success: false,
                    error: "Fibonacci must be a non-negative integer ≤ 1000",
                });
            }

            const fib = [];
            let a = 0,
                b = 1;
            for (let i = 0; i < value; i++) {
                fib.push(a);
                const temp = a + b;
                a = b;
                b = temp;
            }
            data = fib;
        } else if (key === "prime") {
            if (!Array.isArray(value)) {
                return res.status(400).json({
                    is_success: false,
                    error: "Prime input must be an array",
                });
            }

            data = value.filter((n) => Number.isInteger(n) && isPrime(n));
        } else if (key === "lcm") {
            if (!Array.isArray(value) || value.length === 0) {
                return res.status(400).json({
                    is_success: false,
                    error: "LCM input must be a non-empty array",
                });
            }

            data = value.reduce((acc, curr) => {
                if (!Number.isInteger(curr)) {
                    throw new Error("Invalid number in LCM array");
                }
                return lcm(acc, curr);
            });
        } else if (key === "hcf") {
            if (!Array.isArray(value) || value.length === 0) {
                return res.status(400).json({
                    is_success: false,
                    error: "HCF input must be a non-empty array",
                });
            }

            data = value.reduce((acc, curr) => {
                if (!Number.isInteger(curr)) {
                    throw new Error("Invalid number in HCF array");
                }
                return gcd(acc, curr);
            });
        } else if (key === "AI") {
            if (typeof value !== "string" || value.trim().length === 0) {
                return res.status(400).json({
                    is_success: false,
                    error: "AI input must be a non-empty string",
                });
            }

            try {
                const response = await axios.post(
                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
                    {
                        contents: [
                            {
                                parts: [
                                    {
                                        text: `Answer in ONE WORD only. ${value}`,
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        params: { key: process.env.GEMINI_API_KEY },
                        timeout: 5000,
                    },
                );

                const text =
                    response?.data?.candidates?.[0]?.content?.parts?.[0]?.text;

                data = text ? text.trim().replace(/[^\w]/g, "") : "Unknown";
            } catch (err) {
                data = "Unknown";
            }
        } else {
            return res.status(400).json({
                is_success: false,
                error: "Invalid request key",
            });
        }

        return res.status(200).json({
            is_success: true,
            official_email: EMAIL,
            data,
        });
    } catch (err) {
        return res.status(500).json({
            is_success: false,
            error: "Internal Server Error",
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
