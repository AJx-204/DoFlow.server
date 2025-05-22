import { Router } from "express";
import { verifyJwt } from '../middleware/auth.middle.js';
import { getUser } from "../controllers/get.js";


const getRouter = Router();


getRouter.route('/getUser').get(verifyJwt, getUser);


export default getRouter;