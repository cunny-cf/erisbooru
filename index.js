const express = require("express");
const fs = require("fs");
const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
} = require("discord.js");

const Booru = require("booru");
const ytdl = require("ytdl-core");
require("dotenv").config();

const app = express();

// Serve static files from the current directory
app.use(express.static(__dirname));

app.use('/random', require('./random'));

// Route for serving the HTML file
app.get("/", (req, res) => {
  // Read the JSON file
  fs.readFile("searches.json", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error reading JSON file");
    }

    try {
      // Parse JSON data
      const jsonData = JSON.parse(data);
      // Randomly select an image URL
      const randomIndex = Math.floor(Math.random() * jsonData.length);
      const imageUrl = jsonData[randomIndex].sentMessage;
      
      // Determine if it's an image or video
      const isVideo = imageUrl.endsWith(".mp4");

      // Send HTML file with dynamic image or video source
      let mediaTag;
      if (isVideo) {
        mediaTag = `<video id="blurredImage" controls autoplay>
                        <source src="${imageUrl}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>`;
      } else {
        mediaTag = `<img id="blurredImage" src="${imageUrl}" alt="Random NSFW Image">`;
      }

      res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Eris Logs</title>
                    <link rel="icon" type="image/x-icon" href="https://cdn.glitch.global/630b284d-f283-411d-ad09-7d0c85f7ab58/eris.png">
                    <style>
                      body {
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          height: 100vh;
                          margin: 0;
                          padding: 0;
                          background-color: #101010;
                      }

                      #imageContainer {
                          position: relative;
                          display: inline-block;
                          overflow: hidden;
                          cursor: pointer;
                      }

                      #blurredImage {
                          filter: blur(10px);
                          transition: filter 0.3s ease-in-out;
                          max-width: 100vw;
                          max-height: 100vh;
                          width: auto;
                          height: auto;
                      }

                      #blurredImage:hover {
                          filter: blur(0);
                      }
                  </style>
                  <script>
                      console.log("${jsonData[randomIndex].postTags}");
                  </script>
                </head>
                <body>
                    <div id="imageContainer">
                        ${mediaTag}
                    </div>
                </body>
                </html>
            `);
    } catch (parseError) {
      console.error(parseError);
      res.status(500).send("Error parsing JSON data");
    }
  });
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const allIntents = Object.keys(GatewayIntentBits).map(
  (intent) => GatewayIntentBits[intent]
);
const client = new Client({ intents: allIntents });

const queue = new Map();

client.once("ready", async () => {
  console.log("Loaded Horny module");
  console.log("Loading Music module");

  client.user.setActivity("Nekopara", { type: "WATCHING" });

  const commands = [
    {
      name: "horny",
      description: "Get a random NSFW image from Rule34.",
      options: [
        {
          name: "tags",
          type: 3, // Update the type to 3 for STRING
          description: "Tags for image search (comma-separated)",
          required: true,
        },
      ],
    },
    {
      name: "blacklist",
      description: "Shows all the blacklisted tags.",
    },
  ];

  try {
    await client.application?.commands.set(commands);
    console.log("Slash commands registered successfully!");
  } catch (error) {
    console.error("Error registering slash commands:", error);
  }
});

function saveLogsToJSON(logs) {
  const existingLogs = fs.existsSync("searches.json")
    ? JSON.parse(fs.readFileSync("searches.json"))
    : [];
  const updatedLogs = [...existingLogs, ...logs];

  fs.writeFileSync("searches.json", JSON.stringify(updatedLogs, null, 2));
  console.log("Logs saved to searches.json");
}

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const commandName = interaction.commandName;
  const options = interaction.options;

  const blacklist = [
    "-furry",
    "-yaoi",
    "-hyper",
    "-anthro",
    "-warewolf",
    "-futanari",
    "-knot",
    "-koikatsu",
    // "-tagme",
    "-scat",
    "-soiling",
    "-zoophilia",
    "-dickgirl",
    "-pregnant",
    "-roblox",
    "-gay",
    "-male_only",
    "-blp",
    "-dickinoatmeal",
    "-taratabong",
  ];

  if (commandName === "horny") {
    if (!interaction.channel.nsfw) {
      await interaction.reply({
        content: "This command can only be used in NSFW channels.",
        ephemeral: true,
      });
      return;
    }

    const tags = options.getString("tags").replace(/\s/g, "_").split(",");

    const source = Booru.forSite("rule34");

    try {
      const post = await source.search([...(tags || "all"), ...blacklist], {
        limit: 1,
        random: true,
      });
      if (!post[0]) {
        const erremb = {
          title: "Error",
          description: `Could not find what you are looking for using ***${tags.toString()}***`,
          image: {
            url: "https://c.tenor.com/-xuKnB-PB_QAAAAC/loli-remorseful.gif",
          },
          footer: { text: "Source:Rule34>>ID:None/Error" },
        };
        await interaction.reply({ embeds: [erremb], ephemeral: true });
      } else {
        console.log(
          `User Info: ID:${interaction.user.id}, Username:${interaction.user.username}, Display Name:${interaction.user.globalName}`
        );
        console.log("Tags Searched:", tags.toString());
        console.log("Sent Message:", post[0].fileUrl);
        console.log("Source:", post[0].postView.toString());

        app.set("imageResult", post[0].fileUrl);

        const fileSauce = post[0].postView.toString();

        const sourceLink = new ButtonBuilder()
          .setLabel("Sauce")
          .setStyle(ButtonStyle.Link)
          .setURL(`${fileSauce}`);

        const hornyAgain = new ButtonBuilder()
          .setCustomId("broGotHorny")
          .setLabel("Again?")
          .setStyle(ButtonStyle.Primary);

        const bbtns = new ActionRowBuilder().addComponents(
          hornyAgain,
          sourceLink
        );

        await interaction.reply({
          content: `${post[0].fileUrl}`,
          components: [bbtns],
        });

        const userLogs = {
          timestamp: new Date().toISOString(),
          userId: interaction.user.id,
          username: interaction.user.username,
          displayName: interaction.user.globalName,
          tagsSearched: tags.toString(),
          sentMessage: post[0].fileUrl,
          postTags: post[0].tags.toString(),
        };

        // Save logs to "searches.json"
        saveLogsToJSON([userLogs]);
      }
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "An error occurred while processing your request.",
        ephemeral: true,
      });
    }
  } else if (commandName === "blacklist") {
    if (!interaction.channel.nsfw) {
      await interaction.reply({
        content: "This command can only be used in NSFW channels.",
        ephemeral: true,
      });
      return;
    }
    const blacklists = {
      title: "Blacklisted Tags",
      description: `***${blacklist.map((item) => item.replace(/-/g, " "))}***`,
      image: { url: "https://c.tenor.com/DuQjcXxX1pMAAAAd/tenor.gif" },
    };
    await interaction.reply({ embeds: [blacklists], ephemeral: true });
    return;
  }
})


client.login(process.env.token)
