// Conversion factor: pixels per cm
const scaleFactor = 10;
let zoomLevel = 1;
const boardContainer = document.getElementById('board-container');
const resultDiv = document.getElementById('result');

// Variables for selection rectangle functionality
let isSelecting = false;
let selectionStart = { x: 0, y: 0 };
let selectionRect = null;

// Utility function to clear item selection
function clearSelection() {
  document.querySelectorAll('.item.selected').forEach(item => {
    item.classList.remove('selected');
  });
}

// Update an item's transform based on its translation and rotation data
function updateTransform(item) {
  const x = parseFloat(item.getAttribute('data-x')) || 0;
  const y = parseFloat(item.getAttribute('data-y')) || 0;
  const angle = parseFloat(item.getAttribute('data-rotate')) || 0;
  item.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
}

// --- Selection Rectangle Handlers using Pointer Events ---
boardContainer.addEventListener('pointerdown', function(e) {
  // Start selection only if clicking on board background (not on an item)
  if (e.target === boardContainer) {
    isSelecting = true;
    boardContainer.setPointerCapture(e.pointerId);
    const rect = boardContainer.getBoundingClientRect();
    selectionStart = {
      x: (e.clientX - rect.left) / zoomLevel,
      y: (e.clientY - rect.top) / zoomLevel
    };
    // Create selection rectangle element
    selectionRect = document.createElement('div');
    selectionRect.id = 'selection-rect';
    selectionRect.style.left = selectionStart.x + 'px';
    selectionRect.style.top = selectionStart.y + 'px';
    selectionRect.style.width = '0px';
    selectionRect.style.height = '0px';
    boardContainer.appendChild(selectionRect);
  }
});

boardContainer.addEventListener('pointermove', function(e) {
  if (!isSelecting || !selectionRect) return;
  const rect = boardContainer.getBoundingClientRect();
  const currentX = (e.clientX - rect.left) / zoomLevel;
  const currentY = (e.clientY - rect.top) / zoomLevel;
  const x = Math.min(currentX, selectionStart.x);
  const y = Math.min(currentY, selectionStart.y);
  const width = Math.abs(currentX - selectionStart.x);
  const height = Math.abs(currentY - selectionStart.y);
  selectionRect.style.left = x + 'px';
  selectionRect.style.top = y + 'px';
  selectionRect.style.width = width + 'px';
  selectionRect.style.height = height + 'px';
});

boardContainer.addEventListener('pointerup', function(e) {
  if (!isSelecting) return;
  isSelecting = false;
  boardContainer.releasePointerCapture(e.pointerId);
  // Get final selection rectangle boundaries (in board coordinates)
  const selLeft = parseFloat(selectionRect.style.left);
  const selTop = parseFloat(selectionRect.style.top);
  const selWidth = parseFloat(selectionRect.style.width);
  const selHeight = parseFloat(selectionRect.style.height);
  const selRight = selLeft + selWidth;
  const selBottom = selTop + selHeight;
  // Remove the selection rectangle element
  if (selectionRect && selectionRect.parentNode) {
    selectionRect.parentNode.removeChild(selectionRect);
  }
  selectionRect = null;
  // For each item, if its bounding box is entirely within the selection, select it
  document.querySelectorAll('.item').forEach(item => {
    const itemLeft = parseFloat(item.style.left);
    const itemTop = parseFloat(item.style.top);
    const itemWidth = item.offsetWidth;
    const itemHeight = item.offsetHeight;
    const itemRight = itemLeft + itemWidth;
    const itemBottom = itemTop + itemHeight;
    if (itemLeft >= selLeft && itemRight <= selRight &&
        itemTop >= selTop && itemBottom <= selBottom) {
      item.classList.add('selected');
    }
  });
});
// --- End Selection Handlers ---

// Clear selection when clicking outside the board and controls
document.addEventListener('click', function(e) {
  if (!boardContainer.contains(e.target) &&
      !e.target.closest('.controls') &&
      !e.target.closest('.button-group')) {
    clearSelection();
  }
});

