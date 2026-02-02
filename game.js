// Elementos DOM
const gameArea = document.getElementById("game-area");
const target = document.getElementById("target");
const scoreDisplay = document.getElementById("score");
const levelDisplay = document.getElementById("level");
const comboDisplay = document.getElementById("combo");
const countdownDisplay = document.getElementById("countdown");
const clickSound = document.getElementById("click-sound");
const errorSound = document.getElementById("error-sound");
const levelupSound = document.getElementById("levelup-sound");
const comboSound = document.getElementById("combo-sound");

// Menús y overlays
const mainMenu = document.getElementById("main-menu");
const gameHud = document.getElementById("game-hud");
const tutorialOverlay = document.getElementById("tutorial-overlay");
const pauseOverlay = document.getElementById("pause-overlay");
const gameoverOverlay = document.getElementById("gameover-overlay");
const difficultySelect = document.getElementById("difficulty-menu");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");

// Variables globales
let score = 0;
let level = 1;
let combo = 1;
let maxCombo = 1;
let lastClickTime = 0;
let targetsHitThisLevel = 0;
let targetsPerLevel = 5;
let timeLimit;
let targetSize;
let baseTimeLimit;
let baseTargetSize;
let baseFakeTargetProbability;
let fakeTargets = [];
let extraTargets = [];
let gameInterval;
let gameRunning = false;
let gamePaused = false;
let peacefulMode = false;
let movingTarget = false;
let shrinkingTarget = false;
let multipleTargets = false;

// Estadísticas guardadas
let stats = {
  bestScore: 0,
  bestLevel: 1,
  gamesPlayed: 0
};

// Cargar estadísticas al iniciar
loadStats();

// Event listeners del menú
document.getElementById("play-btn").addEventListener("click", startGame);
document.getElementById("tutorial-btn").addEventListener("click", showTutorial);
document.getElementById("close-tutorial").addEventListener("click", hideTutorial);
document.getElementById("reset-btn").addEventListener("click", resetStats);
document.getElementById("pause-btn").addEventListener("click", pauseGame);
document.getElementById("resume-btn").addEventListener("click", resumeGame);
document.getElementById("restart-btn").addEventListener("click", restartGame);
document.getElementById("quit-btn").addEventListener("click", quitToMenu);
document.getElementById("retry-btn").addEventListener("click", restartGame);
document.getElementById("menu-btn").addEventListener("click", quitToMenu);

// Tecla ESC para pausar
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && gameRunning && !gamePaused) {
    pauseGame();
  } else if (e.key === "Escape" && gamePaused) {
    resumeGame();
  }
});

function loadStats() {
  const saved = localStorage.getItem("targetFrenzyStats");
  if (saved) {
    stats = JSON.parse(saved);
  }
  updateStatsDisplay();
}

function saveStats() {
  localStorage.setItem("targetFrenzyStats", JSON.stringify(stats));
  updateStatsDisplay();
}

function updateStatsDisplay() {
  document.getElementById("best-score").textContent = stats.bestScore;
  document.getElementById("best-level").textContent = stats.bestLevel;
  document.getElementById("games-played").textContent = stats.gamesPlayed;
}

function resetStats() {
  if (confirm("¿Estás seguro de que quieres borrar todas las estadísticas?")) {
    stats = { bestScore: 0, bestLevel: 1, gamesPlayed: 0 };
    saveStats();
  }
}

function showTutorial() {
  tutorialOverlay.classList.remove("hidden");
}

function hideTutorial() {
  tutorialOverlay.classList.add("hidden");
}

function pauseGame() {
  if (!gameRunning) return;
  gamePaused = true;
  clearInterval(gameInterval);
  if (movingInterval) clearInterval(movingInterval);
  if (shrinkInterval) clearInterval(shrinkInterval);
  pauseOverlay.classList.remove("hidden");
}

function resumeGame() {
  gamePaused = false;
  pauseOverlay.classList.add("hidden");
  gameInterval = setInterval(updateGame, timeLimit);
  if (movingTarget) startMovingTarget();
  if (shrinkingTarget) startShrinkingTarget();
}

