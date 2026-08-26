import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as exportService from "./export.service";

export const exporterCsv = asyncHandler(async (req: Request, res: Response) => {
  const produitId = typeof req.query.produitId === "string" ? req.query.produitId : undefined;
  const regionId = typeof req.query.regionId === "string" ? req.query.regionId : undefined;

  const csv = await exportService.genererCsvExport({ produitId, regionId });

  const nomFichier = `sunuprix-export-${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${nomFichier}"`);
  res.status(200).send(csv);
});
