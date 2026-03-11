const MAX_ROUNDS = 5;
const RESULT_DELAY_MS = 3000;
const CHOICES = ["pierre", "feuille", "ciseaux"];

const choiceEmoji = {
  pierre: "🪨",
  feuille: "📄",
  ciseaux: "✂️",
};

const winMessages = [
  "Le WAF bloque l'injection SQL. L'attaquant rage quit.",
  "L'EDR stoppe le ransomware avant le chiffrement. Le CISO garde ses cheveux.",
  "Le SOC détecte le C2 en 4 minutes. Record battu.",
  "La segmentation réseau contient la brèche. Le board ne saura jamais.",
  "Le MFA résiste au phishing. L'attaquant retourne sur Telegram.",
  "Le CERT isole le poste compromis avant la latéralisation. Chirurgical.",
  "La threat intel avait prévu le vecteur. Le playbook se déroule sans accroc.",
  "Le pen test interne avait trouvé la faille avant l'attaquant. Pour une fois.",
  "Le backup restore fonctionne en 2h. Le DRP n'était pas juste un PDF.",
  "Le zero trust fait son job : l'attaquant a un accès... à rien.",
];

const loseMessages = [
  "Le VPN non patché cède. L'attaquant est admin domain en 47 minutes.",
  "Les sauvegardes étaient sur le même VLAN. Elles sont chiffrées aussi.",
  "Le stagiaire a cliqué. Le macro s'exécute. Cobalt Strike est déployé.",
  "Le mot de passe admin était Welcome2024!. Brute forcé en 3 secondes.",
  "L'attaquant exfiltre 200 Go via DNS. Personne ne monitore le DNS.",
  "La supply chain est compromise. La mise à jour contenait un backdoor.",
  "Le SIEM était en maintenance. L'alerte n'a jamais sonné.",
  "Le prestataire avait un accès VPN permanent. Et un mot de passe réutilisé.",
  "Le shadow IT a gagné : le bucket S3 public contenait les données clients.",
  "L'API exposée n'avait pas d'auth. Les données sont sur un forum depuis mardi.",
];

const drawMessages = [
  "Le SOC détecte l'intrus mais il a déjà posé sa persistence. Match nul.",
  "La vuln web est patchée mais celle du SaaS attend depuis 6 mois.",
  "L'attaquant est bloqué sur le réseau IT. Mais il a trouvé l'OT.",
  "Le ransomware est stoppé. Mais l'attaquant a déjà exfiltré les données.",
  "Le phishing est bloqué par le filtre mail. L'attaquant passe par Teams.",
  "L'accès est révoqué. Mais les autres credentials sont déjà sur le dark web.",
  "Le chiffrement protège les données au repos. En transit, c'est une autre histoire.",
  "L'audit de sécurité est passé. Mais l'auditeur n'a pas testé l'Active Directory.",
];

const playerChoiceEl = document.getElementById("playerChoice");
const cpuChoiceEl = document.getElementById("cpuChoice");
const playerScoreEl = document.getElementById("playerScore");
const cpuScoreEl = document.getElementById("cpuScore");
const drawScoreEl = document.getElementById("drawScore");
const roundCountEl = document.getElementById("roundCount");
const roundMessageEl = document.getElementById("roundMessage");
const finalMessageEl = document.getElementById("finalMessage");
const replayBtn = document.getElementById("replayBtn");
const choiceButtons = document.querySelectorAll(".choice-btn");
const bigResultEl = document.getElementById("bigResult");
const continueBtn = document.getElementById("continueBtn");
const menuDuelBtn = document.getElementById("menuDuelBtn");
const menuRulesBtn = document.getElementById("menuRulesBtn");
const menuResetBtn = document.getElementById("menuResetBtn");

const state = {
  playerScore: 0,
  cpuScore: 0,
  draws: 0,
  rounds: 0,
  resolvingRound: false,
  inFinalScreen: false,
  waitingContinue: false,
  resultTimeoutId: null,
  countdownIntervalId: null,
  pendingRound: null,
};

