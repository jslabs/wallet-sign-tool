import express from "express";
import { ethers } from "ethers";

const app = express();

app.use(express.json());
app.use(express.static("."));

app.post("/sign", (req, res) => {
    try {
        const {
            account,
            messageHash,
            signature,
            nonce
        } = req.body;

        if (!account || !messageHash || !signature || !nonce) {
            return res.json({
                ok: false,
                error: "missing_fields"
            });
        }

        const recovered = ethers.verifyMessage(
            ethers.getBytes(messageHash),
            signature
        );

        const valid = recovered.toLowerCase() === account.toLowerCase();

        return res.json({
            ok: true,
            valid,
            recovered,
            nonce
        });

    } catch (err) {
        return res.json({
            ok: false,
            error: err.message
        });
    }
});

app.listen(8000, () => {
    console.log("http://localhost:8000/");
});