function restartGame() {
  gameoverOverlay.classList.add("hidden");
  pauseOverlay.classList.add("hidden");
  cleanupGame();
  startGame();
}

function quitToMenu() {
  gameoverOverlay.classList.add("hidden");
  pauseOverlay.classList.add("hidden");
  cleanupGame();
  gameArea.classList.add("hidden");
  gameHud.classList.add("hidden");
  mainMenu.classList.remove("hidden");
}

function cleanupGame() {
  gameRunning = false;
  gamePaused = false;
  clearInterval(gameInterval);
  if (movingInterval) clearInterval(movingInterval);
  if (shrinkInterval) clearInterval(shrinkInterval);
  fakeTargets.forEach(ft => ft.remove());
  fakeTargets = [];
  extraTargets.forEach(et => et.remove());
  extraTargets = [];
  target.style.visibility = "hidden";
}

// Iniciar el juego
function startGame() {
  mainMenu.classList.add("hidden");
  gameArea.classList.remove("hidden");
  gameHud.classList.remove("hidden");

  const difficulty = difficultySelect.value;
  configureDifficulty(difficulty);

  // Reiniciar variables
  level = 1;
  score = 0;
  combo = 1;
  maxCombo = 1;
  targetsHitThisLevel = 0;
  updateLevelDisplay();
  updateComboDisplay();
  updateProgressBar();

  // Restablecer el tamaño del área de juego
  gameArea.style.width = "60vw";
  gameArea.style.height = "70vh";

  // Mostrar el contador antes de iniciar el juego
  startCountdown(3);
}

function configureDifficulty(difficulty) {
  switch (difficulty) {
    case "easy":
      baseTimeLimit = 3000;
      baseTargetSize = 70;
      baseFakeTargetProbability = 0.15;
      backgroundChangeRate = 0.02;
      peacefulMode = false;
      targetsPerLevel = 6;
      break;
    case "medium":
      baseTimeLimit = 2000;
      baseTargetSize = 50;
      baseFakeTargetProbability = 0.3;
      backgroundChangeRate = 0.15;
      peacefulMode = false;
      targetsPerLevel = 5;
      break;
    case "hard":
      baseTimeLimit = 1200;
      baseTargetSize = 38;
      baseFakeTargetProbability = 0.5;
      backgroundChangeRate = 0.3;
      peacefulMode = false;
      targetsPerLevel = 4;
      break;
    case "nightmare":
      baseTimeLimit = 800;
      baseTargetSize = 30;
      baseFakeTargetProbability = 0.7;
      backgroundChangeRate = 0.5;
      peacefulMode = false;
      targetsPerLevel = 3;
      break;
    case "peaceful":
      peacefulMode = true;
      baseTimeLimit = 5000;
      baseTargetSize = 90;
      baseFakeTargetProbability = 0.0;
      backgroundChangeRate = 0.0;
      targetsPerLevel = 999999;
      break;
    default:
      baseTimeLimit = 2000;
      baseTargetSize = 50;
      baseFakeTargetProbability = 0.3;
      backgroundChangeRate = 0.15;
      peacefulMode = false;
      targetsPerLevel = 5;
      break;
  }
  timeLimit = baseTimeLimit;
  targetSize = baseTargetSize;
  fakeTargetProbability = baseFakeTargetProbability;
  movingTarget = false;
  shrinkingTarget = false;
  multipleTargets = false;
}

function startCountdown(seconds) {
  countdownDisplay.textContent = seconds;
  countdownDisplay.style.opacity = 1;

  let countdown = seconds;
  const countdownInterval = setInterval(() => {
    countdown--;
    countdownDisplay.textContent = countdown;

    if (countdown === 0) {
      clearInterval(countdownInterval);
      countdownDisplay.style.opacity = 0;
      beginGame();
    }
  }, 1000);
}

