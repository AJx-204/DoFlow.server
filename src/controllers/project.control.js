import mongoose from "mongoose";
import Project from "../model/project/Project.js";
import Team from "../model/Team.js";
import User from "../model/User.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiRes } from "../utils/ApiRes.js";
import { asyncFunc } from "../utils/asyncFunc.js";
import { sendEmail } from '../service/SendEmail.js';


const createProject = asyncFunc(async(req, res)=>{
    const { projectName, description } = req.body;
    const org = req.org;
    const user = req.user;
    if(!projectName){
        throw new ApiError(
            400,
            "project Name is required"
        )
    };
    const project = await Project.create({
        createdBy:user._id,
        inOrg:org._id,
        projectName,
        description:description || "",
        members:[{
            member:user._id,
            role:'admin'
        }],
    });
    if(!project){
        throw new ApiError(
            500,
            "Failed to create project due to server error, please try again later"
        )
    };
    user.inProject.push({
        project:project._id,
        role:'admin'
    });
    await user.save();
    org.timeline.push({
        text:`<b>${user.userName}</b> created a project - <i>${projectName}</i>.`
    })
    org.projects.push(project._id);
    await org.save();
    const populatedProject = await Project.findById(project._id).populate([
        {
            path:"createdBy",
            select:"userName email profilePhoto"
        },{
            path:"members.member",
            select:"userName email profilePhoto"
        }
    ])
    return res.status(200)
    .json(
        new ApiRes(
            200,
            populatedProject,
            "project created successfully"
        )
    )
});

const updateProject = asyncFunc(async(req, res)=>{
    const { projectName, description } = req.body;
    const project = req.project;
    const user = req.user;
    if(projectName) project.projectName = projectName;
    if(description) project.description = description || "";
    await project.save();
    return res.status(200)
    .json(
        new ApiRes(
            200,
            project,
            "project details updated successfully"
        )
    );
});

const deleteProject = asyncFunc(async(req, res)=>{
    const project = req.project;
    const org = req.org;
    const user = req.user;
    if(user._id.toString() !== project.createdBy.toString()){
        throw new ApiError(
            403,
            "Only project owner can delete the project."
        )
    }
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      
        org.projects = org.projects.filter(
            (p) => p.toString() !== project._id.toString()
        );
        org.timeline.push({
            text:`<b>${user.userName}</b> delete the project - <i>${project.projectName}</i>`
        });
        await org.save({ session });
        const memberIds = project.members.map((m) => m.member);
        await User.updateMany(
            { _id:{
                $in:memberIds
              }
            },{
                $pull:{
                    inProject:{
                        project:project._id
                    }
                }
            },{ session }
        );  
        await Team.updateMany(
            { inOrg:org._id},{
                $pull:{
                    projects:project._id
                }
            },{ session }
        );
        await Project.deleteOne({
            _id:project._id
        },{ session });
        await session.commitTransaction();
        session.endSession();
        return res.status(200)
        .json(
            new ApiRes(
                200,
                null,
                "Project deleted successfully"
            )
        );
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw new ApiError(
            500,
            "Failed to delete Project due to server error, please try again later"
        )
    };
});

const addMemberInProject = asyncFunc(async(req, res)=>{
    const { memberId } = req.params;
    const { asRoleOf } = req.body;
    const project = req.project;
    const user = req.user;
    const org = req.org;
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
        throw new ApiError(400, "Invalid member ID");
    };
    const isMemberInOrg  = org.members.some(
        (m) => m.member.toString() == memberId.toString()
    );
    if(!isMemberInOrg){
        throw new ApiError(
            404,
            "Member not part of this organization"
        )
    };
    const isMemberInProject = project.members.some(
        (m) => m.member.toString() == memberId.toString()
    );
    if(isMemberInProject){
        throw new ApiError(
            403,
            "Member is already part of this project"
        )
    };
    const member = await User.findByIdAndUpdate(memberId, {
        $push:{
            inProject:{
                project:project._id,
                role:asRoleOf || "member"
            }
        }
    });
    project.members.push({
        member:memberId,
        role:asRoleOf || "member"
    });
    await project.save();
    const populatedProject = await project.populate([
        {
            path: "createdBy",
            select: "userName email profilePhoto"
        },
        {
            path: "members.member",
            select: "userName email profilePhoto"
        }
    ]);
    sendEmail({
        to:member.email,
        subject:`You've been added to project: ${project.projectName}`,
        html : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #fdfdfd;">
            <h2 style="color: #333;">👋 Hello ${member.userName},</h2>
            <p style="font-size: 16px; color: #444;">
              You have been successfully added to the project - <strong>${project.projectName}</strong> in the organization - <span style="color:green">${org.orgName}</span>
            </p>
            <p style="font-size: 15px; color: #555;">
              <strong>Added by:</strong> ${user.userName}
            </p>
            <p style="font-size: 15px; color: #555;">
              You can now collaborate with the team on this project.
            </p>
          </div>
          `
    })
    return res.status(200)
    .json(
        new ApiRes(
            200,
            populatedProject,
            "Member successfully added in to project"
        )
    );
});

const addTeamInProject = asyncFunc(async(req, res)=>{
    const { teamId } = req.params;
    const { asRoleOf } = req.body;
    const project = req.project;
    const org = req.org;
    const user = req.user;
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
        throw new ApiError(400, "Invalid team ID");
    };
    const team = await Team.findOne(
        { _id: teamId, inOrg:org._id}
    ).populate({
        path:'members.member',
        select:"userName email"
    });
    if(!team){
        throw new ApiError(
            404,
            "Team not found in this organization"
        )
    };
    const isTeamInProject = project.teams.some(t => t.toString() === teamId.toString());
    if (isTeamInProject) {
        throw new ApiError(
            403,
            "Team is already in this project"
        )
    };
    project.teams.push(team._id);
    const addedMemberIds = new Set(project.members.map(m => m.member.toString()));
    const newlyAddedUsers = [];
    for (const tm of team.members) {
        const memberId = tm.member._id.toString();
        const role = asRoleOf || "member";
        if (!addedMemberIds.has(memberId)) {
            project.members.push({ member: tm.member._id, role });
            await User.updateOne(
                { _id: tm.member._id },
                {
                    $addToSet: {
                        inProject: {
                            project: project._id,
                            role
                        }
                    }
                }
            );
            newlyAddedUsers.push(tm.member);
            addedMemberIds.add(memberId); 
        }
    };
    await project.save();
    const populatedProject = await project.populate([
        { path: "createdBy", select: "userName email" },
        { path: "members.member", select: "userName email profilePhoto" },
        { path: "teams", select: "teamName" }
    ]);
    for (const member of newlyAddedUsers) {
        sendEmail({
            to: member.email,
            subject: `You've been added to project: ${project.projectName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #fdfdfd;">
                    <h2 style="color: #333;">👋 Hello ${member.userName},</h2>
                    <p style="font-size: 16px; color: #444;">
                        You have been successfully added to the project - <strong>${project.projectName}</strong> in the organization - <span style="color:green">${org.orgName}</span>
                    </p>
                    <p style="font-size: 15px; color: #555;">
                        <strong>Added by:</strong> ${user.userName}
                    </p>
                    <p style="font-size: 15px; color: #555;">
                        You can now collaborate with the team on this project.
                    </p>
                </div>
            `
        });
    };
    return res.status(200)
    .json(
        new ApiRes(
            200,
            populatedProject,
            `Team '${team.teamName}' and its members added to the project`
        )
    );
});




export {
    createProject,
    updateProject,
    deleteProject,
    addMemberInProject,
    addTeamInProject,
}