import express from "express";
import { auth } from "../middleware/auth.js";
import { getBrandProfile, saveBrandProfile } from "../controllers/brandController.js";

const brandRouter = express.Router();

brandRouter.get("/", auth, getBrandProfile);
brandRouter.post("/", auth, saveBrandProfile);

export default brandRouter;