// Lógica del juego
function beginGame() {
  score = 0;
  gameRunning = true;
  gamePaused = false;
  stats.gamesPlayed++;
  saveStats();
  
  scoreDisplay.textContent = `Score: ${score}`;
  target.style.visibility = "visible";

  moveTarget();

  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(updateGame, timeLimit);
}

function updateGame() {
  if (!gameRunning || peacefulMode || gamePaused) return;

  // Aplicar dificultad del nivel actual
  applyLevelDifficulty();

  // Redimensionar la área de juego gradualmente conforme sube el nivel
  const newWidth = Math.min(90, 60 + (level * 2));
  const newHeight = Math.min(85, 70 + (level * 1));

  gameArea.style.width = `${newWidth}vw`;
  gameArea.style.height = `${newHeight}vh`;

  // Condición de victoria (nivel 15)
  if (level >= 15) {
    showVictory();
    return;
  }

  moveTarget();
  if (Math.random() < fakeTargetProbability) spawnFakeTargets();
  
  // Múltiples objetivos a partir del nivel 10
  if (multipleTargets && Math.random() < 0.3) {
    spawnExtraTarget();
  }
}

// Sistema de niveles progresivos
function applyLevelDifficulty() {
  // Reducir tiempo límite progresivamente (mínimo 300ms)
  timeLimit = Math.max(300, baseTimeLimit - (level - 1) * 120);
  
  // Reducir tamaño del objetivo progresivamente (mínimo 15px)
  targetSize = Math.max(15, baseTargetSize - (level - 1) * 3);
  
  // Aumentar probabilidad de objetivos falsos
  fakeTargetProbability = Math.min(0.9, baseFakeTargetProbability + (level - 1) * 0.06);
  
  // Activar movimiento del objetivo a partir del nivel 3
  movingTarget = level >= 3;
  
  // Activar encogimiento del objetivo a partir del nivel 6
  shrinkingTarget = level >= 6;
  
  // Activar múltiples objetivos a partir del nivel 8
  multipleTargets = level >= 8;
  
  // Reiniciar el intervalo con el nuevo timeLimit
  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(updateGame, timeLimit);
}

function levelUp() {
  level++;
  targetsHitThisLevel = 0;
  updateLevelDisplay();
  updateProgressBar();
  
  // Sonido de subida de nivel
  if (levelupSound) levelupSound.play();
  
  // Mostrar notificación de nivel
  showLevelUpNotification();
  
  // Limpiar objetivos falsos y extras al subir de nivel
  fakeTargets.forEach(ft => ft.remove());
  fakeTargets = [];
  extraTargets.forEach(et => et.remove());
  extraTargets = [];
}

function updateLevelDisplay() {
  if (levelDisplay) {
    levelDisplay.textContent = `Nivel: ${level}`;
  }
}

function updateComboDisplay() {
  if (comboDisplay) {
    comboDisplay.textContent = `Combo: x${combo}`;
    comboDisplay.style.color = combo >= 5 ? '#ff0' : combo >= 3 ? '#0f0' : '#fff';
  }
}

function updateProgressBar() {
  const progress = (targetsHitThisLevel / targetsPerLevel) * 100;
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }
  if (progressText) {
    progressText.textContent = `${targetsHitThisLevel}/${targetsPerLevel}`;
  }
}

function showLevelUpNotification() {
  const notification = document.createElement('div');
  notification.className = 'level-up-notification';
  notification.textContent = `¡NIVEL ${level}!`;
  gameArea.appendChild(notification);
  
  setTimeout(() => notification.remove(), 1500);
}

function moveTarget() {
  const maxX = gameArea.clientWidth - targetSize;
  const maxY = gameArea.clientHeight - targetSize;

  const x = Math.random() * maxX;
  const y = Math.random() * maxY;

  target.style.left = `${x}px`;
  target.style.top = `${y}px`;
  target.style.width = `${targetSize}px`;
  target.style.height = `${targetSize}px`;

  const scale = 1 + Math.random() * 0.2;
  target.style.transform = `scale(${scale})`;
  target.style.transition = "all 0.5s ease-in-out";

  // Movimiento errático si está activado (nivel 5+)
  if (movingTarget && gameRunning) {
    startMovingTarget();
  }

  // Encogimiento progresivo si está activado (nivel 8+)
  if (shrinkingTarget && gameRunning) {
    startShrinkingTarget();
  }

  setTimeout(() => {
    if (!target.classList.contains("clicked") && !peacefulMode) {
      if (!peacefulMode) {
        score -= 1;
      }
      updateScore();
    }
    target.classList.remove("clicked");
  }, timeLimit);
}

