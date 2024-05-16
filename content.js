let autoNext = false;
let autoPrevious = false;
let autoplay = false;

function addNavigationControls() {
  const container = document.querySelector(
    ".xwd__header--row.xwd__header--fullwidth",
  );

  if (container && !document.getElementById("nyt-mini-nav-controls")) {
    const controlsDiv = document.createElement("div");
    controlsDiv.id = "nyt-mini-nav-controls";

    const autoPrevButton = document.createElement("button");
    autoPrevButton.innerHTML =
      '<img src="' +
      chrome.runtime.getURL("icons/auto-previous.svg") +
      '" alt="Auto previous">';
    autoPrevButton.title = "Auto move to previous puzzle";
    autoPrevButton.onclick = () => toggleAutoPrevious();

    const prevButton = document.createElement("button");
    prevButton.innerHTML =
      '<img src="' +
      chrome.runtime.getURL("icons/previous.svg") +
      '" alt="Previous">';
    prevButton.title = "Previous puzzle";
    prevButton.onclick = () => navigateDate(-1);

    const autoplayButton = document.createElement("button");
    autoplayButton.innerHTML =
      '<img src="' +
      chrome.runtime.getURL("icons/autoplay.svg") +
      '" alt="Autoplay">';
    autoplayButton.title = "Autoplay";
    autoplayButton.onclick = () => toggleAutoplay();

    const nextButton = document.createElement("button");
    nextButton.innerHTML =
      '<img src="' + chrome.runtime.getURL("icons/next.svg") + '" alt="Next">';
    nextButton.title = "Next puzzle";
    nextButton.onclick = () => navigateDate(1);

    const autoNextButton = document.createElement("button");
    autoNextButton.innerHTML =
      '<img src="' +
      chrome.runtime.getURL("icons/auto-next.svg") +
      '" alt="Auto Next">';
    autoNextButton.title = "Auto move to next puzzle";
    autoNextButton.onclick = () => toggleAutoNext();

    controlsDiv.appendChild(autoPrevButton);
    controlsDiv.appendChild(prevButton);
    controlsDiv.appendChild(autoplayButton);
    controlsDiv.appendChild(nextButton);
    controlsDiv.appendChild(autoNextButton);

    container.appendChild(controlsDiv);

    loadSettings();
  }
}

function toggleAutoplay() {
  autoplay = !autoplay;
  updateAutoButtons();
  saveSettings();
}

function toggleAutoNext() {
  autoNext = !autoNext;
  autoPrevious = false;
  updateAutoButtons();
  saveSettings();
}

function toggleAutoPrevious() {
  autoPrevious = !autoPrevious;
  autoNext = false;
  updateAutoButtons();
  saveSettings();
}

function updateAutoButtons() {
  const autoPreviousButton = document.querySelector(
    "#nyt-mini-nav-controls button:nth-child(1)",
  );
  const autoplayButton = document.querySelector(
    "#nyt-mini-nav-controls button:nth-child(3)",
  );
  const autoNextButton = document.querySelector(
    "#nyt-mini-nav-controls button:nth-child(5)",
  );

  autoPreviousButton.style.backgroundColor = autoPrevious ? "#4082FB" : "";
  autoplayButton.style.backgroundColor = autoplay ? "#4082FB" : "";
  autoNextButton.style.backgroundColor = autoNext ? "#4082FB" : "";
}

function navigateDate(offset) {
  const url = new URL(window.location.href);
  const pathParts = url.pathname.split("/");
  const currentDate = pathParts.slice(-3).join("-");

  const newDate = new Date(currentDate);
  newDate.setDate(newDate.getDate() + offset);

  const newDateString = newDate.toISOString().split("T")[0];
  const [year, month, day] = newDateString.split("-");

  const newPath = `/crosswords/game/mini/${year}/${month}/${day}`;
  url.pathname = newPath;

  window.location.href = url.toString();
}

function checkIfPuzzleSolved() {
  const solvedModal = document.querySelector(".xwd__congrats-modal--content");
  return solvedModal !== null;
}

function checkIfPuzzleCanStart() {
  const startModal = document.querySelector(".xwd__start-modal");
  return startModal !== null;
}

function saveSettings() {
  chrome.storage.sync.set({ autoplay, autoNext, autoPrevious }, () => {
    console.log("Settings saved:", { autoplay, autoNext, autoPrevious });
  });
}

function loadSettings() {
  chrome.storage.sync.get(
    ["autoplay", "autoNext", "autoPrevious"],
    (result) => {
      autoplay = result.autoplay || false;
      autoNext = result.autoNext || false;
      autoPrevious = result.autoPrevious || false;
      updateAutoButtons();
    },
  );
}

let lastPlayClick = 0;

const observer = new MutationObserver((mutations, observer) => {
  for (let mutation of mutations) {
    if (mutation.type === "childList") {
      addNavigationControls();
      if (autoNext && checkIfPuzzleSolved()) {
        navigateDate(1);
      } else if (autoPrevious && checkIfPuzzleSolved()) {
        navigateDate(-1);
      }
      if (autoplay && checkIfPuzzleCanStart()) {
        const playButton = document.querySelector(
          'button.pz-moment__button[aria-disabled="false"][aria-label="Play"] > span',
        );
        if (playButton) {
          // Let DOM update before clicking again too soon
          const now = Date.now();
          if (now - lastPlayClick < 2000) {
            return;
          }
          playButton.click();
          lastPlayClick = Date.now();
        }
      }
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });

window.addEventListener("load", addNavigationControls);