// --- Generate Items ---
document.getElementById('calculateBtn').addEventListener('click', () => {
  // Clear previous board and result text
  boardContainer.innerHTML = '';
  resultDiv.textContent = '';

  // Retrieve board dimensions (cm)
  const boardWidthCm = parseFloat(document.getElementById('boardWidth').value);
  const boardHeightCm = parseFloat(document.getElementById('boardHeight').value);
  // Detailed board padding (cm)
  const boardPaddingTopCm = parseFloat(document.getElementById('boardPaddingTop').value);
  const boardPaddingRightCm = parseFloat(document.getElementById('boardPaddingRight').value);
  const boardPaddingBottomCm = parseFloat(document.getElementById('boardPaddingBottom').value);
  const boardPaddingLeftCm = parseFloat(document.getElementById('boardPaddingLeft').value);
  // Item dimensions and gap (cm)
  const itemWidthCm = parseFloat(document.getElementById('itemWidth').value);
  const itemHeightCm = parseFloat(document.getElementById('itemHeight').value);
  const itemGapCm = parseFloat(document.getElementById('itemGap').value);
  // Item shape selection
  const itemShape = document.getElementById('itemShape').value;

  // Convert to pixels
  const boardWidthPx = boardWidthCm * scaleFactor;
  const boardHeightPx = boardHeightCm * scaleFactor;
  const paddingTopPx = boardPaddingTopCm * scaleFactor;
  const paddingRightPx = boardPaddingRightCm * scaleFactor;
  const paddingBottomPx = boardPaddingBottomCm * scaleFactor;
  const paddingLeftPx = boardPaddingLeftCm * scaleFactor;
  const itemWidthPx = itemWidthCm * scaleFactor;
  const itemHeightPx = itemHeightCm * scaleFactor;
  const itemGapPx = itemGapCm * scaleFactor;

  // Set board container dimensions and individual paddings
  boardContainer.style.width = boardWidthPx + 'px';
  boardContainer.style.height = boardHeightPx + 'px';
  boardContainer.style.paddingTop = paddingTopPx + 'px';
  boardContainer.style.paddingRight = paddingRightPx + 'px';
  boardContainer.style.paddingBottom = paddingBottomPx + 'px';
  boardContainer.style.paddingLeft = paddingLeftPx + 'px';

  // Compute available drawing area inside the board (excluding paddings)
  const availableWidth = boardWidthPx - (paddingLeftPx + paddingRightPx);
  const availableHeight = boardHeightPx - (paddingTopPx + paddingBottomPx);

  let itemsCount = 0;
  let currentY = 0;
  while (currentY + itemHeightPx <= availableHeight) {
    let currentX = 0;
    while (currentX + itemWidthPx <= availableWidth) {
      const item = document.createElement('div');
      item.classList.add('item');
      item.style.width = itemWidthPx + 'px';
      item.style.height = itemHeightPx + 'px';
      
      // Apply shape style: if "circle" is selected, use border-radius 50% for a circle/oval effect.
      if (itemShape === 'circle') {
        item.style.borderRadius = '50%';
      } else {
        item.style.borderRadius = '0';
      }

      // Initialize translation and rotation data attributes
      item.setAttribute('data-x', 0);
      item.setAttribute('data-y', 0);
      item.setAttribute('data-rotate', 0);
      // Position the item relative to the board (taking left/top padding into account)
      item.style.left = (currentX + paddingLeftPx) + 'px';
      item.style.top = (currentY + paddingTopPx) + 'px';
      updateTransform(item);

      // Toggle selection on tap/click (stop propagation so board click doesn’t interfere)
      item.addEventListener('click', function(e) {
        e.stopPropagation();
        item.classList.toggle('selected');
      });

      boardContainer.appendChild(item);
      itemsCount++;
      currentX += itemWidthPx + itemGapPx;
    }
    currentY += itemHeightPx + itemGapPx;
  }
  resultDiv.textContent = 'Total items fitted: ' + itemsCount;

  // Initialize draggable behavior using Interact.js (supports group dragging)
  interact('.item').draggable({
    modifiers: [
      interact.modifiers.restrictRect({
        restriction: boardContainer,
        endOnly: true
      })
    ],
    listeners: {
      start: function(event) {
        // If dragging an unselected item, clear selection and select it
        if (!event.target.classList.contains('selected')) {
          clearSelection();
          event.target.classList.add('selected');
        }
      },
      move: function(event) {
        const dx = event.dx;
        const dy = event.dy;
        const itemsToMove = event.target.classList.contains('selected')
          ? document.querySelectorAll('.item.selected')
          : [event.target];
        itemsToMove.forEach(item => {
          let x = parseFloat(item.getAttribute('data-x')) || 0;
          let y = parseFloat(item.getAttribute('data-y')) || 0;
          x += dx;
          y += dy;
          item.setAttribute('data-x', x);
          item.setAttribute('data-y', y);
          updateTransform(item);
        });
      }
    }
  });
});

// --- Control Buttons ---
document.getElementById('zoomInBtn').addEventListener('click', () => {
  zoomLevel += 0.1;
  boardContainer.style.transform = 'scale(' + zoomLevel + ')';
});

document.getElementById('zoomOutBtn').addEventListener('click', () => {
  if (zoomLevel > 0.2) {
    zoomLevel -= 0.1;
    boardContainer.style.transform = 'scale(' + zoomLevel + ')';
  }
});

document.getElementById('rotateLeftBtn').addEventListener('click', () => {
  document.querySelectorAll('.item.selected').forEach(item => {
    let angle = parseFloat(item.getAttribute('data-rotate')) || 0;
    angle -= 15;
    item.setAttribute('data-rotate', angle);
    updateTransform(item);
  });
});

document.getElementById('rotateRightBtn').addEventListener('click', () => {
  document.querySelectorAll('.item.selected').forEach(item => {
    let angle = parseFloat(item.getAttribute('data-rotate')) || 0;
    angle += 15;
    item.setAttribute('data-rotate', angle);
    updateTransform(item);
  });
});

document.getElementById('resetItemsBtn').addEventListener('click', () => {
  document.querySelectorAll('.item').forEach(item => {
    item.setAttribute('data-x', 0);
    item.setAttribute('data-y', 0);
    item.setAttribute('data-rotate', 0);
    updateTransform(item);
  });
});
