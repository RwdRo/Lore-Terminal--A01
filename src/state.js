const state = {
  activePanel: 'content',
};

const listeners = [];

export function getState() {
  return { ...state };
}

export function setActivePanel(panelId) {
  state.activePanel = panelId;
  notifyListeners();
}

export function subscribe(listener) {
  listeners.push(listener);
}

function notifyListeners() {
  listeners.forEach(listener => listener());
}
