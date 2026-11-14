import logger from '../config/logger.js';
import env from '../config/env.js';
import { z } from 'zod';
import * as terrariumRepo from '../../repositories/terrariumRepository.js';
import {
    calculateTerrariumEstimate,
    createTerrariumQuoteSnapshot,
    TerrariumDesignerProductSchema
} from '../../shared/terrarium.js';
import {
    AdminTerrariumQuoteSchema,
    CreateTerrariumProjectSchema
} from '../../schemas/terrariumSchema.js';
import {
    sendTerrariumProjectSubmittedEmail,
    sendTerrariumQuoteAvailableEmail
} from '../services/emailService.js';

const getProjectProductIds = (configuration) => [...new Set([
    configuration.enclosureProductId,
    ...configuration.objects.map((item) => item.productId)
])];

const sendError = (res, error, fallback) => {
    if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Dane konfiguracji są nieprawidłowe', details: error.issues });
    }
    if (error.code) {
        logger.error('Terrarium request failed', { errorCode: error.code, errorName: error.name || 'Error' });
        return res.status(500).json({ error: fallback });
    }
    return res.status(400).json({ error: error.message || fallback });
};

const isValidProjectId = (projectId) => z.uuid().safeParse(projectId).success;

export const getCatalog = async (_req, res) => {
    try {
        const products = await terrariumRepo.listConfiguratorProducts();
        const eligibleProducts = products.filter((product) => (
            TerrariumDesignerProductSchema.safeParse(product.specs?.terrariumDesigner).success
        ));
        res.json({ products: eligibleProducts });
    } catch (error) {
        logger.error('Terrarium catalog fetch failed', { errorMessage: error.message });
        res.status(500).json({ error: 'Nie udało się pobrać katalogu konfiguratora' });
    }
};

export const createProject = async (req, res) => {
    try {
        const configuration = CreateTerrariumProjectSchema.parse(req.body);
        const ids = getProjectProductIds(configuration);
        const products = await terrariumRepo.getProductsByIds(ids);
        if (products.length !== ids.length) {
            return res.status(400).json({ error: 'Jeden z wybranych produktów nie istnieje w katalogu' });
        }

        const estimate = calculateTerrariumEstimate(configuration, products);
        const project = await terrariumRepo.createProject({
            userId: req.user.id,
            configuration,
            estimate
        });

        try {
            await sendTerrariumProjectSubmittedEmail(project.id);
        } catch (emailError) {
            logger.warn('Terrarium request notification failed', {
                projectId: project.id,
                errorMessage: emailError?.message || 'Unknown email error'
            });
        }

        return res.status(201).json({ project, estimate });
    } catch (error) {
        return sendError(res, error, 'Nie udało się zapisać projektu');
    }
};

export const getMyProjects = async (req, res) => {
    try {
        const projects = await terrariumRepo.findProjectsByUser(req.user.id);
        res.json(projects.map((project) => ({ ...project, shippingAmountCents: env.ORDER_SHIPPING_CENTS })));
    } catch (error) {
        logger.error('Terrarium project history fetch failed', { userId: req.user.id, errorMessage: error.message });
        res.status(500).json({ error: 'Nie udało się pobrać projektów terrarium' });
    }
};

export const getMyProject = async (req, res) => {
    if (!isValidProjectId(req.params.projectId)) return res.status(400).json({ error: 'Id projektu jest nieprawidłowe' });
    try {
        const project = await terrariumRepo.findProjectDetailByUser(req.params.projectId, req.user.id);
        if (!project) return res.status(404).json({ error: 'Nie znaleziono projektu terrarium' });
        return res.json({ ...project, shippingAmountCents: env.ORDER_SHIPPING_CENTS });
    } catch (error) {
        logger.error('Terrarium project fetch failed', { userId: req.user.id, errorMessage: error.message });
        return res.status(500).json({ error: 'Nie udało się pobrać projektu terrarium' });
    }
};

