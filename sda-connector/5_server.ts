import express from "express";
import cors from "cors";
import connector from "./4_connector";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

app.get("/health", (req, res) => {
    return res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.use("/", connector);

app.use((req, res) => {
    return res.status(404).json({
        title: "Not Found",
        detail: `The requested endpoint ${req.path} does not exist.`,
        type: "NOT_FOUND",
    });
});

app.use((err: any, req: any, res: any) => {
    console.error("Server error:", err);
    return res.status(500).json({
        title: "Internal Server Error",
        detail: err.message || "An unexpected error occurred.",
        type: "INTERNAL_ERROR",
    });
});

export default app;

if (process.env.NODE_ENV === "development") {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`SDA Connector running on http://localhost:${PORT}`);
        console.log(`Health check: GET http://localhost:${PORT}/health`);
    });
}
