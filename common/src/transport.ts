import { RawData } from 'ws';

export const deserialize = (msg: RawData) => JSON.parse(msg.toString());
export const serialize = (data: any) => JSON.stringify(data);
