import express, { Request, Response } from "express";

const app = express();
const PORT =  5004;

// Middleware to parse JSON
app.use(express.json());

// Test endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Backend service is running!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
