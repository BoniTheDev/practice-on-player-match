const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

app.listen(3000, () => {
  console.log("Server is running at http://localhost:3000");
});

let database = null;
const intializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  } catch (e) {
    console.log(`DB Eroor: ${e.message}`);
    process.exit(1);
  }
};
intializeDbAndServer();

const eachPlayerDbIntoStateResponse = (eachPlayerDb) => {
  return {
    playerId: eachPlayerDb.player_id,
    playerName: eachPlayerDb.player_name,
  };
};

// Get Players API

app.get("/players/", async (request, response) => {
  const getPlayersDetailsQuery = `
                             SELECT 
                               * 
                            FROM 
                               player_details;`;

  const getPlayersArray = await database.all(getPlayersDetailsQuery);
  response.send(
    getPlayersArray.map((eachPlayerDb) =>
      eachPlayerDbIntoStateResponse(eachPlayerDb)
    )
  );
});

// Get A Player API

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getAPlayerDetailsQuery = `
                             SELECT 
                               * 
                            FROM 
                               player_details
                            WHERE 
                              player_id = ${playerId};`;

  const getPlayerDetails = await database.get(getAPlayerDetailsQuery);
  response.send(eachPlayerDbIntoStateResponse(getPlayerDetails));
});

// Update a player

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  //console.log(playerId);
  //console.log(playerName);
  const updatePlayerQuery = `
                              UPDATE
                                 player_details
                              SET 
                                player_name='${playerName}'
                              WHERE 
                                 player_id = '${playerId}';`;
  const updatePlayer = await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

// Get Match by Id API

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getAMatchQuery = `
                          SELECT 
                             match_id AS matchId,
                             match,
                             year     
                          FROM 
                             match_details
                          WHERE 
                             match_id = ${matchId};`;
  const getMatchByIdDb = await database.get(getAMatchQuery);

  response.send(getMatchByIdDb);
});

//Get matches by PlayerId API
const convertgetMatchByIddbintoResponse = (playerEachMatch) => {
  return {
    matchId: playerEachMatch.match_id,
    match: playerEachMatch.match,
    year: playerEachMatch.year,
  };
};

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `
                          SELECT
      *
    FROM player_match_score 
      NATURAL JOIN match_details
    WHERE
      player_id = ${playerId};`;

  const getMatchesDb = await database.all(getMatchesQuery);

  response.send(
    getMatchesDb.map((playerEachMatch) =>
      convertgetMatchByIddbintoResponse(playerEachMatch)
    )
  );
});

// Get Players of match API

const convertPlayerDbObjectToResponseObject = (eachPlayer) => {
  return {
    playerId: eachPlayer.player_id,
    playerName: eachPlayer.player_name,
  };
};

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT
      *
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      match_id = ${matchId};`;
  const playersArray = await database.all(getMatchPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

// Get PlayerScores API

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getmatchPlayersQuery = `
    SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const playersMatchDetails = await database.get(getmatchPlayersQuery);
  response.send(playersMatchDetails);
});

module.exports = app;
