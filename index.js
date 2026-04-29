const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const PLAYTESTER_ROLE_ID = process.env.PLAYTESTER_ROLE_ID;
const API_SECRET = process.env.API_SECRET;

app.get("/check/:robloxId", async (req, res) => {
    if (req.headers["x-api-secret"] !== API_SECRET) {
        return res.status(403).json({ error: "Forbidden" });
    }

    const robloxId = req.params.robloxId;

    try {
        // Step 1: Get Discord ID from RoVer
        const roverRes = await fetch(
            `https://registry.rover.link/api/guilds/${GUILD_ID}/roblox-to-discord/${robloxId}`
        );
        if (!roverRes.ok) {
            return res.json({ hasPlaytester: false, reason: "Not verified with RoVer" });
        }
        const roverData = await roverRes.json();
        const discordId = roverData.discordId;

        // Step 2: Check Discord role
        const discordRes = await fetch(
            `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}`,
            { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } }
        );
        if (!discordRes.ok) {
            return res.json({ hasPlaytester: false, reason: "Could not fetch Discord member" });
        }
        const member = await discordRes.json();
        const hasPlaytester = member.roles.includes(PLAYTESTER_ROLE_ID);

        return res.json({ hasPlaytester });

    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
