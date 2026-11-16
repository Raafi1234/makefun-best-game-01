// Keyboard and mouse state for the game. The game polls `keys` each frame and
// consumes one-shot presses through `pressed`, so controls answer the same
// frame they are hit.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  const mouse = { x: 0, y: 0, down: false, clicked: false };

  const toGame = (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mouse.x = (event.clientX - rect.left) * scaleX;
    mouse.y = (event.clientY - rect.top) * scaleY;
  };

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }
    if (!event.repeat) pressed.add(event.key.toLowerCase());
    keys.add(event.key.toLowerCase());
  });
  window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousemove', toGame);
  canvas.addEventListener('mousedown', (event) => {
    toGame(event);
    mouse.down = true;
    mouse.clicked = true;
  });
  window.addEventListener('mouseup', () => {
    mouse.down = false;
  });

  return {
    keys,
    mouse,
    // True only on the frame the key went down; reading it consumes it.
    wasPressed(key) {
      if (!pressed.has(key)) return false;
      pressed.delete(key);
      return true;
    },
    endFrame() {
      pressed.clear();
      mouse.clicked = false;
    },
  };
}