let movingInterval = null;
function startMovingTarget() {
  if (movingInterval) clearInterval(movingInterval);
  
  const moveFrequency = Math.max(150, 500 - (level * 25));
  
  movingInterval = setInterval(() => {
    if (!gameRunning || target.classList.contains("clicked")) {
      clearInterval(movingInterval);
      return;
    }
    
    const currentLeft = parseFloat(target.style.left) || 0;
    const currentTop = parseFloat(target.style.top) || 0;
    const moveAmount = 40 + (level * 8);
    
    const newX = Math.max(0, Math.min(gameArea.clientWidth - targetSize, 
      currentLeft + (Math.random() - 0.5) * moveAmount * 2));
    const newY = Math.max(0, Math.min(gameArea.clientHeight - targetSize, 
      currentTop + (Math.random() - 0.5) * moveAmount * 2));
    
    target.style.left = `${newX}px`;
    target.style.top = `${newY}px`;
  }, moveFrequency);
}

let shrinkInterval = null;
function startShrinkingTarget() {
  if (shrinkInterval) clearInterval(shrinkInterval);
  
  let currentSize = targetSize;
  const shrinkRate = 80;
  const shrinkAmount = 3 + Math.floor(level / 2);
  
  shrinkInterval = setInterval(() => {
    if (!gameRunning || target.classList.contains("clicked")) {
      clearInterval(shrinkInterval);
      return;
    }
    
    currentSize = Math.max(12, currentSize - shrinkAmount);
    target.style.width = `${currentSize}px`;
    target.style.height = `${currentSize}px`;
  }, shrinkRate);
}

function spawnFakeTargets() {
  if (fakeTargets.length >= 3) return;

  const fakeCount = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < fakeCount; i++) {
    const fakeTarget = createFakeTarget();
    fakeTargets.push(fakeTarget);
    setTimeout(() => fakeTarget.remove(), timeLimit * Math.random());  // Desaparición aleatoria
  }
}

function createFakeTarget() {
  const fakeTarget = document.createElement("div");
  fakeTarget.className = "fake-target";

  // Generamos posiciones aleatorias dentro del área del juego
  const x = Math.random() * (gameArea.clientWidth - targetSize);
  const y = Math.random() * (gameArea.clientHeight - targetSize);

  fakeTarget.style.left = `${x}px`;
  fakeTarget.style.top = `${y}px`;
  fakeTarget.style.width = `${targetSize}px`;
  fakeTarget.style.height = `${targetSize}px`;

  // Efectos visuales aleatorios para hacerlo más difícil de identificar
  fakeTarget.style.backgroundColor = getRandomColor();  // Color aleatorio
  fakeTarget.style.borderRadius = Math.random() > 0.5 ? '50%' : '0%'; // Redondo o cuadrado aleatorio
  fakeTarget.style.transition = "transform 0.5s ease, opacity 0.3s ease";  // Transiciones suaves

  // Animación de parpadeo para que no sea predecible
  fakeTarget.style.animation = `fake-blink ${Math.random() * 2 + 1}s infinite alternate ease-in-out`;

  fakeTarget.addEventListener("click", () => {
    score -= 3;
    combo = 1; // Romper combo
    updateComboDisplay();
    errorSound.play();
    updateScore();
    fakeTarget.style.animation = "none";
    fakeTarget.style.transform = "scale(1.2)";
    fakeTarget.style.opacity = 0;
    setTimeout(() => fakeTarget.remove(), 200);
  });

  gameArea.appendChild(fakeTarget);
  return fakeTarget;
}

