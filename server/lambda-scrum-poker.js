const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const TABLE = process.env.TABLE || 'ScrumPokerRooms';

exports.handler = async (event) => {
  const { httpMethod, resource, path, pathParameters, queryStringParameters, body } = event;
  const respond = (statusCode, data) => ({
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(data),
  });

  // Helper: get room
  async function getRoom(roomId) {
    const res = await db.get({ TableName: TABLE, Key: { roomId } }).promise();
    return res.Item;
  }

  // Helper: save room
  async function saveRoom(room) {
    await db.put({ TableName: TABLE, Item: room }).promise();
  }

  // 1. Create room: POST /room
  if (httpMethod === 'POST' && resource === '/room') {
    const roomId = Math.random().toString(36).substr(2, 8);
    const { cardSet, initiator } = JSON.parse(body);
    const room = {
      roomId,
      cardSet,
      initiator,
      participants: [],
      selections: {},
      revealed: false,
    };
    await saveRoom(room);
    return respond(201, { roomId });
  }

  // 2. Join room: POST /room/{roomId}/join
  if (httpMethod === 'POST' && resource === '/room/{roomId}/join') {
    const roomId = pathParameters && pathParameters.roomId;
    if (!roomId) return respond(400, { error: 'Missing roomId' });
    const { userId, displayName } = JSON.parse(body);
    const room = await getRoom(roomId);
    if (!room) return respond(404, { error: 'Room not found' });
    if (!room.participants.find(p => p.userId === userId)) {
      room.participants.push({ userId, displayName });
      await saveRoom(room);
    }
    return respond(200, { participants: room.participants });
  }

  // 3. Select card: POST /room/{roomId}/select
  if (httpMethod === 'POST' && resource === '/room/{roomId}/select') {
    const roomId = pathParameters && pathParameters.roomId;
    if (!roomId) return respond(400, { error: 'Missing roomId' });
    const { userId, card } = JSON.parse(body);
    const room = await getRoom(roomId);
    if (!room) return respond(404, { error: 'Room not found' });
    room.selections[userId] = card;
    await saveRoom(room);
    return respond(200, { selections: room.selections });
  }

  // 4. Reveal: POST /room/{roomId}/reveal
  if (httpMethod === 'POST' && resource === '/room/{roomId}/reveal') {
    const roomId = pathParameters && pathParameters.roomId;
    if (!roomId) return respond(400, { error: 'Missing roomId' });
    const { userId } = JSON.parse(body);
    const room = await getRoom(roomId);
    if (!room) return respond(404, { error: 'Room not found' });
    if (room.initiator !== userId) return respond(403, { error: 'Only initiator can reveal' });
    room.revealed = true;
    await saveRoom(room);
    return respond(200, { revealed: true });
  }

  // 5. Reset: POST /room/{roomId}/reset
  if (httpMethod === 'POST' && resource === '/room/{roomId}/reset') {
    const roomId = pathParameters && pathParameters.roomId;
    if (!roomId) return respond(400, { error: 'Missing roomId' });
    const { userId } = JSON.parse(body);
    const room = await getRoom(roomId);
    if (!room) return respond(404, { error: 'Room not found' });
    if (room.initiator !== userId) return respond(403, { error: 'Only initiator can reset' });
    room.selections = {};
    room.revealed = false;
    await saveRoom(room);
    return respond(200, { reset: true });
  }

  // 6. Get room state: GET /room/{roomId}
  if (httpMethod === 'GET' && resource === '/room/{roomId}') {
    const roomId = pathParameters && pathParameters.roomId;
    if (!roomId) return respond(400, { error: 'Missing roomId' });
    const room = await getRoom(roomId);
    if (!room) return respond(404, { error: 'Room not found' });
    return respond(200, room);
  }

  return respond(404, { error: 'Not found' });
}; 