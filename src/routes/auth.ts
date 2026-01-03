import { Elysia, t } from 'elysia';
import { mAuth } from '../models/mAuth';

export const authRoutes = new Elysia({ prefix: '/auth' })
    // Login
    .post('/login', async ({ body, set }: any) => {
        try {
            const { email, password } = body;

            // Find user (select password explicitly)
            const user = await mAuth.findOne({ email }).select('+password');
            if (!user) {
                set.status = 401;
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

            // Return user info (toJSON handles removing password)
            return {
                success: true,
                user: user,
                // In a real app, generate a JWT here
                token: `mock-jwt-token-${user.id}`
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

            const newUser = new mAuth(body);
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
            role: t.Optional(t.String()) // Allow passing role for seeding admin
        })
    })

    // List users (Admin only - simplified for now)
    .get('/users', async () => {
        const users = await mAuth.find().sort({ createdAt: -1 });
        return { success: true, count: users.length, data: users };
    });
