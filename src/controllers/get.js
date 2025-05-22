import Organization from "../model/org.js";
import Team from "../model/Team.js";
import Project from "../model/project/Project.js";
import Section from "../model/project/Section.js";
import Task from "../model/project/Task.js";
import User from "../model/User.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiRes } from "../utils/ApiRes.js";
import { asyncFunc } from "../utils/asyncFunc.js";


const getUser = asyncFunc(async(req, res)=>{
  
});


export {
    getUser,
}