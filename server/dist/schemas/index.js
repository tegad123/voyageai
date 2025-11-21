"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItineraryUpdateSchema = exports.ItinerarySchema = exports.ChatRequestSchema = exports.ChatMessageSchema = void 0;
const zod_1 = require("zod");
exports.ChatMessageSchema = zod_1.z.object({
    role: zod_1.z.enum(['user', 'assistant', 'system']),
    content: zod_1.z.string().min(1)
});
exports.ChatRequestSchema = zod_1.z.object({
    messages: zod_1.z.array(exports.ChatMessageSchema),
    model: zod_1.z.string().optional(),
    language: zod_1.z.string().optional(),
});
exports.ItinerarySchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string()
});
exports.ItineraryUpdateSchema = exports.ItinerarySchema.partial();
