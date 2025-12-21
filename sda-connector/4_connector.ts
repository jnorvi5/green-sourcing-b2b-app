import express, { Request, Response, Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { bearerAuth, validateJurisdictions } from "./3_auth_middleware";
import {
    EpdCategoryTree,
    EpdCategory,
    StatisticsMeasurement,
    Amount,
    PartnerError,
} from "./2_types";

const supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_KEY || ""
);

const router = Router();

router.get("/epds/categories", bearerAuth, async (req: Request, res: Response) => {
    try {
        const { data: categories, error } = await supabase
            .from("categories")
            .select("*")
            .is("parent_id", null)
            .order("display_name");

        if (error) throw error;

        const buildTree = async (parentId: string | null): Promise<EpdCategoryTree[]> => {
            const { data: children, error } = await supabase
                .from("categories")
                .select("*")
                .eq("parent_id", parentId)
                .order("display_name");

            if (error) throw error;

            return Promise.all(
                (children || []).map(async (cat) => ({
                    id: cat.id,
                    displayName: cat.display_name,
                    masterformat: cat.masterformat || "00 00 00",
                    shortName: cat.short_name,
                    subcategories: await buildTree(cat.id),
                }))
            );
        };

        const results = await buildTree(null);
        return res.json({ results });
    } catch (err) {
        console.error("GET /epds/categories error:", err);
        return res.status(500).json({
            title: "Internal Server Error",
            detail: "Failed to fetch categories.",
            type: "INTERNAL_ERROR",
        } as PartnerError);
    }
});

router.post(
    "/epds/categories/:categoryId/details:filter",
    bearerAuth,
    async (req: Request, res: Response) => {
        try {
            const { categoryId } = req.params;
            const filters = req.body || [];

            if (!categoryId) {
                return res.status(400).json({
                    title: "Invalid parameters",
                    detail: "categoryId is required.",
                    type: "INVALID_PARAMS",
                } as PartnerError);
            }

            const { data: category, error: catError } = await supabase
                .from("categories")
                .select("*")
                .eq("id", categoryId)
                .single();

            if (catError || !category) {
                return res.status(404).json({
                    title: "Not Found",
                    detail: `Category ${categoryId} not found.`,
                    type: "NOT_FOUND",
                } as PartnerError);
            }

            let jurisdictionsFilter: string[] | null = null;
            for (const filter of filters) {
                if (filter.type === "jurisdictions" && filter.jurisdictions) {
                    jurisdictionsFilter = filter.jurisdictions;
                }
            }

            if (
                jurisdictionsFilter &&
                !validateJurisdictions(req.license?.jurisdictions || [], jurisdictionsFilter)
            ) {
                return res.status(403).json({
                    title: "Access Denied",
                    detail: "Your license does not cover the requested jurisdictions.",
                    type: "INVALID_LICENSE",
                } as PartnerError);
            }

            let query = supabase
                .from("materials")
                .select("*")
                .eq("category_id", categoryId);

            if (jurisdictionsFilter && jurisdictionsFilter.length > 0) {
                query = query.overlaps("jurisdictions", jurisdictionsFilter);
            }

            const { data: materials, error: matError } = await query;

            if (matError) throw matError;

            const stats = calculateAggregateStatistics(materials || []);

            const response: EpdCategory = {
                id: category.id,
                displayName: category.display_name,
                masterformat: category.masterformat || "00 00 00",
                shortName: category.short_name,
                epdCount: stats.epdCount,
                industryEpdCount: stats.industryEpdCount,
                genericEstimateCount: stats.genericEstimateCount,
                declaredUnit: {
                    qty: 1,
                    unit: "kg",
                },
                impactStatistics: stats.impactStatistics,
            };

            return res.json({ category: response });
        } catch (err) {
            console.error("POST /epds/categories/:categoryId/details:filter error:", err);
            return res.status(500).json({
                title: "Internal Server Error",
                detail: "Failed to fetch category details.",
                type: "INTERNAL_ERROR",
            } as PartnerError);
        }
    }
);

function calculateAggregateStatistics(materials: any[]) {
    const stages = [
        "a1a2a3",
        "a1",
        "a2",
        "a3",
        "a4",
        "a5",
        "b1",
        "b2",
        "b3",
        "b4",
        "b5",
        "b6",
        "b7",
        "c1",
        "c2",
        "c3",
        "c4",
        "d",
    ];

    const impactStatistics: any = {};

    for (const stage of stages) {
        const means = materials
            .map((m) => m[`${stage}_mean`])
            .filter((v) => v !== null && v !== undefined);

        if (means.length === 0) continue;

        const mean = means.reduce((a, b) => a + b, 0) / means.length;
        const min = Math.min(...means);
        const max = Math.max(...means);
        const sd = Math.sqrt(
            means.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / means.length
        );

        const sorted = means.sort((a, b) => a - b);
        const byPercentile: Record<string, Amount> = {};
        for (const p of [10, 20, 30, 40, 50, 60, 70, 80, 90]) {
            const index = Math.ceil((p / 100) * sorted.length) - 1;
            byPercentile[String(p)] = {
                qty: sorted[Math.max(0, index)],
                unit: "kgCO2e",
            };
        }

        const stageKey = stage.toUpperCase();
        impactStatistics[stageKey] = {
            mean: { qty: mean, unit: "kgCO2e" },
            min: { qty: min, unit: "kgCO2e" },
            max: { qty: max, unit: "kgCO2e" },
            sd,
            byPercentile,
        } as StatisticsMeasurement;
    }

    return {
        epdCount: materials.reduce((sum, m) => sum + (m.epd_count || 0), 0),
        industryEpdCount: materials.reduce(
            (sum, m) => sum + (m.industry_epd_count || 0),
            0
        ),
        genericEstimateCount: materials.reduce(
            (sum, m) => sum + (m.generic_estimate_count || 0),
            0
        ),
        impactStatistics,
    };
}

export default router;
