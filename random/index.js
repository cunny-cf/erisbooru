const express = require("express");
const router = express.Router();
const booru = require("booru");

// Blacklist tags
const defaultBlacklist = [
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

// Route for /random
router.get("/", async (req, res) => {
  const source = booru.forSite("rule34");

  try {
    let blacklist = [...defaultBlacklist];

    // Add "video" tag to blacklist if ?video=true is present in URL
    if (req.query.video === "true") {
      blacklist.push("video");
    }

    // Search for a random image with the specified tags and excluding the blacklist
    const posts = await source.search(blacklist, {
      limit: 1,
      random: true,
    });

    if (posts.length > 0) {
      const imageUrl = posts[0].fileUrl;
      // Determine if it's an image or video based on URL and query parameter
      const isVideo = imageUrl.endsWith(".mp4");

      let mediaTag;
      if (isVideo) {
        mediaTag = `<video id="blurredImage" controls autoplay>
                        <source src="${imageUrl}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>`;
      } else {
        mediaTag = `<img id="blurredImage" src="${imageUrl}" alt="Random NSFW Image">`;
      }

      // Serve the image or video in HTML
      res.send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Eris Random</title>
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
              
              console.log("${posts[0].tags.toString()}");
              console.log("${posts[0].postView}")
          </script>
          </head>
          <body>
              <div id="imageContainer">
                  ${mediaTag}
              </div>
          </body>
          </html>
      `);
    } else {
      // If no posts were found, send a message
      res.send("Nothing found");
    }
  } catch (error) {
    // If an error occurs, send an error message
    console.error("Error fetching random image:", error);
    res.status(500).send("There was an error :D");
  }
});

module.exports = router;
