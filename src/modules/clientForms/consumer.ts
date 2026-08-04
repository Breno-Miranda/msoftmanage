import { ClientForm } from '../../models/clientForm';

type ClientFormEvent = {
    eventId: string;
    eventType: 'client.form.submitted';
    eventVersion: 1;
    occurredAt: string;
    source: string;
    lead: { name: string; email: string; phone: string; message: string };
    consent: { granted: true; textVersion: string };
};

type ClientFormRepository = {
    updateOne(filter: unknown, update: unknown, options: unknown): Promise<unknown>;
};

const validText = (value: unknown, max: number) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;

const isValidEvent = (event: unknown): event is ClientFormEvent => {
    if (!event || typeof event !== 'object') return false;
    const value = event as Record<string, any>;
    return typeof value.eventId === 'string'
        && value.eventType === 'client.form.submitted'
        && value.eventVersion === 1
        && typeof value.source === 'string'
        && !Number.isNaN(Date.parse(value.occurredAt))
        && validText(value.lead?.name, 120)
        && validText(value.lead?.email, 180)
        && validText(value.lead?.phone, 30)
        && validText(value.lead?.message, 3000)
        && value.consent?.granted === true
        && validText(value.consent?.textVersion, 120);
};

export const persistClientFormEvent = async (event: unknown, repository: ClientFormRepository = ClientForm) => {
    if (!isValidEvent(event)) throw new Error('Evento client.form.submitted inválido');
    await repository.updateOne(
        { eventId: event.eventId },
        {
            $setOnInsert: {
                eventId: event.eventId,
                source: event.source,
                name: event.lead.name.trim(),
                email: event.lead.email.trim().toLowerCase(),
                phone: event.lead.phone.trim(),
                message: event.lead.message.trim(),
                consentVersion: event.consent.textVersion,
                occurredAt: new Date(event.occurredAt),
            },
        },
        { upsert: true },
    );
};