continueBtn.addEventListener("click", handleContinue);
replayBtn.addEventListener("click", resetGame);
menuDuelBtn.addEventListener("click", showDuelInfo);
menuRulesBtn.addEventListener("click", showRules);
menuResetBtn.addEventListener("click", resetGame);

choiceButtons.forEach((button) => {
  button.addEventListener("click", () => playRound(button.dataset.choice));
});

setMenuActive(menuDuelBtn);
showBigResult("", "");
updateScoreboard();

function playRound(playerChoice) {
  if (state.resolvingRound || state.inFinalScreen || state.waitingContinue || state.rounds >= MAX_ROUNDS) {
    return;
  }

  state.resolvingRound = true;
  disableChoiceButtons();
  continueBtn.classList.add("hidden");
  replayBtn.classList.add("hidden");
  finalMessageEl.textContent = "";

  const cpuChoice = randomChoice();
  const outcome = evaluateRound(playerChoice, cpuChoice);
  const message = pickRoundMessage(outcome);
  state.pendingRound = { outcome, playerChoice, cpuChoice, message };

  playerChoiceEl.textContent = `${capitalize(playerChoice)} ${choiceEmoji[playerChoice]}`;
  cpuChoiceEl.textContent = "Choix en cours... 🕶️";

  startCountdown();
}

function startCountdown() {
  clearRoundTimers();
  let countdown = 3;
  showCountdown(countdown);

  state.countdownIntervalId = setInterval(() => {
    countdown -= 1;
    if (countdown >= 1) {
      showCountdown(countdown);
    }
  }, 1000);

  state.resultTimeoutId = setTimeout(resolveRound, RESULT_DELAY_MS);
}

function showCountdown(value) {
  const countdownText = `${value}`;
  roundMessageEl.textContent = `Suspense: ${countdownText}...`;
  showBigResult(countdownText, "countdown");
}

function resolveRound() {
  clearRoundTimers();

  const roundData = state.pendingRound;
  if (!roundData) {
    state.resolvingRound = false;
    enableChoiceButtons();
    return;
  }

  state.pendingRound = null;
  state.rounds += 1;

  if (roundData.outcome === "win") {
    state.playerScore += 1;
  } else if (roundData.outcome === "lose") {
    state.cpuScore += 1;
  } else {
    state.draws += 1;
  }

  const playerObject = capitalize(roundData.playerChoice);
  const cpuObject = capitalize(roundData.cpuChoice);
  const outcomeLabel = outcomeToLabel(roundData.outcome);

  playerChoiceEl.textContent = `${playerObject} ${choiceEmoji[roundData.playerChoice]}`;
  cpuChoiceEl.textContent = `${cpuObject} ${choiceEmoji[roundData.cpuChoice]}`;

  roundMessageEl.textContent = `${outcomeLabel} : ${playerObject} contre ${cpuObject}. ${roundData.message}`;
  showBigResult(
    `${outcomeLabel} : ${playerObject} contre ${cpuObject}\n${roundData.message}`,
    roundData.outcome,
  );
  updateScoreboard();

  state.resolvingRound = false;

  if (state.rounds >= MAX_ROUNDS) {
    showFinalAndReset();
    return;
  }

  state.waitingContinue = true;
  continueBtn.classList.remove("hidden");
}

function handleContinue() {
  if (!state.waitingContinue || state.inFinalScreen) {
    return;
  }

  state.waitingContinue = false;
  continueBtn.classList.add("hidden");
  showBigResult("", "");
  roundMessageEl.textContent = "Choisis une icône: suspense 3, 2, 1 puis résultat.";
  enableChoiceButtons();
}

