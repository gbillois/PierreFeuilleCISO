const MAX_ROUNDS = 10;
const CHOICES = ["pierre", "feuille", "ciseaux"];
const choiceEmoji = {
  pierre: "🪨",
  feuille: "📄",
  ciseaux: "✂️",
};

const winMessages = [
  "Le pare-feu bloque l'attaque. DarkHood rage quitte son VPN.",
  "Le phishing est neutralisé: l'e-mail finit en spam éternel.",
  "Le SOC applaudit: alerte traitée avant la pause café.",
  "Ton MFA s'active et le cybercriminel oublie son mot de passe.",
  "Le ransomware se chiffre lui-même. Belle ironie.",
  "Le botnet est redirigé vers un tuto 'Comment devenir jardinier'.",
  "Ton patch Tuesday est si propre que même les bugs saluent.",
  "Le scan de vulnérabilité affiche: 'Rien à voir, circulez'.",
  "DarkHood tente une SQLi, ton WAF répond: 'Non merci'.",
  "Le CISO gagne: la cybersécurité est servie avec cravate.",
];

const loseMessages = [
  "Le site web est piraté. Même la page 404 demande une rançon.",
  "Le mot de passe 'azerty123' fuit sur un forum obscur.",
  "Le faux support IT vient de récupérer tout l'annuaire.",
  "Un stagiaire clique sur 'Gagner un iPhone': incident majeur.",
  "DarkHood déploie un ransomware: les fichiers parlent en hiéroglyphes.",
  "Le serveur redémarre en boucle, et la cafetière aussi.",
  "Ton antivirus part en RTT au pire moment.",
  "Le firewall laisse passer l'attaque 'juste cette fois'.",
  "Un script inconnu supprime le dossier 'definitif_final_v7'.",
  "Les hackers changent la home en 'Owned by DarkHood_404'.",
];

const drawMessages = [
  "Match nul: le cybercriminel hésite, toi aussi.",
  "Égalité tactique: les deux camps rechargent le café.",
  "Nul diplomatique: personne ne clique sur le lien suspect.",
  "Zéro-day émotionnel: aucun camp ne prend l'avantage.",
  "Statu quo: la guerre cyber continue.",
];

const playerNameInput = document.getElementById("playerName");
const startBtn = document.getElementById("startBtn");
const playerTitle = document.getElementById("playerTitle");
const playerNameLabel = document.getElementById("playerNameLabel");
const playerChoiceEl = document.getElementById("playerChoice");
const cpuChoiceEl = document.getElementById("cpuChoice");
const playerScoreEl = document.getElementById("playerScore");
const cpuScoreEl = document.getElementById("cpuScore");
const drawScoreEl = document.getElementById("drawScore");
const roundCountEl = document.getElementById("roundCount");
const roundMessageEl = document.getElementById("roundMessage");
const finalMessageEl = document.getElementById("finalMessage");
const restartBtn = document.getElementById("restartBtn");
const choiceButtons = document.querySelectorAll(".choice-btn");

const state = {
  started: false,
  playerName: "RSSI",
  playerScore: 0,
  cpuScore: 0,
  draws: 0,
  rounds: 0,
};

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", resetGame);
choiceButtons.forEach((button) => {
  button.addEventListener("click", () => playRound(button.dataset.choice));
  button.disabled = true;
});

function startGame() {
  const rawName = playerNameInput.value.trim();
  state.playerName = rawName || "RSSI";
  state.started = true;
  playerTitle.textContent = `RSSI ${state.playerName}`;
  playerNameLabel.textContent = state.playerName;
  roundMessageEl.textContent = `${state.playerName}, protège le SI et choisis ton arme.`;
  startBtn.disabled = true;
  playerNameInput.disabled = true;
  choiceButtons.forEach((button) => {
    button.disabled = false;
  });
}

function playRound(playerChoice) {
  if (!state.started || state.rounds >= MAX_ROUNDS) {
    return;
  }

  const cpuChoice = randomChoice();
  state.rounds += 1;

  const outcome = evaluateRound(playerChoice, cpuChoice);
  let message = "";

  if (outcome === "win") {
    state.playerScore += 1;
    message = randomFrom(winMessages);
  } else if (outcome === "lose") {
    state.cpuScore += 1;
    message = randomFrom(loseMessages);
  } else {
    state.draws += 1;
    message = randomFrom(drawMessages);
  }

  playerChoiceEl.textContent = `${playerChoice} ${choiceEmoji[playerChoice]}`;
  cpuChoiceEl.textContent = `${cpuChoice} ${choiceEmoji[cpuChoice]}`;
  roundMessageEl.textContent = message;

  updateScoreboard();

  if (state.rounds >= MAX_ROUNDS) {
    endGame();
  }
}

function evaluateRound(player, cpu) {
  if (player === cpu) {
    return "draw";
  }

  const playerWins =
    (player === "pierre" && cpu === "ciseaux") ||
    (player === "feuille" && cpu === "pierre") ||
    (player === "ciseaux" && cpu === "feuille");

  return playerWins ? "win" : "lose";
}

function endGame() {
  choiceButtons.forEach((button) => {
    button.disabled = true;
  });
  restartBtn.classList.remove("hidden");

  if (state.playerScore > state.cpuScore) {
    finalMessageEl.style.color = "#0f6d3a";
    finalMessageEl.textContent = `Victoire finale de ${state.playerName}: le RSSI sauve l'entreprise.`;
  } else if (state.playerScore < state.cpuScore) {
    finalMessageEl.style.color = "#9e1f1f";
    finalMessageEl.textContent = `Défaite... DarkHood_404 publie vos memes internes.`;
  } else {
    finalMessageEl.style.color = "#745800";
    finalMessageEl.textContent = "Égalité générale: comité de crise + viennoiseries obligatoires.";
  }
}

function resetGame() {
  state.started = false;
  state.playerName = "RSSI";
  state.playerScore = 0;
  state.cpuScore = 0;
  state.draws = 0;
  state.rounds = 0;

  playerChoiceEl.textContent = "-";
  cpuChoiceEl.textContent = "-";
  roundMessageEl.textContent = "Entre ton prénom puis choisis une arme de cybersécurité.";
  finalMessageEl.textContent = "";
  restartBtn.classList.add("hidden");

  playerNameInput.value = "";
  playerNameInput.disabled = false;
  startBtn.disabled = false;
  playerTitle.textContent = "RSSI";
  playerNameLabel.textContent = "Toi";
  updateScoreboard();
}

function updateScoreboard() {
  roundCountEl.textContent = String(state.rounds);
  playerScoreEl.textContent = String(state.playerScore);
  cpuScoreEl.textContent = String(state.cpuScore);
  drawScoreEl.textContent = String(state.draws);
}

function randomChoice() {
  return CHOICES[Math.floor(Math.random() * CHOICES.length)];
}

function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}
