import { z } from "zod";

const IdSchema = z.string();
const PositionSchema = z.number();

export const ClientGameStateMsgSchema = z.object({
  p: PositionSchema,
  others: z.record(IdSchema, PositionSchema),
});

export type Id = z.infer<typeof IdSchema>;
export type Position = z.infer<typeof PositionSchema>;
export type ClientGameStateMsg = z.infer<typeof ClientGameStateMsgSchema>;