function showFinalAndReset() {
  state.inFinalScreen = true;
  state.waitingContinue = false;
  disableChoiceButtons();
  continueBtn.classList.add("hidden");
  replayBtn.classList.remove("hidden");

  let finalTitle = "";
  let finalClass = "";
  if (state.playerScore > state.cpuScore) {
    finalTitle = "Bilan: RSSI Gagne";
    finalClass = "win";
    finalMessageEl.style.color = "#8cf8b5";
    finalMessageEl.textContent =
      "Bravo, tu as su contenir l'attaque ! Rejoue pour montrer ta détermination !";
  } else if (state.playerScore < state.cpuScore) {
    finalTitle = "Bilan: Hacker Gagne";
    finalClass = "lose";
    finalMessageEl.style.color = "#ff9eaa";
    finalMessageEl.textContent = "Dommage, l'attaquant a réussi, augmente ton budget et rejoue !";
  } else {
    finalTitle = "Bilan: Égalité";
    finalClass = "draw";
    finalMessageEl.style.color = "#ffe08a";
    finalMessageEl.textContent =
      "Attaque interrompue... mais l'attaquant n'est-il pas encore présent ? Rejoue pour le savoir !";
  }

  roundMessageEl.textContent = `Score final (5 manches): RSSI ${state.playerScore} - ${state.cpuScore} DarkHood_404.`;
  showBigResult(finalTitle, finalClass);
}

function resetGame() {
  clearRoundTimers();

  state.playerScore = 0;
  state.cpuScore = 0;
  state.draws = 0;
  state.rounds = 0;
  state.resolvingRound = false;
  state.inFinalScreen = false;
  state.waitingContinue = false;
  state.pendingRound = null;

  playerChoiceEl.textContent = "-";
  cpuChoiceEl.textContent = "-";
  roundMessageEl.textContent = "Choisis une icône: suspense 3, 2, 1 puis résultat.";
  finalMessageEl.textContent = "";
  continueBtn.classList.add("hidden");
  replayBtn.classList.add("hidden");
  showBigResult("", "");
  updateScoreboard();
  enableChoiceButtons();
  setMenuActive(menuDuelBtn);
}

function showRules() {
  setMenuActive(menuRulesBtn);
  roundMessageEl.textContent =
    "Règles: Pierre bat Ciseaux, Ciseaux bat Feuille, Feuille bat Pierre. Bilan auto au bout de 5 tours.";
  showBigResult("Règles", "draw");
}

function showDuelInfo() {
  setMenuActive(menuDuelBtn);
  if (state.resolvingRound || state.inFinalScreen) {
    return;
  }
  if (state.waitingContinue) {
    roundMessageEl.textContent = "Lis le message central puis clique sur Continuer.";
    return;
  }
  roundMessageEl.textContent = "Choisis une icône: suspense 3, 2, 1 puis résultat.";
  showBigResult("", "");
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

function pickRoundMessage(outcome) {
  if (outcome === "win") {
    return randomFrom(winMessages);
  }
  if (outcome === "lose") {
    return randomFrom(loseMessages);
  }
  return randomFrom(drawMessages);
}

function outcomeToLabel(outcome) {
  if (outcome === "win") {
    return "Gagné";
  }
  if (outcome === "lose") {
    return "Perdu";
  }
  return "Égalité";
}

function updateScoreboard() {
  roundCountEl.textContent = String(state.rounds);
  playerScoreEl.textContent = String(state.playerScore);
  cpuScoreEl.textContent = String(state.cpuScore);
  drawScoreEl.textContent = String(state.draws);
}

function showBigResult(text, kind) {
  bigResultEl.classList.remove("countdown", "win", "lose", "draw", "hidden");

  if (!text) {
    bigResultEl.textContent = "";
    bigResultEl.classList.add("hidden");
    return;
  }

  bigResultEl.textContent = text;
  if (kind) {
    bigResultEl.classList.add(kind);
  }
}

function setMenuActive(activeButton) {
  [menuDuelBtn, menuRulesBtn, menuResetBtn].forEach((button) => button.classList.remove("active"));
  if (activeButton) {
    activeButton.classList.add("active");
  }
}

function clearRoundTimers() {
  if (state.resultTimeoutId) {
    clearTimeout(state.resultTimeoutId);
    state.resultTimeoutId = null;
  }
  if (state.countdownIntervalId) {
    clearInterval(state.countdownIntervalId);
    state.countdownIntervalId = null;
  }
}

function disableChoiceButtons() {
  choiceButtons.forEach((button) => {
    button.disabled = true;
  });
}

function enableChoiceButtons() {
  choiceButtons.forEach((button) => {
    button.disabled = false;
  });
}

function randomChoice() {
  return CHOICES[Math.floor(Math.random() * CHOICES.length)];
}

function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
