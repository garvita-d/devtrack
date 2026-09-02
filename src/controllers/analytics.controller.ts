import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as analyticsService from "../services/analytics.service";

export const getProjectAnalytics = catchAsync(async (req: Request, res: Response) => {
  const analytics = await analyticsService.getProjectAnalytics(req.params.id);
  res.status(200).json({ success: true, data: { analytics } });
});
