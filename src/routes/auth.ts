import { Elysia, t } from 'elysia';

import { mAuth } from '../models/mAuth';
import { mLogs } from '../models/mLogs';

export const authRoutes = new Elysia({ prefix: '/auth' })
    // Root /auth endpoint info
    .get('/', () => ({
        success: true,
        message: 'Auth Service Ready',
        endpoints: ['/login', '/register', '/users']
    }))

    // Login
    .post('/login', async ({ body, set }: any) => {
        try {
            const { email, password } = body;

            // Find user (select password explicitly)
            const user = await mAuth.findOne({ email }).select('+password');

            if (!user) {
                set.status = 401;
                // Log failed attempt? Maybe too noisy.
                return { success: false, error: 'Credenciais inválidas' };
            }

            // Simple password check (In prod, use bcrypt/argon2)
            // Ideally: await Bun.password.verify(password, user.password)
            if (user.password !== password) {
                set.status = 401;
                return { success: false, error: 'Credenciais inválidas' };
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Log Success
            try {
                await mLogs.create({
                    action: 'LOGIN',
                    details: `User logged in: ${email}`,
                    user: user.email,
                    level: 'info'
                });
            } catch (e) { }

            // Return user info (toJSON handles removing password)
            return {
                success: true,
                user: user,
                // Generate a basic bearer token (Base64 of id:timestamp)
                token: Buffer.from(`${user.id}:${Date.now()}`).toString('base64')
            };

        } catch (error: any) {
            set.status = 500;
            return { success: false, error: error.message };
        }
    }, {
        body: t.Object({
            email: t.String(),
            password: t.String()
        })
    })

    // Register
    .post('/register', async ({ body, set }: any) => {
        try {
            const { email } = body;

            const existing = await mAuth.findOne({ email });
            if (existing) {
                set.status = 400;
                return { success: false, error: 'Email já cadastrado' };
            }

            // Handle Roles
            let userRoles = ['user'];
            if (body.roles && Array.isArray(body.roles)) {
                userRoles = body.roles;
            } else if (body.role) {
                userRoles = [body.role];
            }

            const userData = {
                ...body,
                roles: userRoles,
                // Generate simple 30-char random token
                access_token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 7)
            };
            const newUser = new mAuth(userData);
            // Default role is 'user'. 
            // In a real app, hash password here: newUser.password = await Bun.password.hash(body.password);

            await newUser.save();

            return {
                success: true,
                message: 'Usuário cadastrado com sucesso',
                user: newUser
            };

        } catch (error: any) {
            set.status = 500;
            return { success: false, error: error.message };
        }
    }, {
        body: t.Object({
            name: t.String(),
            email: t.String(),
            password: t.String(),
            role: t.Optional(t.String()), // Legacy
            roles: t.Optional(t.Array(t.String())) // New multi-role support
        })
    })

    // List users (Admin only)
    .get('/users', async () => {
        const users = await mAuth.find().sort({ createdAt: -1 });
        return { success: true, count: users.length, data: users };
    })

    // Update User (Admin)
    .put('/users/:id', async ({ params, body, set }: any) => {
        try {
            const { id } = params;
            // Prevent changing password properly here if needed, but for now allow basic updates
            // If password is included and empty, remove it to avoid overwriting with empty
            if (body.password === '') delete body.password;

            // Handle roles update 
            // The body might come as comma separated string or array
            if (typeof body.roles === 'string') {
                // split by comma and trim
                body.roles = body.roles.split(',').map((r: string) => r.trim());
            }

            const updatedUser = await mAuth.findByIdAndUpdate(id, body, { new: true });

            if (!updatedUser) {
                set.status = 404;
                return { success: false, error: 'Usuário não encontrado' };
            }

            // Log Update
            try {
                await mLogs.create({
                    action: 'UPDATE_USER',
                    details: `User updated: ${updatedUser.email}. Roles: ${updatedUser.roles}`,
                    user: 'admin',
                    level: 'warning'
                });
            } catch (e) { }

            return { success: true, message: 'Usuário atualizado', user: updatedUser };
        } catch (error: any) {
            set.status = 500;
            return { success: false, error: error.message };
        }
    });
