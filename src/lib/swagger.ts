import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SPO Mini App API',
            version: '1.0.0',
            description: 'REST API для управления мероприятиями и профилем СПО',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local development server',
            },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'spo_session',
                },
            },
        },
    },
    apis: ['./src/app/api/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
