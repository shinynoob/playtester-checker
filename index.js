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
    console.log(`[CHECK] Roblox ID: ${robloxId}`);

    try {
        // Step 1: Get Discord ID from RoVer
        const roverUrl = `https://registry.rover.link/api/guilds/${GUILD_ID}/roblox-to-discord/${robloxId}`;
        console.log(`[ROVER] Calling: ${roverUrl}`);
        const roverRes = await fetch(roverUrl);
        const roverText = await roverRes.text();
        console.log(`[ROVER] Status: ${roverRes.status} | Body: ${roverText}`);

        if (!roverRes.ok) {
            return res.json({ hasPlaytester: false, reason: "Not verified with RoVer" });
        }

        const roverData = JSON.parse(roverText);
        const discordId = roverData.discordId;
        console.log(`[ROVER] Discord ID found: ${discordId}`);

        // Step 2: Check Discord role
        const discordUrl = `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}`;
        console.log(`[DISCORD] Calling: ${discordUrl}`);
        const discordRes = await fetch(discordUrl, {
            headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` }
        });
        const discordText = await discordRes.text();
        console.log(`[DISCORD] Status: ${discordRes.status} | Body: ${discordText}`);

        if (!discordRes.ok) {
            return res.json({ hasPlaytester: false, reason: "Could not fetch Discord member" });
        }

        const member = JSON.parse(discordText);
        const hasPlaytester = member.roles.includes(PLAYTESTER_ROLE_ID);
        console.log(`[DISCORD] Roles: ${member.roles} | Has Playtester: ${hasPlaytester}`);

        return res.json({ hasPlaytester });

    } catch (e) {
        console.error(`[ERROR] ${e.message}`);
        return res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
