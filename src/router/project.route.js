import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middle.js";
import { authorizeOrgRoles, getOrgAndRole } from "../middleware/org.middle.js";
import { authorizeProjectRoles, getProjectandRole } from "../middleware/project.middle.js";
import { 
    createProject,
    updateProject, 
    deleteProject,
    addMemberInProject,
    addTeamInProject,
} from "../controllers/project.control.js";



const projectRouter = Router();


projectRouter.route('/:orgId/createProject').post(verifyJwt, getOrgAndRole, authorizeOrgRoles(['admin', 'moderator', 'leader']), createProject);

projectRouter.route('/:orgId/updateProject/:projectId').put(verifyJwt, getOrgAndRole, getProjectandRole, authorizeProjectRoles(['admin', 'moderator', 'leader']), updateProject);

projectRouter.route('/:orgId/deleteProject/:projectId').delete(verifyJwt, getOrgAndRole, getProjectandRole, authorizeProjectRoles(['admin']), deleteProject);

projectRouter.route('/:orgId/addMemberInProject/:projectId/:memberId').post(verifyJwt, getOrgAndRole, getProjectandRole, authorizeProjectRoles(['admin', 'moderator', 'leader']), addMemberInProject);

projectRouter.route('/:orgId/addTeamInProject/:projectId/:teamId').post(verifyJwt, getOrgAndRole, getProjectandRole, authorizeProjectRoles(['admin', 'moderator', 'leader']), addTeamInProject);


export default projectRouter;