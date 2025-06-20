class CursorZoom {
  constructor() {
    this.isAltPressed = false;
    this.currentZoom = 1;
    this.zoomStep = 0.1;
    this.minZoom = 0.5;
    this.maxZoom = 5;
    this.isZooming = false;
    this.zoomContainer = null;
    this.resetTimer = null;
    
    this.init();
  }

  init() {
    this.createZoomContainer();
    
    // Track Alt key state
    document.addEventListener('keydown', (e) => {
      if (e.altKey && !this.isAltPressed) {
        this.isAltPressed = true;
        document.body.classList.add('alt-pressed');
        // Clear any pending reset timer when Alt is pressed again
        if (this.resetTimer) {
          clearTimeout(this.resetTimer);
          this.resetTimer = null;
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      if (!e.altKey && this.isAltPressed) {
        this.isAltPressed = false;
        document.body.classList.remove('alt-pressed');
        // Start the reset timer when Alt is released
        this.startResetTimer();
      }
    });

    // Handle mouse wheel with Alt
    document.addEventListener('wheel', (e) => {
      if (this.isAltPressed) {
        e.preventDefault();
        e.stopPropagation();
        this.handleWheelZoom(e);
      }
    }, { passive: false, capture: true });

    // Reset zoom on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.resetZoom();
      }
    });

    // Reset zoom when Alt is released
    document.addEventListener('keyup', (e) => {
      if (!e.altKey && this.currentZoom !== 1) {
        this.startResetTimer();
      }
    });

    // Handle window blur to reset Alt state
    window.addEventListener('blur', () => {
      this.isAltPressed = false;
      document.body.classList.remove('alt-pressed');
      if (this.currentZoom !== 1) {
        this.startResetTimer();
      }
    });
  }

  startResetTimer() {
    // Clear any existing timer
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
    
    // Set a new timer to reset zoom after 1 second
    this.resetTimer = setTimeout(() => {
      if (!this.isAltPressed && this.currentZoom !== 1) {
        this.resetZoom();
      }
      this.resetTimer = null;
    }, 1000);
  }

  createZoomContainer() {
    // Create a container that wraps the entire page content
    this.zoomContainer = document.createElement('div');
    this.zoomContainer.id = 'page-zoom-container';
    this.zoomContainer.style.cssText = `
      transform-origin: 0 0;
      transition: transform 0.2s ease-out;
      will-change: transform;
    `;
    
    // Move all body children into the zoom container
    while (document.body.firstChild) {
      this.zoomContainer.appendChild(document.body.firstChild);
    }
    
    document.body.appendChild(this.zoomContainer);
  }



  handleWheelZoom(e) {
    // Clear any pending reset timer since user is actively zooming
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
    
    // Get cursor position relative to viewport
    const cursorX = e.clientX;
    const cursorY = e.clientY;
    
    // Calculate the zoom change
    const oldZoom = this.currentZoom;
    
    if (e.deltaY < 0) {
      // Zoom in
      this.currentZoom = Math.min(this.currentZoom + this.zoomStep, this.maxZoom);
    } else {
      // Zoom out
      this.currentZoom = Math.max(this.currentZoom - this.zoomStep, this.minZoom);
    }
    
    if (this.currentZoom <= 1) {
      this.resetZoom();
      return;
    }
    
    this.applyPageZoom(cursorX, cursorY, oldZoom);
  }

  applyPageZoom(cursorX, cursorY, oldZoom) {
    if (!this.zoomContainer) return;
    
    // Get current transform values
    const computedStyle = getComputedStyle(this.zoomContainer);
    const matrix = new DOMMatrix(computedStyle.transform);
    const currentTranslateX = matrix.m41;
    const currentTranslateY = matrix.m42;
    const currentScale = matrix.a; // Current scale factor
    
    // Calculate the zoom change ratio
    const zoomRatio = this.currentZoom / oldZoom;
    
    // Calculate the cursor position relative to the current transformed content
    const contentCursorX = (cursorX - currentTranslateX) / currentScale;
    const contentCursorY = (cursorY - currentTranslateY) / currentScale;
    
    // Calculate new translation to keep the cursor point stationary
    const newTranslateX = cursorX - (contentCursorX * this.currentZoom);
    const newTranslateY = cursorY - (contentCursorY * this.currentZoom);
    
    // Apply the transform
    this.zoomContainer.style.transform = `translate(${newTranslateX}px, ${newTranslateY}px) scale(${this.currentZoom})`;
    
    this.isZooming = true;
    document.body.classList.add('page-zoomed');
  }

  resetZoom() {
    if (this.zoomContainer && this.currentZoom !== 1) {
      this.zoomContainer.style.transform = 'translate(0px, 0px) scale(1)';
      this.currentZoom = 1;
      this.isZooming = false;
      document.body.classList.remove('page-zoomed');
    }
    
    // Clear any pending reset timer
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }
}

// Initialize the zoom functionality when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const cursorZoom = new CursorZoom();
  });
} else {
  const cursorZoom = new CursorZoom();
}

// Add visual feedback
const style = document.createElement('style');
style.textContent = `
  .cursor-zoom-active {
    position: relative !important;
    z-index: 9999 !important;
  }
  
  body.alt-pressed * {
    cursor: zoom-in !important;
  }
`;
document.head.appendChild(style);