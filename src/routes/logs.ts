import { Elysia, t } from 'elysia';
import { mLogs } from '../models/mLogs';

export const logRoutes = new Elysia({ prefix: '/logs' })
    // Get recent logs
    .get('/', async () => {
        try {
            const logs = await mLogs.find().sort({ createdAt: -1 }).limit(100);
            return { success: true, count: logs.length, data: logs };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    })

    // Create a log entry (Internal use mainly, but exposed for frontend generic logs if needed)
    .post('/', async ({ body }: any) => {
        try {
            const newLog = new mLogs(body);
            await newLog.save();
            return { success: true, data: newLog };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }, {
        body: t.Object({
            action: t.String(),
            details: t.String(),
            user: t.Optional(t.String()),
            level: t.Optional(t.String())
        })
    });
