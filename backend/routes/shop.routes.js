/**
 * Shop Routes - Restaurant CRUD with city-based caching
 */
import express from "express";
import {
  createEditShop,
  getMyShop,
  getShopByCity,
} from "../controllers/shop.controllers.js";
import isAuth from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";
import { cacheMiddleware } from "../config/cache.js";

const shopRouter = express.Router();

shopRouter.post("/create-edit", isAuth, upload.single("image"), createEditShop);
shopRouter.get("/get-my", isAuth, getMyShop);
shopRouter.get("/get-by-city/:city", isAuth, cacheMiddleware(60), getShopByCity);

export default shopRouter;
