import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import authRouter from "./router/auth.route.js";
import orgRouter from "./router/org.route.js";
import errorHandler from "./utils/errorHandler.js";
import teamRouter from "./router/team.route.js";
import projectRouter from "./router/project.route.js";


const app = express();

// middleware

app.use(cors({
    credentials:true
}));
app.use(express.json());
app.use(express.urlencoded({
    extended:true
}));
app.use(cookieParser());
app.use(express.static('public'));

// routes

app.use('/api/v1/auth', authRouter)

app.use('/api/v1/org', orgRouter)

app.use('/api/v1/team', teamRouter)

app.use('/api/v1/project', projectRouter)


app.use(errorHandler);


export default app;