export const acceptMyProjectQuote = async (req, res) => {
    if (!isValidProjectId(req.params.projectId)) return res.status(400).json({ error: 'Id projektu jest nieprawidłowe' });
    try {
        const existing = await terrariumRepo.findProjectByUser(req.params.projectId, req.user.id);
        if (!existing) return res.status(404).json({ error: 'Nie znaleziono projektu terrarium' });
        if (existing.status === 'accepted' || existing.status === 'payment_pending' || existing.status === 'paid') {
            return res.json(existing);
        }
        if (existing.status !== 'quoted') {
            return res.status(409).json({ error: 'Ten projekt nie ma oferty gotowej do akceptacji' });
        }
        if (!existing.quote_expires_at || new Date(existing.quote_expires_at) <= new Date()) {
            return res.status(410).json({ error: 'Oferta wygasła. Skontaktuj się ze sklepem, aby przygotować nową.' });
        }

        const project = await terrariumRepo.acceptProjectQuote(req.params.projectId, req.user.id);
        if (!project) return res.status(409).json({ error: 'Oferta zmieniła się. Odśwież stronę i sprawdź jej status.' });
        return res.json(project);
    } catch (error) {
        logger.error('Terrarium quote acceptance failed', { userId: req.user.id, errorMessage: error.message });
        return res.status(500).json({ error: 'Nie udało się zaakceptować oferty' });
    }
};

export const getAdminProjects = async (_req, res) => {
    try {
        res.json(await terrariumRepo.findAllProjects());
    } catch (error) {
        logger.error('Admin terrarium request list failed', { errorMessage: error.message });
        res.status(500).json({ error: 'Nie udało się pobrać zgłoszeń terrarium' });
    }
};

export const getAdminProject = async (req, res) => {
    if (!isValidProjectId(req.params.projectId)) return res.status(400).json({ error: 'Id projektu jest nieprawidłowe' });
    try {
        const project = await terrariumRepo.findAdminProject(req.params.projectId);
        if (!project) return res.status(404).json({ error: 'Nie znaleziono projektu terrarium' });
        return res.json(project);
    } catch (error) {
        logger.error('Admin terrarium request fetch failed', { errorMessage: error.message });
        return res.status(500).json({ error: 'Nie udało się pobrać szczegółów projektu' });
    }
};

export const createAdminQuote = async (req, res) => {
    if (!isValidProjectId(req.params.projectId)) return res.status(400).json({ error: 'Id projektu jest nieprawidłowe' });
    try {
        const input = AdminTerrariumQuoteSchema.parse(req.body);
        const project = await terrariumRepo.findAdminProject(req.params.projectId);
        if (!project) return res.status(404).json({ error: 'Nie znaleziono projektu terrarium' });
        if (!['submitted', 'quoted'].includes(project.status)) {
            return res.status(409).json({ error: 'Na tym etapie nie można zmienić oferty' });
        }

        const estimate = calculateTerrariumEstimate(project.configuration, project.products);
        const quote = createTerrariumQuoteSnapshot(estimate, input.items);
        const validUntil = new Date(Date.now() + input.validForDays * 24 * 60 * 60 * 1000);
        const updated = await terrariumRepo.updateAdminQuote({
            projectId: project.id,
            adminUserId: req.user.id,
            quote,
            validUntil,
            message: input.message
        });
        if (!updated) return res.status(409).json({ error: 'Projekt zmienił status. Odśwież listę zgłoszeń.' });
        try {
            await sendTerrariumQuoteAvailableEmail({
                projectId: project.id,
                email: project.customer_email,
                totalCents: quote.totalCents,
                expiresAt: validUntil
            });
        } catch (emailError) {
            logger.warn('Terrarium quote notification failed', {
                projectId: project.id,
                errorMessage: emailError?.message || 'Unknown email error'
            });
        }
        return res.json(updated);
    } catch (error) {
        return sendError(res, error, 'Nie udało się przygotować oferty');
    }
};
