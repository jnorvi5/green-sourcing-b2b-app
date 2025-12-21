import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_KEY || ""
);

declare global {
    namespace Express {
        interface Request {
            license?: {
                key: string;
                jurisdictions: string[];
                active: boolean;
            };
        }
    }
}

export const bearerAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                title: "Unauthorized",
                detail: "License token is missing.",
                type: "NO_LICENSE",
            });
        }

        const match = authHeader.match(/^Bearer\s+(.+)$/);
        if (!match || !match[1]) {
            return res.status(401).json({
                title: "Unauthorized",
                detail: "Invalid Authorization header format. Use: Bearer <token>",
                type: "INVALID_PARAMS",
            });
        }

        const token = match[1].trim();

        const { data: apiKey, error } = await supabase
            .from("api_keys")
            .select("*")
            .eq("key", token)
            .single();

        if (error || !apiKey) {
            return res.status(403).json({
                title: "License expired",
                detail: "License token is invalid or expired.",
                type: "INVALID_LICENSE",
            });
        }

        if (!apiKey.active) {
            return res.status(403).json({
                title: "License expired",
                detail: "License token has been deactivated.",
                type: "INVALID_LICENSE",
            });
        }

        if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
            return res.status(403).json({
                title: "License expired",
                detail: "License token has expired.",
                type: "INVALID_LICENSE",
            });
        }

        await supabase
            .from("api_keys")
            .update({ last_used_at: new Date().toISOString() })
            .eq("id", apiKey.id)
            .catch(() => { });

        req.license = {
            key: apiKey.key,
            jurisdictions: apiKey.jurisdictions,
            active: apiKey.active,
        };

        next();
    } catch (err) {
        console.error("Auth middleware error:", err);
        return res.status(500).json({
            title: "Internal Server Error",
            detail: "An error occurred during authentication.",
            type: "INTERNAL_ERROR",
        });
    }
};

export const validateJurisdictions = (
    licenseJurisdictions: string[],
    requestedJurisdictions: string[]
): boolean => {
    if (!requestedJurisdictions || requestedJurisdictions.length === 0) {
        return true;
    }

    return requestedJurisdictions.every((j) =>
        licenseJurisdictions.some((lj) => lj === j || lj === "*")
    );
};
