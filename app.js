let ABLY_API_KEY = "";
let roomId = "javascript-live-cursors";
let room;
overrideApiKeyAndRoomId();

if (!/^pk_(live|test)/.test(ABLY_API_KEY)) {
  console.warn(`Replace "${ABLY_API_KEY}" with a secure token in production.\n`);
}

const uniqueId = "id-" + (Math.random() + 1).toString(36).substring(7);

const realtime = new Ably.Realtime({
  key: ABLY_API_KEY,
  clientId: uniqueId
});

room = realtime.channels.get(roomId);
room.presence.enter({ initialPresence: { cursor: null } });

const cursorsContainer = document.getElementById("cursors-container");
const text = document.getElementById("text");

//room.presence.subscribe((member) => {});

/**
 * Subscribe to every others presence updates.
 * The callback will be called if you or someone else enters or leaves the room
 * or when someone presence is updated
 */
room.presence.subscribe((member) => {
  if (member.clientId == uniqueId) {
    const cursor = member.data.cursor ?? null;
    text.innerHTML = cursor ? `${cursor.x} × ${cursor.y}` : "Move your cursor to broadcast its position to other people in the room.";
  } else {
    switch (member.action) {
      case "enter":
      case "update": {
        // Clear all cursors
        //cursorsContainer.innerHTML = "";
        updateCursor(member);
        break;
      }
      case "leave": {
        deleteCursor(member);
        break;
      }
    }
  }
});

document.addEventListener("pointermove", (e) => {
  e.preventDefault();
  room.presence.update({
    cursor: { x: Math.round(e.clientX), y: Math.round(e.clientY) }
  });
});

document.addEventListener("pointerleave", (e) => {
  room.presence.update({ cursor: null });
});

const COLORS = ["#DC2626", "#D97706", "#059669", "#7C3AED", "#DB2777"];

// Update cursor position based on user presence
function updateCursor(member) {
  const cursor = getCursorOrCreate(member.clientId);

  if (member.data.cursor) {
    cursor.style.transform = `translateX(${member.data.cursor.x}px) translateY(${member.data.cursor.y}px)`;
    cursor.style.opacity = "1";
  } else {
    cursor.style.opacity = "0";
  }
}

function getCursorOrCreate(clientId) {
  let cursor = document.getElementById(`cursor-${clientId}`);

  if (cursor == null) {
    cursor = document.getElementById("cursor-template").cloneNode(true);
    cursor.id = `cursor-${clientId}`;
    cursor.style.fill = COLORS[Math.floor(Math.random() * COLORS.length)];
    cursorsContainer.appendChild(cursor);
  }

  return cursor;
}

function deleteCursor(member) {
  const cursor = document.getElementById(`cursor-${member.clientId}`);
  if (cursor) {
    cursor.parentNode.removeChild(cursor);
  }
}

/**
 * This function is used when deploying an example on liveblocks.io.
 * You can ignore it completely if you run the example locally.
 */
function overrideApiKeyAndRoomId() {
  const query = new URLSearchParams(window?.location?.search);
  const apiKey = query.get("apiKey");
  const roomIdSuffix = query.get("roomId");

  if (apiKey) {
    ABLY_API_KEY = apiKey;
  }

  if (roomIdSuffix) {
    roomId = `${roomId}-${roomIdSuffix}`;
  }
}
