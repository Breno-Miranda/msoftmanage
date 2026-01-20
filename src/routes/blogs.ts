import { Elysia, t } from 'elysia';
import { mBlog } from '../models/mBlogs';

export const blogRoutes = new Elysia({ prefix: '/blogs' })
    .get('/', async () => {
        try {
            const blogs = await mBlog.find({ published: true }).sort({ createdAt: -1 });
            return { success: true, data: blogs };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    })
    .get('/all', async () => {
        // Admin route to fetch all, including drafts
        try {
            const blogs = await mBlog.find().sort({ createdAt: -1 });
            return { success: true, data: blogs };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    })
    .get('/:slug', async ({ params }: any) => {
        try {
            const blog = await mBlog.findOne({ slug: params.slug });
            if (!blog) {
                return { success: false, error: 'Post não encontrado' };
            }
            // Increment views
            blog.views += 1;
            await blog.save();

            return { success: true, data: blog };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    })
    .post('/', async ({ body, set }: any) => {
        try {
            const newBlog = new mBlog(body);
            await newBlog.save();
            return { success: true, data: newBlog };
        } catch (error: any) {
            set.status = 500;
            return { success: false, error: error.message };
        }
    }, {
        body: t.Object({
            title: t.String(),
            slug: t.String(),
            subtitle: t.Optional(t.String()),
            content: t.String(),
            description: t.Optional(t.String()),
            author: t.String(),
            imageUrl: t.Optional(t.String()),
            tags: t.Optional(t.Array(t.String())),
            category: t.Optional(t.String()),
            published: t.Optional(t.Boolean()),
            featured: t.Optional(t.Boolean())
        })
    })
    .put('/:id', async ({ params, body, set }: any) => {
        try {
            const blog = await mBlog.findByIdAndUpdate(params.id, body, { new: true });
            if (!blog) {
                set.status = 404;
                return { success: false, error: 'Post não encontrado' };
            }
            return { success: true, data: blog };
        } catch (error: any) {
            set.status = 500;
            return { success: false, error: error.message };
        }
    })
    .delete('/:id', async ({ params, set }: any) => {
        try {
            const blog = await mBlog.findByIdAndDelete(params.id);
            if (!blog) {
                set.status = 404;
                return { success: false, error: 'Post não encontrado' };
            }
            return { success: true, message: 'Post removido' };
        } catch (error: any) {
            set.status = 500;
            return { success: false, error: error.message };
        }
    });
