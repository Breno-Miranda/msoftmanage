// Tipos globais e utilitários para a aplicação

/**
 * Resposta padrão da API
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    details?: any;
}

/**
 * Resposta paginada
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/**
 * Query params para listagem
 */
export interface ListQueryParams {
    page?: string;
    limit?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

/**
 * Status de conexão do banco
 */
export interface DatabaseStatus {
    isConnected: boolean;
    readyState: number;
    host?: string;
    database?: string;
}

/**
 * Configurações do ambiente
 */
export interface EnvironmentConfig {
    MONGODB_URI: string;
    PORT: number;
    NODE_ENV: 'development' | 'production' | 'test';
}

/**
 * Tipo utilitário para tornar campos opcionais
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Tipo utilitário para tornar campos obrigatórios
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
