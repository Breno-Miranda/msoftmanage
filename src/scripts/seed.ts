import { connectMongo } from '../config/mongo';
import { mAuth } from '../models/mAuth';
import { mBlog } from '../models/mBlogs';

async function runSeed() {
    console.log('🌱 Inicializando seed local MSOFT...');

    // Segurança: impede rodar em produção (caso o DEV seja rodado no cluster externo)
    // Localmente no docker-compose o URI costuma apontar para 'msoft-manage-mongodb'
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bun-api';
    if (uri.includes('+srv') || uri.includes('cluster') || process.env.NODE_ENV === 'cloud_prod') {
        console.error('⚠️ ALERTA: Tentativa de rodar seed local apontando para Production Cloud. Abortado!');
        process.exit(1);
    }

    try {
        await connectMongo();
        console.log('✅ Conectado ao banco. Preparando dados do usuário...');

        const loginEmail = 'brenossan'; 
        const userPassword = 'brenof250';

        // Tenta encontrar o usuário "brenossan"
        const existingAdmin = await mAuth.findOne({ email: loginEmail });

        if (existingAdmin) {
            console.log('⚠️ Usuário brenossan já existe! Atualizando credenciais para o padrão local...');
            existingAdmin.password = userPassword;
            // Garante que o usuário possua permissão de admin
            if (!existingAdmin.roles.includes('admin')) {
                existingAdmin.roles.push('admin');
            }
            await existingAdmin.save();
            console.log('✅ Usuário brenossan atualizado!');
        } else {
            console.log('👤 Criando novo usuário admin master: brenossan');
            await mAuth.create({
                name: 'Breno Miranda',
                email: loginEmail,
                password: userPassword,
                roles: ['admin', 'premium', 'user'],
                status: 'active',
                provider: 'local',
                access_token: 'breno-local-admin-token'
            });
            console.log('✅ Usuário configurado e inserido com sucesso!');
        }

        console.log('📝 Verificando se é necessário inserir as postagens iniciais do blog...');
        const blogsCount = await mBlog.countDocuments();
        if (blogsCount === 0) {
            console.log('📝 Nenhuma postagem encontrada. Criando postagens iniciais...');
            await mBlog.create([
                {
                    title: 'A Evolução da Inteligência Artificial em 2026',
                    slug: 'evolucao-inteligencia-artificial-2026',
                    subtitle: 'Como modelos generativos continuam a transformar o mercado corporativo',
                    content: 'Nos últimos anos, acompanhamos um salto imenso na IA generativa. Tecnologias que antes eram experimentais agora são fundamentais para empresas e ferramentas de desenvolvimento de software. A produtividade dos desenvolvedores e profissionais do mercado atingiu níveis históricos graças a essas metodologias.',
                    description: 'Uma análise de como a IA altera os modelos de negócio e a construção de produtos de software em 2026.',
                    author: 'Breno Miranda',
                    imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000',
                    tags: ['Inteligência Artificial', 'Tecnologia', 'Inovação'],
                    category: 'Tecnologia',
                    published: true,
                    featured: true,
                    views: 0
                },
                {
                    title: 'Como as Arquiteturas White Label Estão Transformando os SaaS',
                    slug: 'arquiteturas-white-label-saas',
                    subtitle: 'Reduzindo custos de desenvolvimento através de plataformas personalizáveis',
                    content: 'Em mercados altamente competitivos, o time-to-market é a métrica mais valiosa. O uso de arquiteturas White Label agiliza significativamente a implantação de novos produtos garantindo a segurança de um core testado em escala.\n\nSólidas plataformas estão integrando ecossistemas para lançamentos quase instantâneos de novos nichos.',
                    description: 'Por que soluções White Label como o MSOFT Marketplace estão em ascensão em negócios digitais.',
                    author: 'Breno Miranda',
                    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000',
                    tags: ['White Label', 'SaaS', 'Arquitetura'],
                    category: 'White Label',
                    published: true,
                    featured: false,
                    views: 0
                }
            ]);
            console.log('✅ Postagens inseridas com sucesso!');
        }

        console.log('🚀 Seed executado com total sucesso. Finalizando...');
        process.exit(0);

    } catch (err) {
        console.error('❌ Erro crítico ao rodar seed local:', err);
        process.exit(1);
    }
}

// Inicializa a execução
runSeed();
