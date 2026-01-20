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
    })

    // Verify App Access using Access Token
    .post('/verify', async ({ body, set }: any) => {
        try {
            const { access_token, appKey } = body;

            // 1. Find User by Access Token
            // Assume Auth model is registered
            const mAuth = mongoose.model('Auth');

            const user = await mAuth.findOne({ access_token });
            if (!user) {
                set.status = 401;
                return { success: false, error: 'Invalid Access Token' };
            }

            // 2. Check if User has App installed and active
            const app = await mApps.findOne({
                userId: user._id,
                appKey: appKey,
                status: 'active'
            });

            if (!app) {
                set.status = 403;
                return { success: false, error: 'Access Denied: App not active or not purchased.' };
            }

            return {
                success: true,
                message: 'Access Granted',
                user: { id: user._id, email: user.email, name: user.name },
                appString: appKey
            };

        } catch (error: any) {
            set.status = 500;
            return { success: false, error: error.message };
        }
    }, {
        body: t.Object({
            access_token: t.String(),
            appKey: t.String()
        })
    });
