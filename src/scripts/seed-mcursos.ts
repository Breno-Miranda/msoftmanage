import mongoose from 'mongoose';
import { db } from '../config/database'; // bun-api DB
import { connectCursosMongo } from '../config/mongoCursos'; // mcursos DB
import { mAuth } from '../models/mAuth';
import { Category } from '../modules/mCursos/models/Category';
import { Course } from '../modules/mCursos/models/Course';
import { Module } from '../modules/mCursos/models/Module';
import { Lesson } from '../modules/mCursos/models/Lesson';
import crypto from 'crypto';

const run = async () => {
    console.log('🌱 Iniciando seed do M-Cursos...');
    await db.connect();
    const cursosDb = connectCursosMongo();

    // 1. Criar Usuários no DB Principal (se não existirem)
    console.log('👤 Criando usuários...');
    const admin = await mAuth.findOneAndUpdate(
        { email: 'admin@mcursos.com' },
        { name: 'Admin Supremo', roles: ['admin'], status: 'active', password: 'hashedpassword' },
        { upsert: true, new: true }
    );

    const inst1 = await mAuth.findOneAndUpdate(
        { email: 'instrutor1@mcursos.com' },
        { name: 'Professor Node', roles: ['instructor'], status: 'active' },
        { upsert: true, new: true }
    );

    const inst2 = await mAuth.findOneAndUpdate(
        { email: 'instrutor2@mcursos.com' },
        { name: 'Professora Docker', roles: ['instructor'], status: 'active' },
        { upsert: true, new: true }
    );

    for (let i = 1; i <= 5; i++) {
        await mAuth.findOneAndUpdate(
            { email: `aluno${i}@mcursos.com` },
            { name: `Aluno ${i}`, roles: ['student'], status: 'active' },
            { upsert: true }
        );
    }

    // 2. Limpar e criar categorias
    console.log('📂 Criando categorias...');
    await Category.deleteMany({});
    const catBackend = await Category.create({ name: 'Backend', slug: 'backend' });
    const catDevOps = await Category.create({ name: 'DevOps', slug: 'devops' });
    const catFrontend = await Category.create({ name: 'Frontend', slug: 'frontend' });

    // 3. Criar Cursos
    console.log('🎓 Criando cursos...');
    await Course.deleteMany({});
    await Module.deleteMany({});
    await Lesson.deleteMany({});

    const courseNode = await Course.create({
        title: 'Node.js Completo',
        slug: 'nodejs-completo',
        shortDescription: 'Aprenda Backend do zero ao avançado',
        instructorId: inst1._id.toString(),
        categoryId: catBackend._id,
        level: 'BEGINNER',
        status: 'PUBLISHED',
        price: 99.90
    });

    const courseDocker = await Course.create({
        title: 'Docker Masterclass',
        slug: 'docker-masterclass',
        shortDescription: 'Containers para devs',
        instructorId: inst2._id.toString(),
        categoryId: catDevOps._id,
        level: 'INTERMEDIATE',
        status: 'PUBLISHED',
        price: 0
    });

    // 4. Criar Módulos e Aulas
    console.log('📚 Criando módulos e aulas...');
    const modNode1 = await Module.create({
        courseId: courseNode._id.toString(),
        title: 'Introdução',
        order: 1
    });

    await Lesson.create({
        moduleId: modNode1._id.toString(),
        courseId: courseNode._id.toString(),
        title: 'O que é Node?',
        type: 'VIDEO',
        content: 'https://cdn.mcursos.com/videos/node-intro.mp4',
        duration: 15,
        order: 1,
        status: 'PUBLISHED',
        isPreview: true
    });

    console.log('✅ Seed finalizado com sucesso!');
    process.exit(0);
};

run().catch(err => {
    console.error(err);
    process.exit(1);
});
