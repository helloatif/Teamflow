import type { Response, NextFunction } from 'express';
import type { TeamService } from '../services/teamService.js';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import type { TeamRole } from '../repositories/teamRepository.js';

export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const team = await this.teamService.createTeam({
        name: req.body.name,
        description: req.body.description,
        creatorId: req.user!.sub,
      });

      res.status(201).json({ success: true, data: team });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const teams = await this.teamService.getTeamsForUser(req.user!.sub);
      res.json({ success: true, data: teams });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const team = await this.teamService.getTeamById(String(req.params.id), req.user!.sub);
      res.json({ success: true, data: team });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const team = await this.teamService.updateTeam(String(req.params.id), req.user!.sub, {
        name: req.body.name,
        description: req.body.description,
      });

      res.json({ success: true, data: team });
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.teamService.deleteTeam(String(req.params.id), req.user!.sub);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  inviteMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const member = await this.teamService.inviteMember(
        String(req.params.id),
        req.user!.sub,
        String(req.body.userId ?? '')
      );
      res.status(201).json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  };

  listMembers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const members = await this.teamService.listMembers(String(req.params.id), req.user!.sub);
      res.json({ success: true, data: members });
    } catch (error) {
      next(error);
    }
  };

  removeMember = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.teamService.removeMember(
        String(req.params.id),
        req.user!.sub,
        String(req.params.userId)
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  changeMemberRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const member = await this.teamService.changeRole(
        String(req.params.id),
        req.user!.sub,
        String(req.params.userId),
        String(req.body.role ?? '') as TeamRole
      );
      res.json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  };
}
