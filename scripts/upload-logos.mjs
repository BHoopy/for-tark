
import { v2 as cloudinary } from "cloudinary";
import { promises as fs } from "fs";
import path from "path";
import { config } from "dotenv";

// Load environment variables from .env file
config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const teamsJsonPath = path.resolve(process.cwd(), "src/lib/teams.json");

async function uploadLogos() {
  try {
    // Read the JSON file
    const data = await fs.readFile(teamsJsonPath, "utf-8");
    const teams = JSON.parse(data);

    console.log(`Found ${teams.length} teams. Starting logo upload process...`);

    const updatedTeams = [];

    for (const team of teams) {
      if (!team.logo || !team.name) {
        console.warn(`Skipping team due to missing logo or name: ${JSON.stringify(team)}`);
        updatedTeams.push(team);
        continue;
      }

      // Create a clean public_id from the team name
      const publicId = team.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');

      try {
        console.log(`Uploading logo for ${team.name}...`);
        const result = await cloudinary.uploader.upload(team.logo, {
          folder: "team_logos",
          public_id: publicId,
          overwrite: true,
          resource_type: "image",
        });

        updatedTeams.push({
          ...team,
          logo: result.secure_url,
        });

        console.log(`✅ Successfully uploaded and updated URL for ${team.name}`);
      } catch (uploadError) {
        console.error(`❌ Failed to upload logo for ${team.name}:`, uploadError.message);
        // Keep the original team data if upload fails
        updatedTeams.push(team);
      }
    }

    // Write the updated data back to the JSON file
    await fs.writeFile(teamsJsonPath, JSON.stringify(updatedTeams, null, 2));

    console.log("\n📁 Done. `src/lib/teams.json` has been updated with Cloudinary URLs.");
  } catch (error) {
    console.error("An error occurred during the script execution:", error);
  }
}

uploadLogos();

    