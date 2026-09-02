import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as memberService from "../services/member.service";

export const listMembers = catchAsync(async (req: Request, res: Response) => {
  const members = await memberService.listMembers(req.params.id);
  res.status(200).json({ success: true, data: { members } });
});

export const addMember = catchAsync(async (req: Request, res: Response) => {
  const member = await memberService.addMember(req.params.id, req.body);
  res.status(201).json({ success: true, data: { member } });
});

export const updateMemberRole = catchAsync(async (req: Request, res: Response) => {
  const member = await memberService.updateMemberRole(
    req.params.id,
    req.params.userId,
    req.body
  );
  res.status(200).json({ success: true, data: { member } });
});

export const removeMember = catchAsync(async (req: Request, res: Response) => {
  await memberService.removeMember(req.params.id, req.params.userId);
  res.status(200).json({ success: true, message: "Member removed" });
});
