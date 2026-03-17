import { gzipSync, gunzipSync } from "zlib";

const PROTOCOL_VERSION = 0b0001;
const HEADER_SIZE = 0b0001;

const MESSAGE_TYPE = {
  clientFullRequest: 0b0001,
  clientAudioOnlyRequest: 0b0010,
  serverFullResponse: 0b1001,
  serverAudioOnlyResponse: 0b1011,
  serverError: 0b1111,
} as const;

const MESSAGE_TYPE_FLAG = {
  noSequence: 0b0000,
  positiveSequence: 0b0001,
  lastNoSequence: 0b0010,
  negativeSequence: 0b0011,
  withEvent: 0b0100,
} as const;

const SERIALIZATION = {
  raw: 0b0000,
  json: 0b0001,
} as const;

const COMPRESSION = {
  none: 0b0000,
  gzip: 0b0001,
} as const;

type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];
type SerializationType = (typeof SERIALIZATION)[keyof typeof SERIALIZATION];
type CompressionType = (typeof COMPRESSION)[keyof typeof COMPRESSION];

type OutgoingFrameOptions = {
  messageType: MessageType;
  event: number;
  payload: Buffer;
  sessionId?: string;
  serialization: SerializationType;
  compression: CompressionType;
};

export type ParsedVoiceQaFrame = {
  messageType: MessageType;
  event?: number;
  sessionId?: string;
  connectId?: string;
  sequence?: number;
  errorCode?: number;
  payload: Buffer;
  payloadJson: unknown;
};

function shouldReadSequence(flagBits: number) {
  return (
    (flagBits & MESSAGE_TYPE_FLAG.positiveSequence) === MESSAGE_TYPE_FLAG.positiveSequence ||
    (flagBits & MESSAGE_TYPE_FLAG.negativeSequence) === MESSAGE_TYPE_FLAG.negativeSequence
  );
}

function shouldReadConnectId(eventId?: number) {
  return eventId === 50 || eventId === 51 || eventId === 52;
}

function shouldReadSessionId(eventId?: number) {
  return !shouldReadConnectId(eventId) && eventId !== 1 && eventId !== 2;
}

export function buildJsonFrame(event: number, payload: unknown, sessionId?: string) {
  const payloadBuffer = gzipSync(Buffer.from(JSON.stringify(payload), "utf8"));

  return buildFrame({
    messageType: MESSAGE_TYPE.clientFullRequest,
    event,
    payload: payloadBuffer,
    sessionId,
    serialization: SERIALIZATION.json,
    compression: COMPRESSION.gzip,
  });
}

export function buildAudioFrame(event: number, audio: Buffer, sessionId: string) {
  return buildFrame({
    messageType: MESSAGE_TYPE.clientAudioOnlyRequest,
    event,
    payload: gzipSync(audio),
    sessionId,
    serialization: SERIALIZATION.raw,
    compression: COMPRESSION.gzip,
  });
}

function buildFrame(options: OutgoingFrameOptions) {
  const parts: Buffer[] = [];
  const header = Buffer.from([
    (PROTOCOL_VERSION << 4) | HEADER_SIZE,
    (options.messageType << 4) | MESSAGE_TYPE_FLAG.withEvent,
    (options.serialization << 4) | options.compression,
    0x00,
  ]);

  parts.push(header);

  const eventBuffer = Buffer.alloc(4);
  eventBuffer.writeInt32BE(options.event, 0);
  parts.push(eventBuffer);

  if (options.sessionId && shouldReadSessionId(options.event)) {
    const sessionIdBuffer = Buffer.from(options.sessionId, "utf8");
    const sessionSizeBuffer = Buffer.alloc(4);
    sessionSizeBuffer.writeUInt32BE(sessionIdBuffer.length, 0);
    parts.push(sessionSizeBuffer, sessionIdBuffer);
  }

  const payloadSizeBuffer = Buffer.alloc(4);
  payloadSizeBuffer.writeUInt32BE(options.payload.length, 0);
  parts.push(payloadSizeBuffer, options.payload);

  return Buffer.concat(parts);
}

export function parseVoiceQaFrame(data: Buffer) {
  let offset = 0;
  const versionAndHeader = data.readUInt8(offset);
  offset += 1;
  const headerSize = (versionAndHeader & 0x0f) * 4;
  const typeAndFlag = data.readUInt8(offset);
  offset += 1;
  const messageType = (typeAndFlag >> 4) as MessageType;
  const messageTypeFlag = typeAndFlag & 0x0f;
  const serializationAndCompression = data.readUInt8(offset);
  offset += 1;
  const serialization = (serializationAndCompression >> 4) as SerializationType;
  const compression = (serializationAndCompression & 0x0f) as CompressionType;
  offset += 1;

  if (headerSize > 4) {
    offset = headerSize;
  }

  const result: ParsedVoiceQaFrame = {
    messageType,
    payload: Buffer.alloc(0),
    payloadJson: null,
  };

  if (messageType === MESSAGE_TYPE.serverError) {
    result.errorCode = data.readUInt32BE(offset);
    offset += 4;
    const payloadSize = data.readUInt32BE(offset);
    offset += 4;
    let payload = data.subarray(offset, offset + payloadSize);
    if (compression === COMPRESSION.gzip) {
      payload = gunzipSync(payload);
    }
    result.payload = payload;
    result.payloadJson = serialization === SERIALIZATION.json ? JSON.parse(payload.toString("utf8")) : null;
    return result;
  }

  if (shouldReadSequence(messageTypeFlag)) {
    result.sequence = data.readInt32BE(offset);
    offset += 4;
  }

  if ((messageTypeFlag & MESSAGE_TYPE_FLAG.withEvent) === MESSAGE_TYPE_FLAG.withEvent) {
    result.event = data.readInt32BE(offset);
    offset += 4;
  }

  if (shouldReadSessionId(result.event)) {
    const sessionIdSize = data.readUInt32BE(offset);
    offset += 4;
    result.sessionId = data.subarray(offset, offset + sessionIdSize).toString("utf8");
    offset += sessionIdSize;
  } else if (shouldReadConnectId(result.event)) {
    const connectIdSize = data.readUInt32BE(offset);
    offset += 4;
    result.connectId = data.subarray(offset, offset + connectIdSize).toString("utf8");
    offset += connectIdSize;
  }

  const payloadSize = data.readUInt32BE(offset);
  offset += 4;
  let payload = data.subarray(offset, offset + payloadSize);
  if (compression === COMPRESSION.gzip) {
    payload = gunzipSync(payload);
  }

  result.payload = payload;
  if (serialization === SERIALIZATION.json) {
    result.payloadJson = JSON.parse(payload.toString("utf8"));
  }

  return result;
}
