const { axios } = require('./index');

async function increasePlayerDamage(playerId, damage) {
  const numericDamage = damage;
  try {
    // Include playerId and damage in the URL parameters
    const expectedOrigin = "tw-editor://.";
    axios.post(
      `https://liquemgames-api.netlify.app/increaseplayerdamage/${playerId}/${damage}`,
      null,
      {
        headers: {
          Origin: expectedOrigin,
        },
      },
    );
  } catch (error) {
    console.error("Error updating damage in the database:", error);
  }
}

async function increasePlayerKills(playerId, kills) {
  try {
    // Include playerId and damage in the URL parameters
    const expectedOrigin = "tw-editor://.";
    axios.post(
      `https://liquemgames-api.netlify.app/increaseplayerkills/${playerId}/${kills}`,
      null,
      {
        headers: {
          Origin: expectedOrigin,
        },
      },
    );
  } catch (error) {
    console.error("Error updating damage in the database:", error);
  }
}

async function increasePlayerWins(playerId, wins) {
  try {
    // Include playerId and damage in the URL parameters
    const expectedOrigin = "tw-editor://.";
    axios.post(
      `https://liquemgames-api.netlify.app/increaseplayerwins/${playerId}/${wins}`,
      null,
      {
        headers: {
          Origin: expectedOrigin,
        },
      },
    );
  } catch (error) {
    console.error("Error updating damage in the database:", error);
  }
}

async function increasePlayerPlace(playerId, place) {
  const numericplace = place;
  try {
    // Include playerId and damage in the URL parameters
    const expectedOrigin = "tw-editor://.";
    axios.post(
      `https://liquemgames-api.netlify.app/updateplayerplace/${playerId}/${place}`,
      null,
      {
        headers: {
          Origin: expectedOrigin,
        },
      },
    );
  } catch (error) {
    console.error("Error updating damage in the database:", error);
  }
}


module.exports = {
  increasePlayerDamage,
  increasePlayerKills,
  increasePlayerPlace,
  increasePlayerWins,

};