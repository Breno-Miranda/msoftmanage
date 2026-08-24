import { Elysia, t } from 'elysia';
import { Lesson } from '../models/Lesson';
import { requireActiveUser } from '../../../middleware/requireAuth';
import { saveAnyUpload } from '../../../services/uploadService';

export const lessonRoutes = new Elysia({ prefix: '/lessons' })
    .get('/module/:moduleId', async ({ params: { moduleId } }) => {
        // Alunos pegam PUBLISHED, admin pegaria tudo. Simplificação para FASE 2:
        const lessons = await Lesson.find({ moduleId }).sort({ order: 1 });
        return { data: lessons };
    })
    .get('/:id', async ({ params: { id } }) => {
        const lesson = await Lesson.findById(id);
        if (!lesson) throw new Error('Lesson not found');
        return { data: lesson };
    })
    .use(requireActiveUser)
    .post('/', async ({ body }: any) => {
        const lesson = await Lesson.create(body);
        return { data: lesson };
    }, {
        body: t.Object({
            moduleId: t.String(),
            courseId: t.String(),
            title: t.String(),
            type: t.String(), // VIDEO, TEXT, PDF, FILE, QUIZ
            content: t.String(),
            duration: t.Optional(t.Number()),
            order: t.Optional(t.Number()),
            status: t.Optional(t.String()),
            isPreview: t.Optional(t.Boolean()),
        })
    })
    .put('/:id', async ({ params: { id }, body }: any) => {
        const lesson = await Lesson.findByIdAndUpdate(id, body, { new: true });
        if (!lesson) throw new Error('Lesson not found');
        return { data: lesson };
    }, {
        body: t.Object({
            title: t.Optional(t.String()),
            type: t.Optional(t.String()),
            content: t.Optional(t.String()),
            duration: t.Optional(t.Number()),
            order: t.Optional(t.Number()),
            status: t.Optional(t.String()),
            isPreview: t.Optional(t.Boolean()),
        })
    })
    .delete('/:id', async ({ params: { id } }) => {
        await Lesson.findByIdAndDelete(id);
        return { success: true };
    })
    // Material Upload Endpoint
    .post('/upload', async ({ body }: any) => {
        const file = body.file as File;
        if (!file) throw new Error('No file uploaded');

        // Upload para pasta mcursos/materials
        const result = await saveAnyUpload(file, 'mcursos/materials');
        return { data: result };
    }, {
        body: t.Object({
            file: t.File()
        })
    });
