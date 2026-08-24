import { Elysia } from 'elysia';
import { categoryRoutes } from './routes/categoryRoutes';
import { courseRoutes } from './routes/courseRoutes';
import { moduleRoutes } from './routes/moduleRoutes';
import { lessonRoutes } from './routes/lessonRoutes';
import { enrollmentRoutes } from './routes/enrollmentRoutes';
import { progressRoutes } from './routes/progressRoutes';

export const mCursosRoutes = new Elysia({ prefix: '/m-cursos' })
    .use(categoryRoutes)
    .use(courseRoutes)
    .use(moduleRoutes)
    .use(lessonRoutes)
    .use(enrollmentRoutes)
    .use(progressRoutes);
