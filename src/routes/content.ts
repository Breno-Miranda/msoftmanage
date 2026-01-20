import { Elysia, t } from 'elysia';
import { mContent } from '../models/mContent';

export const contentRoutes = new Elysia({ prefix: '/content' })
    .get('/:key', async ({ params }: any) => {
        try {
            const content = await mContent.findOne({ key: params.key });
            if (!content) {
                return { success: false, error: 'Conteúdo não encontrado' };
            }
            return { success: true, data: content.data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    })
    .post('/', async ({ body, set }: any) => {
        try {
            const { key, data } = body;
            const content = await mContent.findOneAndUpdate(
                { key },
                { data },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            return { success: true, data: content };
        } catch (error: any) {
            set.status = 500;
            return { success: false, error: error.message };
        }
    }, {
        body: t.Object({
            key: t.String(),
            data: t.Object({}) // Accepts any object structure
        })
    });
