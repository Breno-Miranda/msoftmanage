import { Elysia, t } from 'elysia';
import { Module } from '../models/Module';
import { requireActiveUser } from '../../../middleware/requireAuth';

export const moduleRoutes = new Elysia({ prefix: '/modules' })
    .get('/course/:courseId', async ({ params: { courseId } }) => {
        const modules = await Module.find({ courseId }).sort({ order: 1 });
        return { data: modules };
    })
    .use(requireActiveUser)
    .post('/', async ({ body }: any) => {
        const newModule = await Module.create(body);
        return { data: newModule };
    }, {
        body: t.Object({
            courseId: t.String(),
            title: t.String(),
            description: t.Optional(t.String()),
            order: t.Optional(t.Number()),
        })
    })
    .put('/:id', async ({ params: { id }, body }: any) => {
        const updatedModule = await Module.findByIdAndUpdate(id, body, { new: true });
        if (!updatedModule) throw new Error('Module not found');
        return { data: updatedModule };
    }, {
        body: t.Object({
            title: t.Optional(t.String()),
            description: t.Optional(t.String()),
            order: t.Optional(t.Number()),
        })
    })
    .delete('/:id', async ({ params: { id } }) => {
        await Module.findByIdAndDelete(id);
        return { success: true };
    });
