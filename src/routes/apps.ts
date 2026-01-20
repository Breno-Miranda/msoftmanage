import { Elysia, t } from 'elysia';
import { mApps } from '../models/mApps';
import mongoose from 'mongoose';

export const appRoutes = new Elysia({ prefix: '/apps' })

    // List all apps installed by a user
    .get('/', async ({ query, set }) => {
        try {
            const userId = query.userId;
            if (!userId) {
                set.status = 400;
                return { success: false, error: 'User ID required' };
            }

            const apps = await mApps.find({ userId: new mongoose.Types.ObjectId(userId as string) });
            return { success: true, data: apps };
        } catch (error) {
            set.status = 500;
            return { success: false, error: error.message };
        }
    })

    // Register/Install an app
    .post('/install', async ({ body, set }) => {
        try {
            const { name, appKey, userId } = body as { name: string; appKey: string; userId: string };

            // Check if already installed
            const existing = await mApps.findOne({ userId: new mongoose.Types.ObjectId(userId), appKey });
            if (existing) {
                return { success: true, data: existing, message: 'App already installed' };
            }

            const newApp = new mApps({
                name,
                appKey,
                userId: new mongoose.Types.ObjectId(userId),
                status: 'active'
            });

            await newApp.save();

            return { success: true, data: newApp, message: 'App installed successfully' };
        } catch (error) {
            set.status = 500;
            console.error(error);
            return { success: false, error: error.message };
        }
    }, {
        body: t.Object({
            name: t.String(),
            appKey: t.String(),
            userId: t.String()
        })
    });
