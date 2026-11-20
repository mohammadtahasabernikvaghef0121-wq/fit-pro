import { Router } from "express";
import { calculateBmi } from "../../lib/bmi";

const router = Router();

router.post("/calculate", (req, res) => {
  const body: unknown = req.body;
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "A JSON object with heightCm and weightKg is required." });
  }

  const { heightCm, weightKg } = body as Record<string, unknown>;
  if (typeof heightCm !== "number" || typeof weightKg !== "number") {
    return res.status(400).json({ error: "heightCm and weightKg must be numbers." });
  }

  const result = calculateBmi(heightCm, weightKg);
  if (!result) {
    return res.status(422).json({ error: "Height must be 100–250 cm and weight must be 20–300 kg." });
  }

  return res.json({
    heightCm,
    weightKg,
    bmi: Number(result.value.toFixed(2)),
    category: result.category,
  });
});

export default router;
