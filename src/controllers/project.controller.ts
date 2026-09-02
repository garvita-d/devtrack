import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as projectService from "../services/project.service";
import { AppError } from "../utils/AppError";

export const createProject = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const project = await projectService.createProject(req.user.userId, req.body);
  res.status(201).json({ success: true, data: { project } });
});

export const listMyProjects = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const projects = await projectService.listMyProjects(req.user.userId);
  res.status(200).json({ success: true, data: { projects } });
});

export const getProject = catchAsync(async (req: Request, res: Response) => {
  const project = await projectService.getProjectById(req.params.id);
  res.status(200).json({ success: true, data: { project } });
});

export const updateProject = catchAsync(async (req: Request, res: Response) => {
  const project = await projectService.updateProject(req.params.id, req.body);
  res.status(200).json({ success: true, data: { project } });
});

export const deleteProject = catchAsync(async (req: Request, res: Response) => {
  await projectService.deleteProject(req.params.id);
  res.status(200).json({ success: true, message: "Project deleted" });
});
