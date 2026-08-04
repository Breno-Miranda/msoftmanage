import amqp, { type Channel, type ChannelModel, type ConsumeMessage } from 'amqplib';

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

type Topology = {
    exchange?: string;
    exchangeType?: 'direct' | 'fanout' | 'headers' | 'topic';
    queue?: string;
    routingKey?: string;
    durable?: boolean;
};

type ConsumerDefinition = {
    queue: string;
    callback: (message: Json) => Promise<void> | void;
    topology?: Topology;
};

const DEFAULT_RECONNECT_MS = 5_000;

/**
 * Conexão AMQP singleton para processos do m-manage.
 * URL e credenciais vivem exclusivamente em RABBITMQ_URL no ambiente.
 */
export class RabbitMQService {
    private static instance: RabbitMQService | undefined;
    private connection: ChannelModel | undefined;
    private channel: Channel | undefined;
    private connecting: Promise<Channel> | undefined;
    private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    private closed = false;
    private readonly consumers: ConsumerDefinition[] = [];

    static getInstance() {
        if (!RabbitMQService.instance) RabbitMQService.instance = new RabbitMQService();
        return RabbitMQService.instance;
    }

    private url() {
        const url = process.env.RABBITMQ_URL;
        if (!url) throw new Error('RABBITMQ_URL não configurada');
        return url;
    }

    private scheduleReconnect() {
        if (this.closed || this.reconnectTimer) return;
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = undefined;
            void this.connect().catch(() => this.scheduleReconnect());
        }, DEFAULT_RECONNECT_MS);
    }

    private invalidateConnection() {
        this.connection = undefined;
        this.channel = undefined;
        this.connecting = undefined;
        this.scheduleReconnect();
    }

    async connect(): Promise<Channel> {
        if (this.channel) return this.channel;
        if (this.connecting) return this.connecting;

        this.closed = false;
        this.connecting = (async () => {
            const connection = await amqp.connect(this.url());
            connection.on('error', () => undefined);
            connection.on('close', () => this.invalidateConnection());
            const channel = await connection.createChannel();
            channel.on('error', () => undefined);
            channel.on('close', () => this.invalidateConnection());
            this.connection = connection;
            this.channel = channel;
            this.connecting = undefined;
            console.info('[rabbitmq] conectado');
            await this.restoreConsumers();
            return channel;
        })();

        try {
            return await this.connecting;
        } catch (error) {
            this.connecting = undefined;
            this.scheduleReconnect();
            console.error('[rabbitmq] conexão indisponível');
            throw error;
        }
    }

    private async declareTopology(channel: Channel, topology: Topology = {}) {
        const durable = topology.durable ?? true;
        if (topology.exchange) {
            await channel.assertExchange(topology.exchange, topology.exchangeType ?? 'topic', { durable });
        }
        if (topology.queue) {
            await channel.assertQueue(topology.queue, { durable });
            if (topology.exchange) {
                await channel.bindQueue(topology.queue, topology.exchange, topology.routingKey ?? '');
            }
        }
    }

    async publish(exchange: string, routingKey: string, message: Json, topology: Topology = {}) {
        const channel = await this.connect();
        const effectiveTopology: Topology = { ...topology, exchange: exchange || undefined };
        await this.declareTopology(channel, effectiveTopology);
        const accepted = channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), {
            persistent: true,
            contentType: 'application/json',
        });
        if (!accepted) throw new Error('RabbitMQ não aceitou a publicação');
        console.info('[rabbitmq] mensagem publicada', { exchange: exchange || '(default)', routingKey });
    }

    async consume(queue: string, callback: (message: Json) => Promise<void> | void, topology?: Topology) {
        const definition = { queue, callback, topology: { ...topology, queue } };
        this.consumers.push(definition);
        await this.startConsumer(definition);
    }

    private async restoreConsumers() {
        for (const definition of this.consumers) await this.startConsumer(definition);
    }

    private async startConsumer(definition: ConsumerDefinition) {
        const channel = await this.connect();
        await this.declareTopology(channel, definition.topology);
        await channel.consume(definition.queue, async (delivery: ConsumeMessage | null) => {
            if (!delivery) return;
            try {
                const message = JSON.parse(delivery.content.toString()) as Json;
                await definition.callback(message);
                channel.ack(delivery);
                console.info('[rabbitmq] mensagem consumida', { queue: definition.queue });
            } catch {
                channel.nack(delivery, false, false);
                console.error('[rabbitmq] mensagem rejeitada', { queue: definition.queue });
            }
        }, { noAck: false });
    }

    async close() {
        this.closed = true;
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = undefined;
        const channel = this.channel;
        const connection = this.connection;
        this.channel = undefined;
        this.connection = undefined;
        this.connecting = undefined;
        await channel?.close().catch(() => undefined);
        await connection?.close().catch(() => undefined);
    }
}

export const rabbitMQ = RabbitMQService.getInstance();
