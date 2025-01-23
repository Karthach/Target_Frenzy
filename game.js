// Elementos DOM
const gameArea = document.getElementById("game-area");
const target = document.getElementById("target");
const scoreDisplay = document.getElementById("score");
const countdownDisplay = document.getElementById("countdown");
const clickSound = document.getElementById("click-sound");
const errorSound = document.getElementById("error-sound");
const difficultySelect = document.getElementById("difficulty");

// Variables globales
let score = 0;
let timeLimit;
let targetSize;
let fakeTargets = [];
let gameInterval;
let gameRunning = false;
let peacefulMode = false;

// Iniciar el juego
function startGame() {
  document.getElementById("difficulty-container").style.display = "none";

  const difficulty = difficultySelect.value;
  configureDifficulty(difficulty);

  // Restablecer el tamaño del área de juego a su estado original de 50
  const gameArea = document.getElementById("game-area");
  gameArea.style.width = "50vw";  // Ancho original
  gameArea.style.height = "50vh"; // Altura original

  // Mostrar el contador antes de iniciar el juego
  startCountdown(3);
}

function configureDifficulty(difficulty) {
  switch (difficulty) {
    case "easy":
      timeLimit = 4000; // Más tiempo por clic
      targetSize = 80; // Objetivo más grande
      fakeTargetProbability = 0.05; // Menor probabilidad de objetivos falsos
      backgroundChangeRate = 0.02; // Cambios de fondo menos frecuentes
      peacefulMode = false;
      break;
    case "medium":
      timeLimit = 2500; // Tiempo moderado
      targetSize = 60; // Objetivo mediano
      fakeTargetProbability = 0.2; // Probabilidad moderada de objetivos falsos
      backgroundChangeRate = 0.15; // Cambios de fondo frecuentes
      peacefulMode = false;
      break;
    case "hard":
      timeLimit = 1500; // Menor tiempo por clic
      targetSize = 40; // Objetivo más pequeño
      fakeTargetProbability = 0.4; // Mayor probabilidad de objetivos falsos
      backgroundChangeRate = 0.3; // Cambios de fondo muy frecuentes
      peacefulMode = false;
      break;
    case "peaceful":
      peacefulMode = true;
      timeLimit = 5000; // Mucho tiempo para hacer clic
      targetSize = 90; // Objetivo muy grande
      fakeTargetProbability = 0.0; // Sin objetivos falsos
      backgroundChangeRate = 0.0; // Sin cambios de fondo
      break;
    default:
      console.warn("Dificultad no válida, estableciendo 'medium'.");
      timeLimit = 2500;
      targetSize = 60;
      fakeTargetProbability = 0.2;
      backgroundChangeRate = 0.15;
      peacefulMode = false;
      break;
  }
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
  console.log("¡Juego iniciado!");

  score = 0;
  gameRunning = true;
  scoreDisplay.textContent = `Score: ${score}`;
  target.style.visibility = "visible";

  moveTarget();

  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(updateGame, timeLimit);
}

function updateGame() {
  if (!gameRunning || peacefulMode) return;

  // Incremento progresivo de la dificultad
  if (score >= 10) {
    timeLimit = Math.max(700, timeLimit - 50); // Reduce el tiempo entre movimientos
    targetSize = Math.max(20, targetSize - 1); // Disminuye el tamaño del objetivo
  }
  if (score >= 20) {
    fakeTargetProbability = Math.min(0.8, fakeTargetProbability + 0.1); // Más probabilidades de objetivos falsos
    backgroundChangeRate = Math.min(0.8, backgroundChangeRate + 0.1); // Aumenta la velocidad de cambio de fondo
  }

  // Redimensionar la área de juego gradualmente conforme pasa el puntaje
  const newWidth = Math.min(95, 50 + (score / 10)); // Incrementa el tamaño con el puntaje
  const newHeight = Math.min(95, 50 + (score / 10)); // Incrementa el tamaño con el puntaje

  gameArea.style.width = `${newWidth}vw`;
  gameArea.style.height = `${newHeight}vh`;

  // Condición de victoria
  if (newWidth >= 95 && newHeight >= 95) {
    endGame();
  }

  moveTarget();
  if (Math.random() < fakeTargetProbability) spawnFakeTargets();
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

  setTimeout(() => {
    if (!target.classList.contains("clicked") && !peacefulMode) {
      if (!peacefulMode) {
        score -= 1; // Solo se resta si no estamos en modo peaceful
      }
      updateScore();
    }
    target.classList.remove("clicked");
  }, timeLimit);
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
    errorSound.play();
    updateScore();
    fakeTarget.style.animation = "none";  // Detener animación al hacer clic
    fakeTarget.style.transform = "scale(1.2)";  // Efecto visual de "explosión" al hacer clic
    fakeTarget.style.opacity = 0;
    setTimeout(() => fakeTarget.remove(), 200);  // Eliminar después del efecto
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
  if (score < 0) score = 0;
  scoreDisplay.textContent = `Score: ${score}`;
}

function endGame() {
  gameRunning = false;  // Detener el juego inmediatamente
  clearInterval(gameInterval);  // Detener el intervalo de actualización
  target.style.visibility = "hidden";

  // Crear el contenedor del mensaje de victoria
  const messageContainer = document.createElement('div');
  messageContainer.classList.add('victory-container');

  // Crear el mensaje
  const message = document.createElement('div');
  message.innerHTML = "¡Felicidades! Has ganado el juego. 🎉";
  message.classList.add('victory-message');
  messageContainer.appendChild(message);

  // Crear el botón de cerrar
  const closeButton = document.createElement('button');
  closeButton.innerText = "Cerrar";
  closeButton.classList.add('close-button');
  messageContainer.appendChild(closeButton);

  // Añadir el contenedor del mensaje a la página
  document.body.appendChild(messageContainer);

  // Añadir animación al mensaje
  message.classList.add('fade-in');

  // Evento para cerrar el mensaje
  closeButton.addEventListener('click', () => {
    messageContainer.style.display = "none"; // Ocultar el mensaje
    document.getElementById("difficulty-container").style.display = "block"; // Mostrar selección de dificultad
  });
}

function changeBackground() {
  // Cambio de fondo aleatorio
  const colors = ["#ff7f7f", "#7fff7f", "#7f7fff", "#ffff7f"];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  gameArea.style.backgroundColor = randomColor;
}

// Evento único para el clic en el target
target.addEventListener("click", () => {
  score ++;
  clickSound.play();
  updateScore();

  // Efecto de explosión
  target.classList.add("clicked");
  target.style.transform = "scale(1.5)";
  setTimeout(() => {
    target.style.transform = "scale(1)";
    target.classList.remove("clicked");
  }, 200);

  moveTarget();
});
