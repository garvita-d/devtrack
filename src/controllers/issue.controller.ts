import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as issueService from "../services/issue.service";
import { AppError } from "../utils/AppError";
import { ListIssuesQuery } from "../validators/issue.validators";

export const createIssue = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const issue = await issueService.createIssue(req.params.projectId, req.user.userId, req.body);
  res.status(201).json({ success: true, data: { issue } });
});

export const listIssues = catchAsync(async (req: Request, res: Response) => {
  const result = await issueService.listIssues(
    req.params.projectId,
    req.query as unknown as ListIssuesQuery
  );
  res.status(200).json({ success: true, data: result });
});

// Mounted after loadIssueContext, so membership is already verified.
export const getIssue = catchAsync(async (req: Request, res: Response) => {
  const issue = await issueService.getIssueById(req.params.id);
  res.status(200).json({ success: true, data: { issue } });
});

export const updateIssue = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.issue || !req.projectRole) throw AppError.unauthorized();
  issueService.assertCanMutateIssue(req.issue, req.user.userId, req.projectRole);
  const issue = await issueService.updateIssue(req.issue.id, req.body);
  res.status(200).json({ success: true, data: { issue } });
});

export const deleteIssue = catchAsync(async (req: Request, res: Response) => {
  if (!req.user || !req.issue || !req.projectRole) throw AppError.unauthorized();
  issueService.assertCanMutateIssue(req.issue, req.user.userId, req.projectRole);
  await issueService.deleteIssue(req.issue.id);
  res.status(200).json({ success: true, message: "Issue deleted" });
});