// Función para generar un color aleatorio
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function updateScore() {
  if (score < 0) {
    // Game Over si el score llega a negativo
    showGameOver();
    return;
  }
  scoreDisplay.textContent = `Score: ${score}`;
}

function showVictory() {
  gameRunning = false;
  clearInterval(gameInterval);
  if (movingInterval) clearInterval(movingInterval);
  if (shrinkInterval) clearInterval(shrinkInterval);
  
  // Actualizar récords
  const isNewRecord = updateRecords();
  
  document.getElementById("gameover-title").textContent = "¡VICTORIA!";
  document.getElementById("final-score").textContent = score;
  document.getElementById("final-level").textContent = level;
  document.getElementById("new-record").classList.toggle("hidden", !isNewRecord);
  
  gameoverOverlay.classList.remove("hidden");
}

function showGameOver() {
  gameRunning = false;
  clearInterval(gameInterval);
  if (movingInterval) clearInterval(movingInterval);
  if (shrinkInterval) clearInterval(shrinkInterval);
  target.style.visibility = "hidden";
  
  // Actualizar récords
  const isNewRecord = updateRecords();
  
  document.getElementById("gameover-title").textContent = "GAME OVER";
  document.getElementById("final-score").textContent = score;
  document.getElementById("final-level").textContent = level;
  document.getElementById("new-record").classList.toggle("hidden", !isNewRecord);
  
  gameoverOverlay.classList.remove("hidden");
}

function updateRecords() {
  let isNewRecord = false;
  
  if (score > stats.bestScore) {
    stats.bestScore = score;
    isNewRecord = true;
  }
  if (level > stats.bestLevel) {
    stats.bestLevel = level;
    isNewRecord = true;
  }
  
  saveStats();
  return isNewRecord;
}

// Función para crear objetivos extra (nivel 10+)
function spawnExtraTarget() {
  if (extraTargets.length >= 2) return;
  
  const extra = document.createElement("div");
  extra.className = "extra-target";
  
  const x = Math.random() * (gameArea.clientWidth - targetSize);
  const y = Math.random() * (gameArea.clientHeight - targetSize);
  
  extra.style.left = `${x}px`;
  extra.style.top = `${y}px`;
  extra.style.width = `${targetSize}px`;
  extra.style.height = `${targetSize}px`;
  
  extra.addEventListener("click", () => {
    handleTargetClick(2); // Bonus points
    extra.remove();
    extraTargets = extraTargets.filter(e => e !== extra);
  });
  
  gameArea.appendChild(extra);
  extraTargets.push(extra);
  
  // Desaparece después de un tiempo
  setTimeout(() => {
    extra.remove();
    extraTargets = extraTargets.filter(e => e !== extra);
  }, timeLimit * 0.8);
}

function handleTargetClick(points = 1) {
  const now = Date.now();
  
  // Sistema de combo
  if (now - lastClickTime < 1500) {
    combo = Math.min(10, combo + 1);
    if (combo >= 3 && comboSound) comboSound.play();
  } else {
    combo = 1;
  }
  lastClickTime = now;
  
  if (combo > maxCombo) maxCombo = combo;
  
  // Aplicar puntos con multiplicador de combo
  score += points * combo;
  targetsHitThisLevel++;
  
  clickSound.play();
  updateScore();
  updateComboDisplay();
  updateProgressBar();
  
  // Limpiar intervalos de movimiento/encogimiento
  if (movingInterval) clearInterval(movingInterval);
  if (shrinkInterval) clearInterval(shrinkInterval);
  
  // Verificar si sube de nivel
  if (targetsHitThisLevel >= targetsPerLevel && !peacefulMode) {
    levelUp();
  }
}

// Evento único para el clic en el target
target.addEventListener("click", () => {
  handleTargetClick(1);

  // Efecto de explosión
  target.classList.add("clicked");
  target.style.transform = "scale(1.5)";
  setTimeout(() => {
    target.style.transform = "scale(1)";
    target.classList.remove("clicked");
  }, 200);

  moveTarget();
});
